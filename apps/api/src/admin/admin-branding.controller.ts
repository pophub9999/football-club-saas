import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AdminBrandingService } from './admin-branding.service';

@Controller('admin/branding')
@UseGuards(JwtAuthGuard)
export class AdminBrandingController {
  constructor(private readonly branding: AdminBrandingService) {}

  @Get()
  get(@UserRequest() user: AuthenticatedUser) {
    return this.branding.get(user.tenantId, user.roles);
  }

  @Put()
  update(@UserRequest() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    return this.branding.update(user.tenantId, user.roles, body);
  }
}
