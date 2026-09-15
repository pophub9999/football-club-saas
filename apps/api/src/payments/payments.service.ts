import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, DueStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ErpService } from '../erp/erp.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly erpService: ErpService,
  ) {}

  async createPaymentIntent(tenantId: string, userId: string, dueId: string, idempotencyKey: string, provider = 'mock') {
    const member = await this.prisma.member.findFirst({ where: { tenantId, userId }, select: { id: true } });
    if (!member) throw new NotFoundException('Member profile is not linked to this club');

    const due = await this.prisma.due.findFirst({
      where: { id: dueId, tenantId, memberId: member.id },
      select: { id: true, amount: true, paidAmount: true, currency: true, status: true, description: true, reference: true },
    });
    if (!due) throw new NotFoundException('Due not found');
    if (due.status === DueStatus.CANCELLED || due.status === DueStatus.PAID) throw new BadRequestException('This due cannot be paid');

    const outstanding = due.amount.minus(due.paidAmount);
    if (outstanding.lessThanOrEqualTo(0)) throw new BadRequestException('This due has no outstanding balance');

    const existing = await this.prisma.paymentTransaction.findUnique({ where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } } });
    if (existing) return existing;

    try {
      return await this.prisma.paymentTransaction.create({
        data: {
          tenantId, dueId: due.id, provider, idempotencyKey, amount: outstanding,
          currency: due.currency, status: PaymentStatus.PENDING,
          metadata: { dueReference: due.reference, description: due.description },
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) throw new ConflictException('Payment intent already exists for this idempotency key');
      throw error;
    }
  }

  async getPaymentHistory(tenantId: string, userId: string) {
    const member = await this.getMemberId(tenantId, userId);
    const payments = await this.prisma.paymentTransaction.findMany({
      where: { tenantId, due: { memberId: member.id } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, provider: true, providerPaymentId: true, amount: true, currency: true,
        status: true, paidAt: true, createdAt: true,
        due: { select: { id: true, reference: true, description: true, dueDate: true } },
        receipt: { select: { id: true, receiptNumber: true, externalId: true, issuedAt: true, documentUrl: true } },
      },
    });
    return payments;
  }

  async getPayment(tenantId: string, userId: string, paymentId: string) {
    const member = await this.getMemberId(tenantId, userId);
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: paymentId, tenantId, due: { memberId: member.id } },
      select: {
        id: true, provider: true, providerPaymentId: true, amount: true, currency: true,
        status: true, paidAt: true, createdAt: true, updatedAt: true,
        due: { select: { id: true, reference: true, description: true, amount: true, paidAmount: true, dueDate: true, status: true } },
        receipt: { select: { id: true, receiptNumber: true, externalId: true, issuedAt: true, documentUrl: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getReceipts(tenantId: string, userId: string) {
    const member = await this.getMemberId(tenantId, userId);
    return this.prisma.receipt.findMany({
      where: { tenantId, paymentTransaction: { due: { memberId: member.id } } },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true, receiptNumber: true, externalId: true, issuedAt: true,
        amount: true, currency: true, documentUrl: true,
        paymentTransaction: { select: { id: true, provider: true, providerPaymentId: true, paidAt: true, due: { select: { id: true, reference: true, description: true } } } },
      },
    });
  }

  async getReceipt(tenantId: string, userId: string, receiptId: string) {
    const member = await this.getMemberId(tenantId, userId);
    const receipt = await this.prisma.receipt.findFirst({
      where: { id: receiptId, tenantId, paymentTransaction: { due: { memberId: member.id } } },
      select: {
        id: true, receiptNumber: true, externalId: true, issuedAt: true,
        amount: true, currency: true, documentUrl: true, metadata: true,
        paymentTransaction: { select: { id: true, provider: true, providerPaymentId: true, paidAt: true, amount: true, currency: true, due: { select: { id: true, reference: true, description: true } } } },
      },
    });
    if (!receipt) throw new NotFoundException('Receipt not found');
    return receipt;
  }

  async confirmMockPayment(tenantId: string, userId: string, paymentId: string) {
    const payment = await this.prisma.paymentTransaction.findFirst({
      where: { id: paymentId, tenantId },
      include: { due: true, receipt: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const member = await this.getMemberId(tenantId, userId);
    if (payment.due?.memberId !== member.id) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatus.PAID) return payment;
    if (payment.status !== PaymentStatus.PENDING) throw new BadRequestException(`Payment cannot be confirmed from status ${payment.status}`);
    if (!payment.due) throw new BadRequestException('Payment is not linked to a due');

    const paidAt = new Date();
    const providerPaymentId = `mock_${payment.id}`;
    const erpInput = {
      tenantId,
      paymentExternalId: providerPaymentId,
      amount: payment.amount,
      currency: payment.currency,
      paidAt,
      metadata: { paymentId: payment.id, dueId: payment.due.id },
      ...(payment.due.externalId ? { dueExternalId: payment.due.externalId } : {}),
    };
    const erpResult = await this.erpService.registerPayment(erpInput);

    return this.prisma.$transaction(async (tx) => {
      const fresh = await tx.paymentTransaction.findFirst({ where: { id: payment.id, tenantId }, include: { due: true, receipt: true } });
      if (!fresh) throw new NotFoundException('Payment not found');
      if (fresh.status === PaymentStatus.PAID) return fresh;
      if (fresh.status !== PaymentStatus.PENDING || !fresh.due) throw new BadRequestException('Payment is no longer confirmable');

      const newPaidAmount = fresh.due.paidAmount.plus(fresh.amount);
      const dueStatus = newPaidAmount.greaterThanOrEqualTo(fresh.due.amount) ? DueStatus.PAID : DueStatus.PARTIALLY_PAID;
      const updatedPayment = await tx.paymentTransaction.update({
        where: { id: fresh.id },
        data: {
          status: PaymentStatus.PAID, paidAt, providerPaymentId,
          metadata: { ...(fresh.metadata as Record<string, unknown> | null), erpPaymentId: erpResult.externalId },
        },
      });
      await tx.due.update({ where: { id: fresh.due.id }, data: { paidAmount: newPaidAmount, status: dueStatus } });
      const receipt = await tx.receipt.create({
        data: {
          tenantId, paymentTransactionId: fresh.id, receiptNumber: erpResult.receiptNumber,
          externalId: erpResult.receiptExternalId, issuedAt: erpResult.registeredAt,
          amount: fresh.amount, currency: fresh.currency,
        },
      });
      return { ...updatedPayment, receipt };
    });
  }

  private async getMemberId(tenantId: string, userId: string) {
    const member = await this.prisma.member.findFirst({ where: { tenantId, userId }, select: { id: true } });
    if (!member) throw new NotFoundException('Member profile is not linked to this club');
    return member;
  }
}
