import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { FootballService } from './football.service';

@Controller('admin/football')
@UseGuards(JwtAuthGuard)
export class AdminFootballController {
  constructor(private readonly footballService: FootballService) {}

  @Post('sync')
  sync(@UserRequest() user: AuthenticatedUser, @Body() body: { days?: number }) {
    if (!user.roles.some((role) => role === 'club_owner' || role === 'club_admin' || role === 'club_admin')) {
      return { forbidden: true };
    }
    return this.footballService.syncUpcomingFixtures(user.tenantId, body?.days);
  }
}
