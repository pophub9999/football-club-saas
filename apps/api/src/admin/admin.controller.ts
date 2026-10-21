import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard(@UserRequest() user: AuthenticatedUser) {
    return this.admin.dashboard(user.tenantId, user.roles);
  }

  @Get('members')
  members(@UserRequest() user: AuthenticatedUser) {
    return this.admin.members(user.tenantId, user.roles);
  }

  @Get('dues')
  dues(@UserRequest() user: AuthenticatedUser) {
    return this.admin.dues(user.tenantId, user.roles);
  }
}
