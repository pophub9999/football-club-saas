import { NotificationsService } from './notifications.service';

jest.mock('node:crypto', () => ({
  createHash: () => ({
    update: (value: string) => ({ digest: () => `hash:${value}` }),
  }),
}));

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

  it('registers a device without exposing the token in the response', async () => {
    const prisma = { $queryRaw: jest.fn(), $executeRaw: jest.fn().mockResolvedValue(1) } as any;
    const service = new NotificationsService(prisma);

    await expect(service.registerDevice('user-1', 'tenant-1', {
      token: 'fcm-token-abcdefghijklmnopqrstuvwxyz',
      platform: 'android',
      appVersion: '0.1.0',
    })).resolves.toEqual({ registered: true, platform: 'android' });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid device token', async () => {
    const prisma = { $executeRaw: jest.fn() } as any;
    const service = new NotificationsService(prisma);

    await expect(service.registerDevice('user-1', 'tenant-1', {
      token: 'short',
      platform: 'ios',
    })).rejects.toThrow('Invalid notification device token');
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('unregisters only the current tenant user device', async () => {
    const prisma = { $executeRaw: jest.fn().mockResolvedValue(1) } as any;
    const service = new NotificationsService(prisma);

    await expect(service.unregisterDevice('user-1', 'tenant-1', 'fcm-token-abcdefghijklmnopqrstuvwxyz')).resolves.toEqual({ removed: true });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
