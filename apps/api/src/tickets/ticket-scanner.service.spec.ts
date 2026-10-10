import { BadRequestException } from '@nestjs/common';
import { TicketScannerService } from './ticket-scanner.service';
import { createHmac } from 'node:crypto';

function mockPrisma() {
  return {
    $transaction: jest.fn(),
  } as any;
}

function qr(secret: string, body: object) {
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `fcs://ticket/v1/${encoded}.${signature}`;
}

describe('TicketScannerService', () => {
  const secret = 'test-ticket-qr-secret-with-at-least-32-chars';

  it('rejects a QR signed with the wrong secret', async () => {
    const service = new TicketScannerService(mockPrisma(), { get: jest.fn((key: string) => key === 'TICKET_QR_SECRET' ? secret : 'test') } as any);
    const payload = qr('wrong-secret-that-is-also-long-enough-123456', {
      v: 1, tid: 'tenant-1', eid: 'event-1', ticket: 'ticket-1',
      iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 30,
    });
    await expect(service.scan('tenant-1', 'scanner-1', { payload })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired QR before touching the database', async () => {
    const prisma = mockPrisma();
    const service = new TicketScannerService(prisma, { get: jest.fn((key: string) => key === 'TICKET_QR_SECRET' ? secret : 'test') } as any);
    const now = Math.floor(Date.now() / 1000);
    const payload = qr(secret, { v: 1, tid: 'tenant-1', eid: 'event-1', ticket: 'ticket-1', iat: now - 60, exp: now - 1 });
    await expect(service.scan('tenant-1', 'scanner-1', { payload })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('accepts the first valid scan and atomically marks the ticket used', async () => {
    const prisma = mockPrisma();
    const tx = {
      ticket: { findFirst: jest.fn(), updateMany: jest.fn() },
      entryScan: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation((callback: any) => callback(tx));
    tx.ticket.findFirst.mockResolvedValue({ id: 'ticket-1', tenantId: 'tenant-1', eventId: 'event-1', status: 'ACTIVE', validFrom: null, validUntil: null, event: { endsAt: new Date(Date.now() + 3600000) } });
    tx.ticket.updateMany.mockResolvedValue({ count: 1 });
    const service = new TicketScannerService(prisma, { get: jest.fn((key: string) => key === 'TICKET_QR_SECRET' ? secret : 'test') } as any);
    const now = Math.floor(Date.now() / 1000);
    const payload = qr(secret, { v: 1, tid: 'tenant-1', eid: 'event-1', ticket: 'ticket-1', iat: now, exp: now + 30 });
    await expect(service.scan('tenant-1', 'scanner-1', { payload, deviceId: 'gate-1' })).resolves.toMatchObject({ accepted: true, result: 'ACCEPTED' });
    expect(tx.ticket.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.entryScan.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ result: 'ACCEPTED', deviceId: 'gate-1' }) }));
  });
});
