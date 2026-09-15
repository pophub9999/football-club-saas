export interface FootballCompetition {
  externalId: string;
  name: string;
  country?: string;
  season?: string;
  logoUrl?: string;
}

export interface FootballTeam {
  externalId: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface FootballFixture {
  externalId: string;
  competitionExternalId?: string;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  kickoffAt: Date;
  status: string;
  venueName?: string;
  venueCity?: string;
  homeScore?: number;
  awayScore?: number;
}

export interface FootballFixtureDetails {
  events: Record<string, unknown>[];
  lineups: Record<string, unknown>[];
  stats: Record<string, unknown>[];
}

export interface FootballStanding {
  externalId: string;
  position: number;
  teamExternalId: string;
  teamName?: string;
  teamShortName?: string;
  teamLogoUrl?: string;
  points: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  result?: string;
}

export interface FootballProvider {
  readonly name: string;
  listUpcomingFixtures(tenantId: string, from: Date, to: Date): Promise<FootballFixture[]>;
  getFixtureDetails?(externalFixtureId: string): Promise<FootballFixtureDetails>;
  getStandings?(seasonExternalId: string): Promise<FootballStanding[]>;
}
