import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyTickets(tenantId: string, userId: string) {
    return this.prisma.ticket.findMany({
      where: { tenantId, userId },
      orderBy: { event: { startsAt: 'asc' } },
      include: {
        event: { select: { id: true, name: true, startsAt: true, endsAt: true, venueName: true, venueAddress: true, status: true } },
      },
    });
  }

  async getMyTicket(tenantId: string, userId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, userId },
      include: {
        event: true,
        scans: { orderBy: { scannedAt: 'desc' }, take: 5 },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async listEvents(tenantId: string) {
    return this.prisma.ticketEvent.findMany({
      where: { tenantId, startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 50,
      include: { _count: { select: { tickets: true } } },
    });
  }

  async getQrPayload(tenantId: string, userId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, userId },
      select: { id: true, status: true, qrTokenHash: true, externalTicketId: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!['ISSUED', 'ACTIVE'].includes(ticket.status)) {
      return { ticketId: ticket.id, active: false, payload: null };
    }

    // Development fallback: if an imported ticket has no QR token yet, use an opaque reference.
    // Production providers should replace this with a short-lived signed/rotating token.
    const reference = ticket.qrTokenHash ?? createHash('sha256').update(`${tenantId}:${ticket.id}:${ticket.externalTicketId}`).digest('hex');
    return {
      ticketId: ticket.id,
      active: true,
      payload: `fcs://ticket/${ticket.id}/${reference}`,
    };
  }
}
