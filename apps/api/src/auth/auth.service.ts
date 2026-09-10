import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), status: 'ACTIVE' },
      select: { id: true, tenantId: true, email: true, passwordHash: true },
    });

    if (!user || !user.tenantId || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Password verification is intentionally isolated here so the hashing implementation
    // can be replaced with Argon2 without changing controllers or the domain model.
    const passwordMatches = false;
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: { id: user.id, tenantId: user.tenantId, email: user.email, roles: [] },
    };
  }
}
