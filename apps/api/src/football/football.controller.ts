import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { FootballService } from './football.service';

@Controller('football')
@UseGuards(JwtAuthGuard)
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('fixtures/upcoming')
  upcoming(@UserRequest() user: AuthenticatedUser, @Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.footballService.getUpcomingFixtures(user.tenantId, limit);
  }

  @Get('fixtures/:fixtureId')
  getFixture(@UserRequest() user: AuthenticatedUser, @Param('fixtureId') fixtureId: string) {
    return this.footballService.getFixture(user.tenantId, fixtureId);
  }

  @Get('standings/current')
  getCurrentStandings(@UserRequest() user: AuthenticatedUser) {
    return this.footballService.getCurrentStandings(user.tenantId);
  }

  @Get('standings/:seasonId')
  getStandings(@Param('seasonId') seasonId: string) {
    return this.footballService.getStandings(seasonId);
  }

  @Get('teams')
  getTeams(@UserRequest() user: AuthenticatedUser, @Query('limit', new ParseIntPipe({ optional: true })) limit?: number) {
    return this.footballService.getTeams(user.tenantId, limit);
  }

  @Get('teams/:teamId/squad')
  getSquad(@UserRequest() user: AuthenticatedUser, @Param('teamId') teamId: string, @Query('seasonId') seasonId?: string) {
    return this.footballService.getSquad(user.tenantId, teamId, seasonId);
  }

  @Get('players/:playerId')
  getPlayer(@UserRequest() user: AuthenticatedUser, @Param('playerId') playerId: string, @Query('seasonId') seasonId?: string) {
    return seasonId
      ? this.footballService.getPlayer(playerId, seasonId)
      : this.footballService.getCurrentPlayer(user.tenantId, playerId);
  }
}
