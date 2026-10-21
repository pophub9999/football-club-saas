import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { ScanTicketDto } from './dto/scan-ticket.dto';

const QR_TTL_SECONDS = 45;

type TicketQr = { v: number; tid: string; eid: string; ticket: string; iat: number; exp: number };

@Injectable()
export class TicketScannerService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async scan(tenantId: string, scannerId: string, dto: ScanTicketDto) {
    const qr = this.verify(dto.payload);
    if (qr.tid !== tenantId) throw new BadRequestException('Invalid ticket QR for this club');

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.findFirst({
        where: { id: qr.ticket, tenantId, eventId: qr.eid },
        include: { event: true },
      });
      if (!ticket) throw new NotFoundException('Ticket not found');

      const now = new Date();
      let result: 'ACCEPTED' | 'ALREADY_USED' | 'EXPIRED' | 'CANCELLED' = 'ACCEPTED';
      if (ticket.status === 'USED') result = 'ALREADY_USED';
      else if (ticket.status === 'CANCELLED') result = 'CANCELLED';
      else if (
        ticket.status === 'EXPIRED' ||
        (ticket.validUntil && ticket.validUntil <= now) ||
        (ticket.event.endsAt && ticket.event.endsAt <= now)
      ) result = 'EXPIRED';
      else if (ticket.validFrom && ticket.validFrom > now) result = 'EXPIRED';

      if (result !== 'ACCEPTED') {
        await tx.entryScan.create({
          data: { tenantId, ticketId: ticket.id, scannerId, result, deviceId: dto.deviceId ?? null },
        });
        return { accepted: false, result, ticketId: ticket.id, eventId: ticket.eventId };
      }

      const updated = await tx.ticket.updateMany({
        where: { id: ticket.id, tenantId, status: { in: ['ISSUED', 'ACTIVE'] } },
        data: { status: 'USED' },
      });
      if (updated.count !== 1) {
        await tx.entryScan.create({
          data: { tenantId, ticketId: ticket.id, scannerId, result: 'ALREADY_USED', deviceId: dto.deviceId ?? null },
        });
        return { accepted: false, result: 'ALREADY_USED', ticketId: ticket.id, eventId: ticket.eventId };
      }

      await tx.entryScan.create({
        data: { tenantId, ticketId: ticket.id, scannerId, result: 'ACCEPTED', deviceId: dto.deviceId ?? null },
      });
      return { accepted: true, result: 'ACCEPTED', ticketId: ticket.id, eventId: ticket.eventId };
    });
  }

  private verify(payload: string): TicketQr {
    const prefix = 'fcs://ticket/v1/';
    if (!payload.startsWith(prefix)) throw new BadRequestException('Invalid ticket QR payload');
    const parts = payload.slice(prefix.length).split('.');
    if (parts.length !== 2) throw new BadRequestException('Invalid ticket QR payload');
    const bodyPart = parts[0]!;
    const signaturePart = parts[1]!;
    const expected = Buffer.from(createHmac('sha256', this.secret()).update(bodyPart).digest('base64url'), 'base64url');
    const supplied = Buffer.from(signaturePart, 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new BadRequestException('Invalid ticket QR signature');
    let body: TicketQr;
    try {
      body = JSON.parse(Buffer.from(bodyPart, 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid ticket QR payload');
    }
    const now = Math.floor(Date.now() / 1000);
    if (
      body.v !== 1 ||
      !body.tid ||
      !body.eid ||
      !body.ticket ||
      !Number.isInteger(body.iat) ||
      !Number.isInteger(body.exp) ||
      body.exp <= now ||
      body.iat > now + 10 ||
      body.exp - body.iat > QR_TTL_SECONDS
    ) {
      throw new BadRequestException('Expired or invalid ticket QR payload');
    }
    return body;
  }

  private secret(): string {
    const secret = this.config.get<string>('TICKET_QR_SECRET') ?? '';
    if (secret.length >= 32) return secret;
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('TICKET_QR_SECRET must be configured with at least 32 characters in production');
    }
    return 'development-only-ticket-qr-secret-change-before-production-2026';
  }
}
