import { Injectable } from '@nestjs/common';
import { FootballFixture, FootballProvider } from './football.types';

@Injectable()
export class MockFootballProvider implements FootballProvider {
  readonly name = 'mock';

  async listUpcomingFixtures(_tenantId: string, from: Date, to: Date): Promise<FootballFixture[]> {
    const first = new Date(from);
    first.setDate(first.getDate() + 3);
    first.setHours(20, 15, 0, 0);

    const second = new Date(first);
    second.setDate(second.getDate() + 7);

    return [
      {
        externalId: 'mock-fixture-001',
        competitionExternalId: 'mock-league',
        homeTeamExternalId: 'mock-home',
        awayTeamExternalId: 'mock-away',
        kickoffAt: first,
        status: 'SCHEDULED',
        venueName: 'Estádio do Clube',
        venueCity: 'Lisboa',
      },
      {
        externalId: 'mock-fixture-002',
        competitionExternalId: 'mock-league',
        homeTeamExternalId: 'mock-away',
        awayTeamExternalId: 'mock-home',
        kickoffAt: second,
        status: 'SCHEDULED',
        venueName: 'Estádio Municipal',
        venueCity: 'Lisboa',
      },
    ].filter((fixture) => fixture.kickoffAt >= from && fixture.kickoffAt <= to);
  }
}
