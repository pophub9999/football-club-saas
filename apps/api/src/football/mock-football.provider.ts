import { Injectable } from '@nestjs/common';
import { FootballFixture, FootballProvider, FootballStanding } from './football.types';

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

  async getStandings(_seasonExternalId: string): Promise<FootballStanding[]> {
    return [
      { externalId: 'mock-standing-1', position: 1, teamExternalId: 'mock-home', teamName: 'Clube da Casa', teamShortName: 'Casa', points: 9, played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 7, goalsAgainst: 2, goalDifference: 5, result: 'equal' },
      { externalId: 'mock-standing-2', position: 2, teamExternalId: 'mock-away', teamName: 'Próximo Adversário', teamShortName: 'Adv.', points: 6, played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, result: 'equal' },
    ];
  }
}
