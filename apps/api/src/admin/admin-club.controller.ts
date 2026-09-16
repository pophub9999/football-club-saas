import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AdminClubService } from './admin-club.service';

@Controller('admin/club')
@UseGuards(JwtAuthGuard)
export class AdminClubController {
  constructor(private readonly club: AdminClubService) {}

  @Get()
  get(@UserRequest() user: AuthenticatedUser) {
    return this.club.get(user.tenantId, user.roles);
  }

  @Put()
  update(@UserRequest() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    return this.club.update(user.tenantId, user.roles, body);
  }
}
