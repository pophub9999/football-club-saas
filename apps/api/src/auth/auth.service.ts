import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './auth.types';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 30;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export interface TenantSelectionOption {
  id: string;
  slug: string;
  name: string;
}

export interface TenantSelectionRequired {
  selectionRequired: true;
  clubs: TenantSelectionOption[];
}

export type LoginResult = AuthTokens | TenantSelectionRequired;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { userTenants: { include: { tenant: true } } },
    });

    if (!user || user.status !== 'ACTIVE' || !user.email || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const activeTenants = user.userTenants.filter((item) => item.tenant.status.toLowerCase() === 'active');

    if (!dto.tenantId && activeTenants.length > 1) {
      return {
        selectionRequired: true,
        clubs: activeTenants.map((item) => ({ id: item.tenantId, slug: item.tenant.slug, name: item.tenant.name })),
      };
    }

    const membership = dto.tenantId
      ? activeTenants.find((item) => item.tenantId === dto.tenantId)
      : activeTenants[0];

    if (!membership) {
      throw new UnauthorizedException('User is not associated with an active club');
    }

    return this.issueTokens({
      id: user.id,
      tenantId: membership.tenantId,
      email: user.email,
      roles: membership.roles,
    });
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true, tenant: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== 'ACTIVE' ||
      session.tenant.status.toLowerCase() !== 'active' ||
      !session.user.email
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const membership = await this.prisma.userTenant.findUnique({
      where: { userId_tenantId: { userId: session.userId, tenantId: session.tenantId } },
    });

    if (!membership) {
      throw new UnauthorizedException('User is no longer associated with this club');
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });

    return this.issueTokens({
      id: session.user.id,
      tenantId: membership.tenantId,
      email: session.user.email,
      roles: membership.roles,
    });
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });
    return { success: true };
  }

  private async issueTokens(user: AuthenticatedUser): Promise<AuthTokens> {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    const accessToken = jwt.sign(user, secret, { expiresIn: ACCESS_TOKEN_TTL });
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        refreshTokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    });

    return { accessToken, refreshToken, user };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
