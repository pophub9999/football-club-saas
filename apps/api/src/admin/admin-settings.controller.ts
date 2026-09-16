import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AdminSettingsService } from './admin-settings.service';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  get(@UserRequest() user: AuthenticatedUser) {
    return this.settings.get(user.tenantId, user.roles);
  }

  @Put()
  update(@UserRequest() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    return this.settings.update(user.tenantId, user.roles, body);
  }
}
