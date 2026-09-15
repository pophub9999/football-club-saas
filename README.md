# football-club-saas
Adepto app

## Football provider

The API supports two football data providers:

- `mock` — default, deterministic local/test data.
- `sportmonks` — production football data through Sportmonks v3.

Configure the provider with environment variables in the API:

```env
FOOTBALL_PROVIDER=mock
SPORTMONKS_API_TOKEN=
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3/football
```

For Sportmonks, set `FOOTBALL_PROVIDER=sportmonks` and provide `SPORTMONKS_API_TOKEN`. The API never exposes the provider token to the mobile application.

The Sportmonks adapter uses the fixture date-range endpoint for upcoming fixtures and requests fixture details with participants, scores, state, venue, events, lineups and statistics. CI tests mock the HTTP response, so a real provider token is not required to run the test suite.

## Match Centre

The mobile Match Centre consumes the backend fixture-detail contract and renders only data returned by the configured provider. Events, lineups and statistics are not fabricated when the provider has no data.

## Local validation

```bash
pnpm --filter @football/api prisma:validate
pnpm --filter @football/api prisma:generate
pnpm --filter @football/api typecheck
pnpm --filter @football/api test --runInBand
pnpm --filter @football/api build
```
