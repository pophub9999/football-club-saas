import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { TransferTicketDto } from './dto/transfer-ticket.dto';

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

    const reference = ticket.qrTokenHash ?? createHash('sha256').update(`${tenantId}:${ticket.id}:${ticket.externalTicketId}`).digest('hex');
    return {
      ticketId: ticket.id,
      active: true,
      payload: `fcs://ticket/${ticket.id}/${reference}`,
    };
  }

  async requestTransfer(tenantId: string, fromUserId: string, ticketId: string, dto: TransferTicketDto) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId, userId: fromUserId },
      include: { event: { select: { startsAt: true } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!['ISSUED', 'ACTIVE'].includes(ticket.status)) {
      throw new BadRequestException('Only issued or active tickets can be transferred');
    }
    if (ticket.event.startsAt <= new Date()) {
      throw new BadRequestException('Tickets cannot be transferred after the event has started');
    }

    let recipientUserId: string | null = null;
    if (dto.recipientEmail) {
      const recipient = await this.prisma.user.findFirst({
        where: {
          email: dto.recipientEmail.trim().toLowerCase(),
          status: 'ACTIVE',
          userTenants: { some: { tenantId } },
        },
        select: { id: true },
      });
      recipientUserId = recipient?.id ?? null;
    } else if (dto.recipientMemberNumber) {
      const recipient = await this.prisma.member.findFirst({
        where: {
          tenantId,
          memberNumber: dto.recipientMemberNumber.trim(),
          userId: { not: null },
        },
        select: { userId: true },
      });
      recipientUserId = recipient?.userId ?? null;
    }

    if (!recipientUserId) throw new NotFoundException('Recipient is not an active club member');
    if (recipientUserId === fromUserId) throw new BadRequestException('A ticket cannot be transferred to yourself');

    const existing = await this.prisma.ticketTransfer.findFirst({
      where: { ticketId, status: 'PENDING', expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (existing) throw new ConflictException('This ticket already has a pending transfer');

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.ticketTransfer.create({
        data: {
          tenantId,
          ticketId,
          fromUserId,
          toUserId: recipientUserId,
          status: 'PENDING',
          expiresAt,
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: fromUserId,
          action: 'TICKET_TRANSFER_REQUESTED',
          resource: 'TicketTransfer',
          resourceId: transfer.id,
          metadata: { ticketId, toUserId: recipientUserId, expiresAt: expiresAt.toISOString() },
        },
      });
      return transfer;
    });
  }

  async acceptTransfer(tenantId: string, recipientUserId: string, transferId: string) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.ticketTransfer.findFirst({
        where: { id: transferId, tenantId, toUserId: recipientUserId },
        include: { ticket: { select: { id: true, status: true, userId: true, event: { select: { startsAt: true } } } } },
      });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'PENDING') throw new ConflictException('Transfer is no longer pending');
      if (transfer.expiresAt && transfer.expiresAt <= now) {
        await tx.ticketTransfer.update({ where: { id: transfer.id }, data: { status: 'EXPIRED' } });
        throw new ConflictException('Transfer has expired');
      }
      if (!['ISSUED', 'ACTIVE'].includes(transfer.ticket.status)) {
        throw new ConflictException('Ticket is no longer transferable');
      }
      if (transfer.ticket.event.startsAt <= now) throw new ConflictException('The event has already started');
      if (transfer.ticket.userId !== transfer.fromUserId) throw new ConflictException('Ticket ownership has changed');

      const updatedTicket = await tx.ticket.updateMany({
        where: {
          id: transfer.ticketId,
          tenantId,
          userId: transfer.fromUserId,
          status: { in: ['ISSUED', 'ACTIVE'] },
        },
        data: { userId: recipientUserId, status: 'ACTIVE' },
      });
      if (updatedTicket.count !== 1) throw new ConflictException('Ticket ownership changed during transfer');

      const accepted = await tx.ticketTransfer.update({
        where: { id: transfer.id },
        data: { status: 'ACCEPTED', acceptedAt: now },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: recipientUserId,
          action: 'TICKET_TRANSFER_ACCEPTED',
          resource: 'TicketTransfer',
          resourceId: transfer.id,
          metadata: { ticketId: transfer.ticketId, fromUserId: transfer.fromUserId },
        },
      });
      return accepted;
    });
  }
}
