import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { SportmonksFootballProvider } from './sportmonks-football.provider';

describe('SportmonksFootballProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('maps fixtures and filters the requested date window', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: 123,
            starting_at: '2026-09-20T19:00:00Z',
            league_id: 8,
            participants: [
              { id: 10, meta: { location: 'home' } },
              { id: 20, meta: { location: 'away' } },
            ],
            scores: [
              { participant_id: 10, description: 'CURRENT', goals: { value: 2 } },
              { participant_id: 20, description: 'CURRENT', goals: { value: 1 } },
            ],
            state: { short_name: 'LIVE' },
            venue: { name: 'Arena', city: 'Lisbon' },
          },
          {
            id: 999,
            starting_at: '2026-10-05T19:00:00Z',
            participants: [{ id: 1 }, { id: 2 }],
          },
        ],
      }),
    } as Response);

    const config = {
      get: jest.fn((key: string) => key === 'SPORTMONKS_API_TOKEN' ? 'test-token' : undefined),
    } as unknown as ConfigService;
    const provider = new SportmonksFootballProvider(config);

    const result = await provider.listUpcomingFixtures(
      'tenant-a',
      new Date('2026-09-19T00:00:00Z'),
      new Date('2026-09-21T23:59:59Z'),
    );

    expect(result).toEqual([
      expect.objectContaining({
        externalId: '123',
        competitionExternalId: '8',
        homeTeamExternalId: '10',
        awayTeamExternalId: '20',
        status: 'LIVE',
        venueName: 'Arena',
        venueCity: 'Lisbon',
        homeScore: 2,
        awayScore: 1,
      }),
    ]);
    const fetchMock = global.fetch as jest.Mock;
    expect(String(fetchMock.mock.calls[0][0])).toEqual(
      expect.stringContaining('/fixtures/between/2026-09-19/2026-09-21'),
    );
  });

  it('maps match centre collections from a fixture detail response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 123,
          events: [{ id: 1, minute: 42 }],
          lineups: [{ id: 2, formation_position: 9 }],
          statistics: [{ id: 3, value: 55 }],
        },
      }),
    } as Response);

    const config = {
      get: jest.fn((key: string) => key === 'SPORTMONKS_API_TOKEN' ? 'test-token' : undefined),
    } as unknown as ConfigService;
    const provider = new SportmonksFootballProvider(config);

    await expect(provider.getFixtureDetails('123')).resolves.toEqual({
      events: [{ id: 1, minute: 42 }],
      lineups: [{ id: 2, formation_position: 9 }],
      stats: [{ id: 3, value: 55 }],
    });
    const fetchMock = global.fetch as jest.Mock;
    expect(String(fetchMock.mock.calls[0][0])).toEqual(
      expect.stringContaining('/fixtures/123'),
    );
  });

  it('maps season standings and includes participant details', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          id: 42,
          participant_id: 53,
          position: 1,
          points: 73,
          result: 'up',
          participant: { id: 53, name: 'Clube A', short_code: 'AFC', image_path: 'https://cdn.example/a.png' },
          details: [
            { type: { name: 'Overall Matched Played' }, value: 30 },
            { type: { name: 'Overall Won' }, value: 22 },
            { type: { name: 'Overall Drawn' }, value: 7 },
            { type: { name: 'Overall Lost' }, value: 1 },
            { type: { name: 'Overall Goals For' }, value: 68 },
            { type: { name: 'Overall Goals Against' }, value: 20 },
          ],
        }],
      }),
    } as Response);

    const config = {
      get: jest.fn((key: string) => key === 'SPORTMONKS_API_TOKEN' ? 'test-token' : undefined),
    } as unknown as ConfigService;
    const provider = new SportmonksFootballProvider(config);

    await expect(provider.getStandings('19735')).resolves.toEqual([expect.objectContaining({
      externalId: '42',
      position: 1,
      teamExternalId: '53',
      teamName: 'Clube A',
      teamShortName: 'AFC',
      points: 73,
      played: 30,
      won: 22,
      drawn: 7,
      lost: 1,
      goalsFor: 68,
      goalsAgainst: 20,
      goalDifference: 48,
      result: 'up',
    })]);

    const fetchMock = global.fetch as jest.Mock;
    expect(String(fetchMock.mock.calls[0][0])).toEqual(
      expect.stringContaining('/standings/seasons/19735'),
    );
  });

  it('maps a player profile and statistics', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 758,
          name: 'James Tavernier',
          display_name: 'J. Tavernier',
          image_path: 'https://cdn.example/player.png',
          date_of_birth: '1991-10-31',
          height: 182,
          weight: 72,
          nationality: { name: 'England' },
          position: { name: 'Defender' },
          detailedPosition: { name: 'Right Back' },
          teams: [{ team: { id: 1, name: 'Rangers' } }],
          statistics: [{ team: { name: 'Rangers' }, season: { name: '2026/27', league: { name: 'League' } }, details: [{ type: { name: 'Goals' }, value: 4 }] }],
        },
      }),
    } as Response);

    const config = {
      get: jest.fn((key: string) => key === 'SPORTMONKS_API_TOKEN' ? 'test-token' : undefined),
    } as unknown as ConfigService;
    const provider = new SportmonksFootballProvider(config);

    await expect(provider.getPlayer('758', '19735')).resolves.toEqual(expect.objectContaining({
      externalId: '758',
      name: 'James Tavernier',
      displayName: 'J. Tavernier',
      imageUrl: 'https://cdn.example/player.png',
      nationality: 'England',
      position: 'Defender',
      detailedPosition: 'Right Back',
      teams: expect.any(Array),
      statistics: expect.any(Array),
    }));

    const fetchMock = global.fetch as jest.Mock;
    expect(String(fetchMock.mock.calls[0][0])).toEqual(expect.stringContaining('/players/758'));
    expect(String(fetchMock.mock.calls[0][0])).toEqual(expect.stringContaining('filters=playerStatisticSeasons%3A19735'));
  });

  it('fails clearly when no Sportmonks token is configured', async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;
    const config = { get: jest.fn(() => undefined) } as unknown as ConfigService;
    const provider = new SportmonksFootballProvider(config);

    await expect(provider.listUpcomingFixtures('tenant-a', new Date(), new Date())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
