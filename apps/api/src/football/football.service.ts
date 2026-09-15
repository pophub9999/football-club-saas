import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MockFootballProvider } from './mock-football.provider';
import { FootballFixture } from './football.types';

@Injectable()
export class FootballService {
  constructor(private readonly prisma: PrismaService, private readonly provider: MockFootballProvider) {}

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
    // Provider-shaped sections are exposed now so the mobile contract is stable.
    // They remain empty until a live football provider supplies those datasets.
    return { ...fixture, events: [], lineups: [], stats: [] };
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
