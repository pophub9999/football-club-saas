import { Injectable, NotFoundException } from '@nestjs/common';
import { DueStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DuesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForMember(tenantId: string, userId: string, status?: string) {
    const member = await this.prisma.member.findFirst({
      where: { tenantId, userId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException('Member profile is not linked to this club');
    }

    const dueStatus = status && Object.values(DueStatus).includes(status as DueStatus)
      ? (status as DueStatus)
      : undefined;

    const dues = await this.prisma.due.findMany({
      where: {
        tenantId,
        memberId: member.id,
        ...(dueStatus ? { status: dueStatus } : {}),
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        reference: true,
        description: true,
        amount: true,
        paidAmount: true,
        currency: true,
        dueDate: true,
        status: true,
      },
    });

    return dues.map((due) => ({
      ...due,
      outstandingAmount: due.amount.minus(due.paidAmount),
      overdue: due.status === DueStatus.OVERDUE ||
        (due.status !== DueStatus.PAID && due.status !== DueStatus.CANCELLED && due.dueDate < new Date()),
    }));
  }

  async getForMember(tenantId: string, userId: string, dueId: string) {
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
        createdAt: true,
      },
    });

    if (!due) {
      throw new NotFoundException('Due not found');
    }

    return {
      ...due,
      outstandingAmount: due.amount.minus(due.paidAmount),
      overdue: due.status === DueStatus.OVERDUE ||
        (due.status !== DueStatus.PAID && due.status !== DueStatus.CANCELLED && due.dueDate < new Date()),
    };
  }
}
