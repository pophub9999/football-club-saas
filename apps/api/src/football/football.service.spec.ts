import { FootballService } from './football.service';

function makePrisma(fixtures: unknown[]) {
  return {
    fixture: {
      findMany: jest.fn().mockResolvedValue(fixtures),
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    competition: { upsert: jest.fn() },
    team: { upsert: jest.fn() },
  } as any;
}

describe('FootballService', () => {
  it('scopes upcoming fixtures to the authenticated tenant and orders by kickoff', async () => {
    const prisma = makePrisma([
      { id: 'f2', tenantId: 'tenant-a', kickoffAt: new Date('2026-09-22T20:00:00Z') },
      { id: 'f1', tenantId: 'tenant-a', kickoffAt: new Date('2026-09-18T20:00:00Z') },
    ]);
    const service = new FootballService(prisma, { name: 'mock' } as any);

    const result = await service.getUpcomingFixtures('tenant-a', 10, new Date('2026-09-14T00:00:00Z'));

    expect(prisma.fixture.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-a', kickoffAt: { gte: new Date('2026-09-14T00:00:00Z') } },
      orderBy: { kickoffAt: 'asc' },
      take: 10,
    }));
    expect(result.map((fixture: any) => fixture.id)).toEqual(['f2', 'f1']);
  });

  it('caps the requested limit at 50', async () => {
    const prisma = makePrisma([]);
    const service = new FootballService(prisma, { name: 'mock' } as any);

    await service.getUpcomingFixtures('tenant-b', 500);

    expect(prisma.fixture.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });
});
