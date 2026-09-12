import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

process.env.JWT_ACCESS_SECRET = 'test-only-jwt-secret-please-change';

function createPrismaMock() {
  return {
    user: { findUnique: jest.fn() },
    userTenant: { findUnique: jest.fn() },
    userSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  } as any;
}

const tenant = (id: string, name = `Club ${id}`, status = 'active') => ({ id, slug: id, name, status });

describe('AuthService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('logs in a user belonging to one club and creates a session', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma);
    const passwordHash = await bcrypt.hash('DemoPass123!', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'demo@example.test', passwordHash, status: 'ACTIVE', userTenants: [{ tenantId: 'tenant-1', roles: ['member'], tenant: tenant('tenant-1') }] });
    prisma.userSession.create.mockResolvedValue({ id: 'session-1' });

    const result = await service.login({ email: 'Demo@Example.Test', password: 'DemoPass123!' });

    expect(result.user).toEqual({ id: 'user-1', tenantId: 'tenant-1', email: 'demo@example.test', roles: ['member'] });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(prisma.userSession.create).toHaveBeenCalledTimes(1);
    expect(prisma.userSession.create.mock.calls[0][0].data.tenantId).toBe('tenant-1');
    const payload = jwt.verify(result.accessToken, process.env.JWT_ACCESS_SECRET!) as jwt.JwtPayload;
    expect(payload.tenantId).toBe('tenant-1');
  });

  it('returns the active clubs when a multi-club user has not selected one', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma);
    const passwordHash = await bcrypt.hash('DemoPass123!', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1', email: 'demo@example.test', passwordHash, status: 'ACTIVE',
      userTenants: [
        { tenantId: 'tenant-1', roles: ['member'], tenant: tenant('tenant-1', 'Clube Norte') },
        { tenantId: 'tenant-2', roles: ['member'], tenant: tenant('tenant-2', 'Clube Sul') },
        { tenantId: 'tenant-3', roles: ['member'], tenant: tenant('tenant-3', 'Clube Inativo', 'inactive') },
      ],
    });

    const result = await service.login({ email: 'demo@example.test', password: 'DemoPass123!' });

    expect(result).toEqual({ selectionRequired: true, clubs: [
      { id: 'tenant-1', slug: 'tenant-1', name: 'Clube Norte' },
      { id: 'tenant-2', slug: 'tenant-2', name: 'Clube Sul' },
    ] });
    expect(prisma.userSession.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid password without creating a session', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma);
    const passwordHash = await bcrypt.hash('CorrectPass123!', 4);
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'demo@example.test', passwordHash, status: 'ACTIVE', userTenants: [{ tenantId: 'tenant-1', roles: ['member'], tenant: tenant('tenant-1') }] });
    await expect(service.login({ email: 'demo@example.test', password: 'WrongPass123!' })).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    expect(prisma.userSession.create).not.toHaveBeenCalled();
  });

  it('rotates a valid refresh token and revokes the old session', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma);
    prisma.userSession.findUnique.mockResolvedValue({ id: 'session-1', userId: 'user-1', tenantId: 'tenant-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null, user: { id: 'user-1', email: 'demo@example.test', status: 'ACTIVE' }, tenant: tenant('tenant-1') });
    prisma.userTenant.findUnique.mockResolvedValue({ userId: 'user-1', tenantId: 'tenant-1', roles: ['member'] });
    prisma.userSession.update.mockResolvedValue({});
    prisma.userSession.create.mockResolvedValue({ id: 'session-2' });
    const result = await service.refresh('refresh-token-for-test');
    expect(result.user.tenantId).toBe('tenant-1');
    expect(prisma.userSession.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'session-1' }, data: expect.objectContaining({ revokedAt: expect.any(Date) }) }));
    expect(prisma.userSession.create).toHaveBeenCalledTimes(1);
  });

  it('rejects a refresh token for a revoked session', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma);
    prisma.userSession.findUnique.mockResolvedValue({ id: 'session-1', userId: 'user-1', tenantId: 'tenant-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: new Date(), user: { id: 'user-1', email: 'demo@example.test', status: 'ACTIVE' }, tenant: tenant('tenant-1') });
    await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException);
    expect(prisma.userTenant.findUnique).not.toHaveBeenCalled();
  });

  it('revokes a refresh token on logout', async () => {
    const prisma = createPrismaMock();
    const service = new AuthService(prisma);
    prisma.userSession.updateMany.mockResolvedValue({ count: 1 });
    const result = await service.logout('logout-token');
    expect(result).toEqual({ success: true });
    expect(prisma.userSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ revokedAt: null }), data: expect.objectContaining({ revokedAt: expect.any(Date) }) }));
  });
});
