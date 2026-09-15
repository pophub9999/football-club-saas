import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('returns defaults when the user has no saved preferences', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]), $executeRaw: jest.fn() } as any;
    const service = new NotificationsService(prisma);

    await expect(service.getPreferences('user-1', 'tenant-1')).resolves.toEqual({
      notifications: true,
      matchday: true,
      marketing: false,
    });
  });

  it('updates only the requested preference and preserves the others', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ notifications: true, matchday: false, marketing: false }]),
      $executeRaw: jest.fn().mockResolvedValue(1),
    } as any;
    const service = new NotificationsService(prisma);

    await expect(service.updatePreferences('user-1', 'tenant-1', { marketing: true })).resolves.toEqual({
      notifications: true,
      matchday: false,
      marketing: true,
    });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
