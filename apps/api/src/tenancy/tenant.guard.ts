import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContext) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    this.tenantContext.set(tenantId);
    return true;
  }
}
