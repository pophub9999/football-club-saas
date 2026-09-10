import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  async login(dto: LoginDto): Promise<{ accessToken: string; user: AuthenticatedUser }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), status: 'ACTIVE' },
      select: { id: true, tenantId: true, email: true, passwordHash: true },
    });

    if (!user || !user.tenantId || !user.email || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: [],
    };

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT_ACCESS_SECRET is not configured');
    }

    const accessToken = jwt.sign(authenticatedUser, secret, { expiresIn: '15m' });
    return { accessToken, user: authenticatedUser };
  }

  constructor(private readonly prisma: PrismaService) {}
}
