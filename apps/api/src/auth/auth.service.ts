import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { userTenants: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.email || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const membership = dto.tenantId
      ? user.userTenants.find((item) => item.tenantId === dto.tenantId)
      : user.userTenants.length === 1
        ? user.userTenants[0]
        : undefined;

    if (!membership) {
      throw new UnauthorizedException(
        user.userTenants.length > 1 ? 'Tenant selection is required' : 'User is not associated with a club',
      );
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      tenantId: membership.tenantId,
      email: user.email,
      roles: membership.roles,
    };

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    const accessToken = jwt.sign(authenticatedUser, secret, { expiresIn: '15m' });
    return { accessToken, user: authenticatedUser };
  }
}
