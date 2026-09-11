import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get('current/branding')
  @UseGuards(JwtAuthGuard)
  getCurrentBranding(@UserRequest() user: AuthenticatedUser) {
    return this.clubsService.getBranding(user.tenantId);
  }
}
