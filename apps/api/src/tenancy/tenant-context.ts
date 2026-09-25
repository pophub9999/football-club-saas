import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  private tenantId?: string;

  set(tenantId: string): void {
    this.tenantId = tenantId;
  }

  get(): string {
    if (!this.tenantId) {
      throw new Error('Tenant context has not been initialized');
    }
    return this.tenantId;
  }
}
