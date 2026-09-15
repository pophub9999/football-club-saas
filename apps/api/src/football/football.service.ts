import { Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FootballFixture, FootballProvider } from './football.types';

@Injectable()
export class FootballService {
  constructor(private readonly prisma: PrismaService, private readonly provider: FootballProvider) {}

  async getUpcomingFixtures(tenantId: string, limit = 10, from = new Date()) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.prisma.fixture.findMany({
      where: { tenantId, kickoffAt: { gte: from } }, orderBy: { kickoffAt: 'asc' }, take: safeLimit,
      include: {
        competition: { select: { id: true, name: true, logoUrl: true, country: true, season: true } },
        homeTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      },
    });
  }

  async getFixture(tenantId: string, fixtureId: string) {
    const fixture = await this.prisma.fixture.findFirst({ where: { id: fixtureId, tenantId }, include: { competition: true, homeTeam: true, awayTeam: true } });
    if (!fixture) throw new NotFoundException('Fixture not found');
    const details = this.provider.getFixtureDetails
      ? await this.provider.getFixtureDetails(fixture.externalId)
      : { events: [], lineups: [], stats: [] };
    return { ...fixture, ...details };
  }

  async getStandings(seasonExternalId: string) {
    if (!this.provider.getStandings) throw new NotImplementedException(`Football provider ${this.provider.name} does not support standings`);
    return this.provider.getStandings(seasonExternalId);
  }

  async getCurrentStandings(tenantId: string) {
    let seasonExternalId: string | undefined;
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { homeConfiguration: true } });
    const homeConfiguration = settings?.homeConfiguration;
    if (homeConfiguration && typeof homeConfiguration === 'object' && !Array.isArray(homeConfiguration)) {
      const configured = (homeConfiguration as Record<string, unknown>).footballSeasonId;
      if (typeof configured === 'string' && configured.trim()) seasonExternalId = configured.trim();
      if (typeof configured === 'number') seasonExternalId = String(configured);
    }
    if (!seasonExternalId && this.provider.name === 'mock') seasonExternalId = 'mock-season';
    if (!seasonExternalId) throw new NotFoundException('No football season configured for this club');
    const standings = await this.getStandings(seasonExternalId);
    return { seasonId: seasonExternalId, provider: this.provider.name, standings };
  }

  async getTeams(tenantId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.prisma.team.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: { id: true, externalId: true, provider: true, name: true, shortName: true, logoUrl: true },
    });
  }

  async getSquad(tenantId: string, teamId: string, seasonExternalId?: string) {
    if (!this.provider.getSquad) throw new NotImplementedException(`Football provider ${this.provider.name} does not support team squads`);
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, tenantId },
      select: { id: true, externalId: true, provider: true, name: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    let seasonId = seasonExternalId?.trim() || undefined;
    if (!seasonId) {
      const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { homeConfiguration: true } });
      const homeConfiguration = settings?.homeConfiguration;
      if (homeConfiguration && typeof homeConfiguration === 'object' && !Array.isArray(homeConfiguration)) {
        const configured = (homeConfiguration as Record<string, unknown>).footballSeasonId;
        if (typeof configured === 'string' && configured.trim()) seasonId = configured.trim();
        if (typeof configured === 'number') seasonId = String(configured);
      }
    }

    const players = await this.provider.getSquad(team.externalId, seasonId);
    return { teamId: team.id, teamExternalId: team.externalId, teamName: team.name, seasonId: seasonId ?? null, provider: this.provider.name, players };
  }

  async getPlayer(externalPlayerId: string, seasonExternalId?: string) {
    if (!this.provider.getPlayer) throw new NotImplementedException(`Football provider ${this.provider.name} does not support player profiles`);
    return this.provider.getPlayer(externalPlayerId, seasonExternalId);
  }

  async getCurrentPlayer(tenantId: string, externalPlayerId: string) {
    let seasonExternalId: string | undefined;
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { homeConfiguration: true } });
    const homeConfiguration = settings?.homeConfiguration;
    if (homeConfiguration && typeof homeConfiguration === 'object' && !Array.isArray(homeConfiguration)) {
      const configured = (homeConfiguration as Record<string, unknown>).footballSeasonId;
      if (typeof configured === 'string' && configured.trim()) seasonExternalId = configured.trim();
      if (typeof configured === 'number') seasonExternalId = String(configured);
    }
    return this.getPlayer(externalPlayerId, seasonExternalId);
  }

  async syncUpcomingFixtures(tenantId: string, days = 45) {
    const from = new Date();
    const to = new Date(from.getTime() + Math.min(Math.max(days, 1), 180) * 24 * 60 * 60 * 1000);
    const incoming = await this.provider.listUpcomingFixtures(tenantId, from, to);
    for (const fixture of incoming) await this.upsertFixture(tenantId, fixture);
    return { provider: this.provider.name, synced: incoming.length };
  }

  private async upsertFixture(tenantId: string, fixture: FootballFixture) {
    const competition = fixture.competitionExternalId ? await this.prisma.competition.upsert({
      where: { tenantId_provider_externalId: { tenantId, provider: this.provider.name, externalId: fixture.competitionExternalId } },
      create: { tenantId, provider: this.provider.name, externalId: fixture.competitionExternalId, name: 'Competição de demonstração', country: 'Portugal', season: '2026/27' }, update: {},
    }) : null;
    const homeTeam = await this.prisma.team.upsert({
      where: { tenantId_provider_externalId: { tenantId, provider: this.provider.name, externalId: fixture.homeTeamExternalId } },
      create: { tenantId, provider: this.provider.name, externalId: fixture.homeTeamExternalId, name: 'Clube da Casa', shortName: 'Casa' }, update: {},
    });
    const awayTeam = await this.prisma.team.upsert({
      where: { tenantId_provider_externalId: { tenantId, provider: this.provider.name, externalId: fixture.awayTeamExternalId } },
      create: { tenantId, provider: this.provider.name, externalId: fixture.awayTeamExternalId, name: 'Próximo Adversário', shortName: 'Adversário' }, update: {},
    });
    return this.prisma.fixture.upsert({
      where: { tenantId_provider_externalId: { tenantId, provider: this.provider.name, externalId: fixture.externalId } },
      create: { tenantId, provider: this.provider.name, externalId: fixture.externalId, competitionId: competition?.id ?? null, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, kickoffAt: fixture.kickoffAt, status: fixture.status, venueName: fixture.venueName ?? null, venueCity: fixture.venueCity ?? null, homeScore: fixture.homeScore ?? null, awayScore: fixture.awayScore ?? null },
      update: { competitionId: competition?.id ?? null, homeTeamId: homeTeam.id, awayTeamId: awayTeam.id, kickoffAt: fixture.kickoffAt, status: fixture.status, venueName: fixture.venueName ?? null, venueCity: fixture.venueCity ?? null, homeScore: fixture.homeScore ?? null, awayScore: fixture.awayScore ?? null },
    });
  }
}
