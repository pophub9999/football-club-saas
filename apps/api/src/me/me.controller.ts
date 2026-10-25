import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AuthenticatedUser } from '../auth/auth.types';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getMe(@UserRequest() user: AuthenticatedUser) {
    return user;
  }

  @Get('home')
  async getHome(@UserRequest() user: AuthenticatedUser) {
    const tenantId = user.tenantId;
    const now = new Date();

    const [tenant, member, nextMatch, news] = await Promise.all([
      this.prisma.tenant.findFirst({
        where: { id: tenantId, status: 'active' },
        select: {
          id: true, slug: true, name: true,
          settings: { select: {
            logoUrl: true, logoDarkUrl: true, heroImageUrl: true,
            primaryColor: true, secondaryColor: true, accentColor: true,
            backgroundColor: true, surfaceColor: true, textColor: true, mutedTextColor: true,
            slogan: true, shortName: true, defaultLocale: true,
            enabledFeatures: true, homeConfiguration: true, socialLinks: true, legalLinks: true,
          } },
        },
      }),
      this.prisma.member.findFirst({
        where: { tenantId, userId: user.id },
        select: {
          id: true, memberNumber: true, firstName: true, lastName: true, email: true, phone: true,
          memberships: { where: { tenantId }, orderBy: { validFrom: 'desc' }, take: 1,
            select: { id: true, planCode: true, status: true, validFrom: true, validUntil: true } },
          dues: { where: { tenantId }, orderBy: { dueDate: 'asc' },
            select: { id: true, reference: true, description: true, amount: true, paidAmount: true, currency: true, dueDate: true, status: true } },
        },
      }),
      this.prisma.fixture.findFirst({
        where: { tenantId, kickoffAt: { gte: now } },
        orderBy: { kickoffAt: 'asc' },
        include: {
          competition: { select: { id: true, name: true, logoUrl: true } },
          homeTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
          awayTeam: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        },
      }),
      this.prisma.article.findMany({
        where: { tenantId, isPublished: true, publishedAt: { lte: now } },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        select: { id: true, slug: true, title: true, excerpt: true, imageUrl: true, category: true, publishedAt: true },
      }),
    ]);

    if (!tenant) throw new NotFoundException('Club not found');
    if (!member) throw new NotFoundException('Member profile is not linked to this club');

    const dues = member.dues.map((due) => ({
      ...due,
      status: due.status === 'OPEN' && due.dueDate < now ? 'OVERDUE' : due.status,
      outstandingAmount: due.amount.minus(due.paidAmount),
    }));
    const outstandingDues = dues.filter((due) => ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(due.status));
    const nextDue = outstandingDues[0] ?? null;
    const outstandingAmount = outstandingDues.reduce((total, due) => total.plus(due.outstandingAmount), new Prisma.Decimal(0));

    return {
      club: {
        id: tenant.id, slug: tenant.slug, name: tenant.name,
        branding: {
          logoUrl: tenant.settings?.logoUrl ?? null, logoDarkUrl: tenant.settings?.logoDarkUrl ?? null,
          heroImageUrl: tenant.settings?.heroImageUrl ?? null,
          primaryColor: tenant.settings?.primaryColor ?? '#008C45', secondaryColor: tenant.settings?.secondaryColor ?? '#005B2A',
          accentColor: tenant.settings?.accentColor ?? '#D7E83F', backgroundColor: tenant.settings?.backgroundColor ?? '#07110D',
          surfaceColor: tenant.settings?.surfaceColor ?? '#102019', textColor: tenant.settings?.textColor ?? '#FFFFFF',
          mutedTextColor: tenant.settings?.mutedTextColor ?? '#A7B5AE', slogan: tenant.settings?.slogan ?? null,
          shortName: tenant.settings?.shortName ?? null, defaultLocale: tenant.settings?.defaultLocale ?? 'pt-PT',
        },
        features: tenant.settings?.enabledFeatures ?? {}, home: tenant.settings?.homeConfiguration ?? {},
        socialLinks: tenant.settings?.socialLinks ?? {}, legalLinks: tenant.settings?.legalLinks ?? {},
      },
      member: {
        id: member.id, memberNumber: member.memberNumber, displayName: `${member.firstName} ${member.lastName}`.trim(),
        firstName: member.firstName, lastName: member.lastName, email: member.email, phone: member.phone,
        membership: member.memberships[0] ?? null,
      },
      dues: { outstandingAmount, nextDue, items: dues },
      nextMatch,
      news,
    };
  }
}
