import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPaymentIntent(tenantId: string, userId: string, dueId: string, idempotencyKey: string, provider = 'mock') {
    const member = await this.prisma.member.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException('Member profile is not linked to this club');
    }

    const due = await this.prisma.due.findFirst({
      where: { id: dueId, tenantId, memberId: member.id },
      select: { id: true, amount: true, paidAmount: true, currency: true, status: true, description: true, reference: true },
    });

    if (!due) {
      throw new NotFoundException('Due not found');
    }

    if (due.status === 'CANCELLED' || due.status === 'PAID') {
      throw new BadRequestException('This due cannot be paid');
    }

    const outstanding = due.amount.minus(due.paidAmount);
    if (outstanding.lessThanOrEqualTo(0)) {
      throw new BadRequestException('This due has no outstanding balance');
    }

    const existing = await this.prisma.paymentTransaction.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
    });

    if (existing) {
      return existing;
    }

    try {
      return await this.prisma.paymentTransaction.create({
        data: {
          tenantId,
          dueId: due.id,
          provider,
          idempotencyKey,
          amount: outstanding,
          currency: due.currency,
          status: PaymentStatus.PENDING,
          metadata: {
            dueReference: due.reference,
            description: due.description,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new ConflictException('Payment intent already exists for this idempotency key');
      }
      throw error;
    }
  }
}
