import { Module, Global } from '@nestjs/common';
import { TenantContext } from './tenant-context';
import { TenantGuard } from './tenant.guard';

@Global()
@Module({
  providers: [TenantContext, TenantGuard],
  exports: [TenantContext, TenantGuard],
})
export class TenancyModule {}
