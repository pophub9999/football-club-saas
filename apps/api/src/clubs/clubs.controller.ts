import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { ClubsService } from './clubs.service';
import { UpdateMatchdayDto } from './dto/update-matchday.dto';

@Controller('clubs')
@UseGuards(JwtAuthGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Get('current/branding')
  getCurrentBranding(@UserRequest() user: AuthenticatedUser) {
    return this.clubsService.getBranding(user.tenantId);
  }

  @Get('current/matchday')
  getCurrentMatchday(@UserRequest() user: AuthenticatedUser) {
    return this.clubsService.getMatchdaySettings(user.tenantId);
  }
}

@Controller('admin/clubs')
@UseGuards(JwtAuthGuard)
export class ClubsMatchdayAdminController {
  constructor(private readonly clubsService: ClubsService) {}

  @Put('matchday')
  updateMatchday(@UserRequest() user: AuthenticatedUser, @Body() dto: UpdateMatchdayDto) {
    return this.clubsService.updateMatchdaySettings(user.tenantId, user.id, user.roles, dto);
  }
}
