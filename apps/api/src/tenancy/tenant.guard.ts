import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContext) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: { tenantId?: string } }>();
    const tenantId = request.user?.tenantId ?? request.header('x-tenant-id');

    if (!tenantId) {
      throw new UnauthorizedException('Tenant context is required');
    }

    this.tenantContext.set(tenantId);
    return true;
  }
}
