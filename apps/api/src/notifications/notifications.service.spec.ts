import { NotificationsService } from './notifications.service';

jest.mock('node:crypto', () => ({
  createHash: () => ({
    update: (value: string) => ({ digest: () => `hash:${value}` }),
  }),
}));

describe('NotificationsService', () => {
  const pushProvider = { send: jest.fn().mockResolvedValue({ sent: 1, invalidTokens: [] }) };

  beforeEach(() => jest.clearAllMocks());

  it('returns defaults when the user has no saved preferences', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([]), $executeRaw: jest.fn() } as any;
    const service = new NotificationsService(prisma, pushProvider);

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
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.updatePreferences('user-1', 'tenant-1', { marketing: true })).resolves.toEqual({
      notifications: true,
      matchday: false,
      marketing: true,
    });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('registers a device without exposing the token in the response', async () => {
    const prisma = { $queryRaw: jest.fn(), $executeRaw: jest.fn().mockResolvedValue(1) } as any;
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.registerDevice('user-1', 'tenant-1', {
      token: 'fcm-token-abcdefghijklmnopqrstuvwxyz',
      platform: 'android',
      appVersion: '0.1.0',
    })).resolves.toEqual({ registered: true, platform: 'android' });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid device token', async () => {
    const prisma = { $executeRaw: jest.fn() } as any;
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.registerDevice('user-1', 'tenant-1', {
      token: 'short',
      platform: 'ios',
    })).rejects.toThrow('Invalid notification device token');
    expect(prisma.$executeRaw).not.toHaveBeenCalled();
  });

  it('unregisters only the current tenant user device', async () => {
    const prisma = { $executeRaw: jest.fn().mockResolvedValue(1) } as any;
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.unregisterDevice('user-1', 'tenant-1', 'fcm-token-abcdefghijklmnopqrstuvwxyz')).resolves.toEqual({ removed: true });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('does not send when notifications are disabled', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ notifications: false, matchday: true, marketing: false }]),
      $executeRaw: jest.fn(),
    } as any;
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.sendToUser('user-1', 'tenant-1', { title: 'Test', body: 'Hello' })).resolves.toEqual({
      sent: 0,
      skipped: true,
      skipReason: 'notifications_disabled',
      invalidTokens: [],
    });
    expect(pushProvider.send).not.toHaveBeenCalled();
  });

  it('does not send matchday notifications when matchday is disabled', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ notifications: true, matchday: false, marketing: false }]),
      $executeRaw: jest.fn(),
    } as any;
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.sendMatchdayNotification('user-1', 'tenant-1', { title: 'Dia de jogo', body: 'Hoje há jogo' })).resolves.toEqual({
      sent: 0,
      skipped: true,
      skipReason: 'matchday_disabled',
      invalidTokens: [],
    });
    expect(pushProvider.send).not.toHaveBeenCalled();
  });

  it('does not send marketing notifications when marketing is disabled', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ notifications: true, matchday: true, marketing: false }]),
      $executeRaw: jest.fn(),
    } as any;
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.sendMarketingNotification('user-1', 'tenant-1', { title: 'Oferta', body: 'Nova vantagem' })).resolves.toEqual({
      sent: 0,
      skipped: true,
      skipReason: 'marketing_disabled',
      invalidTokens: [],
    });
    expect(pushProvider.send).not.toHaveBeenCalled();
  });

  it('sends to all registered devices for the current tenant user', async () => {
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ notifications: true, matchday: true, marketing: false }])
        .mockResolvedValueOnce([
          { token: 'token-android-abcdefghijklmnopqrstuvwxyz', platform: 'android' },
          { token: 'token-ios-abcdefghijklmnopqrstuvwxyz', platform: 'ios' },
        ]),
      $executeRaw: jest.fn(),
    } as any;
    pushProvider.send.mockResolvedValueOnce({ sent: 2, invalidTokens: [] });
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.sendToUser('user-1', 'tenant-1', { title: 'Gol', body: 'Marcámos!' })).resolves.toEqual({
      sent: 2,
      skipped: false,
      invalidTokens: [],
    });
    expect(pushProvider.send).toHaveBeenCalledWith([
      { token: 'token-android-abcdefghijklmnopqrstuvwxyz', platform: 'android' },
      { token: 'token-ios-abcdefghijklmnopqrstuvwxyz', platform: 'ios' },
    ], { title: 'Gol', body: 'Marcámos!' });
  });

  it('removes invalid push tokens after a provider response', async () => {
    const invalidToken = 'token-invalid-abcdefghijklmnopqrstuvwxyz';
    const prisma = {
      $queryRaw: jest.fn()
        .mockResolvedValueOnce([{ notifications: true, matchday: true, marketing: false }])
        .mockResolvedValueOnce([{ token: invalidToken, platform: 'ios' }]),
      $executeRaw: jest.fn(),
    } as any;
    pushProvider.send.mockResolvedValueOnce({ sent: 0, invalidTokens: [invalidToken] });
    const service = new NotificationsService(prisma, pushProvider);

    await expect(service.sendToUser('user-1', 'tenant-1', { title: 'Test', body: 'Invalid token' })).resolves.toEqual({
      sent: 0,
      skipped: false,
      invalidTokens: [invalidToken],
    });
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });
});
