import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FootballFixture, FootballFixtureDetails, FootballProvider, FootballStanding } from './football.types';

interface SportmonksResponse {
  data?: Record<string, any>[] | Record<string, any>;
  message?: string;
}

@Injectable()
export class SportmonksFootballProvider implements FootballProvider {
  readonly name = 'sportmonks';
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = (this.config.get<string>('SPORTMONKS_BASE_URL') ?? 'https://api.sportmonks.com/v3/football').replace(/\/$/, '');
    this.token = this.config.get<string>('SPORTMONKS_API_TOKEN') ?? '';
  }

  private ensureConfigured() {
    if (!this.token) throw new ServiceUnavailableException('Sportmonks provider is not configured');
  }

  private async request(path: string, include?: string): Promise<Record<string, any> | Record<string, any>[]> {
    this.ensureConfigured();
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set('api_token', this.token);
    if (include) url.searchParams.set('include', include);

    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    const payload = (await response.json()) as SportmonksResponse;
    if (!response.ok) throw new ServiceUnavailableException(`Sportmonks request failed (${response.status})`);
    if (!payload.data) throw new ServiceUnavailableException(payload.message ?? 'Sportmonks returned no data');
    return payload.data;
  }

  async listUpcomingFixtures(_tenantId: string, from: Date, to: Date): Promise<FootballFixture[]> {
    const start = from.toISOString().slice(0, 10);
    const end = to.toISOString().slice(0, 10);
    const data = await this.request(`/fixtures/between/${start}/${end}`, 'participants;scores;state;venue;league;season');
    if (!Array.isArray(data)) return [];
    return data.map((item) => this.mapFixture(item)).filter((fixture) => fixture.kickoffAt >= from && fixture.kickoffAt <= to);
  }

  async getFixtureDetails(externalFixtureId: string): Promise<FootballFixtureDetails> {
    const data = await this.request(`/fixtures/${encodeURIComponent(externalFixtureId)}`, 'participants;scores;state;venue;league;season;events.type;lineups.player;statistics.type');
    if (Array.isArray(data)) throw new ServiceUnavailableException('Invalid Sportmonks fixture response');
    return {
      events: Array.isArray(data.events) ? data.events : [],
      lineups: Array.isArray(data.lineups) ? data.lineups : [],
      stats: Array.isArray(data.statistics) ? data.statistics : [],
    };
  }

  async getStandings(seasonExternalId: string): Promise<FootballStanding[]> {
    const data = await this.request(`/standings/seasons/${encodeURIComponent(seasonExternalId)}`, 'participant;league;details.type');
    if (!Array.isArray(data)) throw new ServiceUnavailableException('Invalid Sportmonks standings response');
    return data.map((item) => this.mapStanding(item));
  }

  private mapFixture(item: Record<string, any>): FootballFixture {
    const participants = Array.isArray(item.participants) ? item.participants : [];
    const home = participants.find((team: any) => team.meta?.location === 'home') ?? participants[0];
    const away = participants.find((team: any) => team.meta?.location === 'away') ?? participants[1];
    const scores = Array.isArray(item.scores) ? item.scores : [];
    const homeScore = this.scoreFor(scores, home?.id);
    const awayScore = this.scoreFor(scores, away?.id);

    const fixture: FootballFixture = {
      externalId: String(item.id),
      homeTeamExternalId: String(home?.id ?? 'unknown-home'),
      awayTeamExternalId: String(away?.id ?? 'unknown-away'),
      kickoffAt: new Date(item.starting_at),
      status: String(item.state?.short_name ?? item.state?.name ?? 'SCHEDULED').toUpperCase(),
    };

    if (item.league_id != null) fixture.competitionExternalId = String(item.league_id);
    if (item.venue?.name != null) fixture.venueName = String(item.venue.name);
    if (item.venue?.city != null) fixture.venueCity = String(item.venue.city);
    if (homeScore !== undefined) fixture.homeScore = homeScore;
    if (awayScore !== undefined) fixture.awayScore = awayScore;

    return fixture;
  }

  private mapStanding(item: Record<string, any>): FootballStanding {
    const participant = item.participant ?? {};
    const details = Array.isArray(item.details) ? item.details : [];
    const value = (names: string[]) => {
      const detail = details.find((entry: any) => names.includes(String(entry.type?.name ?? '').toLowerCase()));
      return typeof detail?.value === 'number' ? detail.value : undefined;
    };
    const played = value(['overall matched played', 'overall matches played']);
    const won = value(['overall won']);
    const drawn = value(['overall drawn', 'overall draws']);
    const lost = value(['overall lost']);
    const goalsFor = value(['overall goals for']);
    const goalsAgainst = value(['overall goals against']);

    const standing: FootballStanding = {
      externalId: String(item.id),
      position: Number(item.position ?? 0),
      teamExternalId: String(item.participant_id ?? participant.id ?? 'unknown'),
      points: Number(item.points ?? 0),
    };
    if (participant.name != null) standing.teamName = String(participant.name);
    if (participant.short_code != null) standing.teamShortName = String(participant.short_code);
    if (participant.image_path != null) standing.teamLogoUrl = String(participant.image_path);
    if (played !== undefined) standing.played = played;
    if (won !== undefined) standing.won = won;
    if (drawn !== undefined) standing.drawn = drawn;
    if (lost !== undefined) standing.lost = lost;
    if (goalsFor !== undefined) standing.goalsFor = goalsFor;
    if (goalsAgainst !== undefined) standing.goalsAgainst = goalsAgainst;
    if (goalsFor !== undefined && goalsAgainst !== undefined) standing.goalDifference = goalsFor - goalsAgainst;
    if (item.result != null) standing.result = String(item.result);
    return standing;
  }

  private scoreFor(scores: any[], teamId: number | undefined): number | undefined {
    if (teamId == null) return undefined;
    const score = scores.find((item) => item.participant_id === teamId && ['CURRENT', 'FT', '2ND_HALF'].includes(String(item.description ?? '').toUpperCase()));
    const value = score?.goals?.value ?? score?.score?.goals ?? score?.goals;
    return typeof value === 'number' ? value : undefined;
  }
}
