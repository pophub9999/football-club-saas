import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const authorization = request.header('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!token || !secret) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload !== 'object' || !payload) {
        throw new Error('Invalid token payload');
      }
      const { id, tenantId, email, roles } = payload as Record<string, unknown>;
      if (typeof id !== 'string' || typeof tenantId !== 'string' || typeof email !== 'string' || !Array.isArray(roles)) {
        throw new Error('Invalid token claims');
      }
      request.user = { id, tenantId, email, roles: roles.filter((role): role is string => typeof role === 'string') };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
