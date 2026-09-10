import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DueStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

function createPrismaMock() {
  return {
    member: { findFirst: jest.fn() },
    due: { update: jest.fn() },
    paymentTransaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    receipt: { create: jest.fn() },
    $transaction: jest.fn(),
  } as any;
}

describe('PaymentsService', () => {
  it('creates an idempotent payment intent for a member due', async () => {
    const prisma = createPrismaMock();
    const erp = { registerPayment: jest.fn() };
    const service = new PaymentsService(prisma, erp as any);

    prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.due.findFirst = jest.fn().mockResolvedValue({
      id: 'due-1', amount: 25, paidAmount: 0, currency: 'EUR', status: DueStatus.OPEN,
      description: 'Quota', reference: '2026-09',
    });
    prisma.paymentTransaction.findUnique.mockResolvedValue(null);
    prisma.paymentTransaction.create.mockResolvedValue({ id: 'payment-1', status: PaymentStatus.PENDING });

    const result = await service.createPaymentIntent('tenant-1', 'user-1', 'due-1', 'idem-12345678');

    expect(result.id).toBe('payment-1');
    expect(prisma.paymentTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('returns the existing payment for the same idempotency key', async () => {
    const prisma = createPrismaMock();
    const service = new PaymentsService(prisma, { registerPayment: jest.fn() } as any);
    const existing = { id: 'payment-existing', status: PaymentStatus.PENDING };

    prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.due.findFirst = jest.fn().mockResolvedValue({
      id: 'due-1', amount: 25, paidAmount: 0, currency: 'EUR', status: DueStatus.OPEN,
      description: 'Quota', reference: '2026-09',
    });
    prisma.paymentTransaction.findUnique.mockResolvedValue(existing);

    const result = await service.createPaymentIntent('tenant-1', 'user-1', 'due-1', 'idem-12345678');

    expect(result).toBe(existing);
    expect(prisma.paymentTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects a payment when the member is not linked to the tenant', async () => {
    const prisma = createPrismaMock();
    const service = new PaymentsService(prisma, { registerPayment: jest.fn() } as any);
    prisma.member.findFirst.mockResolvedValue(null);

    await expect(service.createPaymentIntent('tenant-1', 'user-1', 'due-1', 'idem-12345678'))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a cancelled or paid due', async () => {
    const prisma = createPrismaMock();
    const service = new PaymentsService(prisma, { registerPayment: jest.fn() } as any);
    prisma.member.findFirst.mockResolvedValue({ id: 'member-1' });
    prisma.due.findFirst = jest.fn().mockResolvedValue({
      id: 'due-1', amount: 25, paidAmount: 25, currency: 'EUR', status: DueStatus.PAID,
      description: 'Quota', reference: '2026-09',
    });

    await expect(service.createPaymentIntent('tenant-1', 'user-1', 'due-1', 'idem-12345678'))
      .rejects.toBeInstanceOf(BadRequestException);
  });
});
