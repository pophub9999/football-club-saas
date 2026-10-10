import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const ADMIN_ROLES = ['club_owner', 'club_admin'];

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  assertAdmin(roles: string[]) {
    if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  async dashboard(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    const [members, activeMemberships, openDues, overdueDues, paidPayments, upcomingFixtures, publishedArticles] = await Promise.all([
      this.prisma.member.count({ where: { tenantId } }),
      this.prisma.membership.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.due.count({ where: { tenantId, status: { in: ['OPEN', 'PARTIALLY_PAID'] } } }),
      this.prisma.due.count({ where: { tenantId, status: 'OVERDUE' } }),
      this.prisma.paymentTransaction.aggregate({ where: { tenantId, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.fixture.count({ where: { tenantId, kickoffAt: { gte: new Date() } } }),
      this.prisma.article.count({ where: { tenantId, isPublished: true } }),
    ]);

    return {
      members,
      activeMemberships,
      openDues,
      overdueDues,
      paidAmount: Number(paidPayments._sum.amount ?? 0),
      upcomingFixtures,
      publishedArticles,
    };
  }

  async members(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    return this.prisma.member.findMany({
      where: { tenantId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 200,
      select: {
        id: true,
        memberNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        memberships: { orderBy: { validFrom: 'desc' }, take: 1, select: { planCode: true, status: true, validUntil: true } },
      },
    });
  }

  async dues(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    return this.prisma.due.findMany({
      where: { tenantId },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
      take: 200,
      select: { id: true, memberId: true, reference: true, description: true, amount: true, paidAmount: true, currency: true, dueDate: true, status: true },
    });
  }
}
