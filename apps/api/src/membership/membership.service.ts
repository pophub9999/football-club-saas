import { Injectable, NotFoundException } from '@nestjs/common';
import { DueStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { DuesQueryDto } from './dto/dues-query.dto';

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyDues(tenantId: string, userId: string, query: DuesQueryDto) {
    const member = await this.prisma.member.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException('Member profile is not linked to this club');
    }

    const dues = await this.prisma.due.findMany({
      where: {
        tenantId,
        memberId: member.id,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        reference: true,
        description: true,
        amount: true,
        paidAmount: true,
        currency: true,
        dueDate: true,
        status: true,
        externalId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const now = new Date();
    return dues.map((due) => {
      const effectiveStatus =
        due.status === DueStatus.OPEN && due.dueDate < now ? DueStatus.OVERDUE : due.status;
      return {
        ...due,
        status: effectiveStatus,
        outstandingAmount: due.amount.minus(due.paidAmount),
      };
    });
  }

  async getMyDue(tenantId: string, userId: string, dueId: string) {
    const member = await this.prisma.member.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException('Member profile is not linked to this club');
    }

    const due = await this.prisma.due.findFirst({
      where: { id: dueId, tenantId, memberId: member.id },
      select: {
        id: true,
        reference: true,
        description: true,
        amount: true,
        paidAmount: true,
        currency: true,
        dueDate: true,
        status: true,
        externalId: true,
        createdAt: true,
        updatedAt: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            provider: true,
            providerPaymentId: true,
            amount: true,
            currency: true,
            status: true,
            paidAt: true,
            createdAt: true,
            receipt: {
              select: {
                id: true,
                receiptNumber: true,
                externalId: true,
                issuedAt: true,
                documentUrl: true,
              },
            },
          },
        },
      },
    });

    if (!due) throw new NotFoundException('Due not found');

    const effectiveStatus =
      due.status === DueStatus.OPEN && due.dueDate < new Date() ? DueStatus.OVERDUE : due.status;

    return {
      ...due,
      status: effectiveStatus,
      outstandingAmount: due.amount.minus(due.paidAmount),
    };
  }
}
