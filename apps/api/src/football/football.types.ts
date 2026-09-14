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

export interface FootballProvider {
  readonly name: string;
  listUpcomingFixtures(tenantId: string, from: Date, to: Date): Promise<FootballFixture[]>;
}
