import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
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

    const [tenant, member] = await Promise.all([
      this.prisma.tenant.findFirst({
        where: { id: tenantId, status: 'active' },
        select: {
          id: true,
          slug: true,
          name: true,
          settings: {
            select: {
              logoUrl: true,
              logoDarkUrl: true,
              heroImageUrl: true,
              primaryColor: true,
              secondaryColor: true,
              accentColor: true,
              backgroundColor: true,
              surfaceColor: true,
              textColor: true,
              mutedTextColor: true,
              slogan: true,
              shortName: true,
              defaultLocale: true,
              enabledFeatures: true,
              homeConfiguration: true,
              socialLinks: true,
              legalLinks: true,
            },
          },
        },
      }),
      this.prisma.member.findFirst({
        where: { tenantId, userId: user.id },
        select: {
          id: true,
          memberNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          memberships: {
            where: { tenantId },
            orderBy: { validFrom: 'desc' },
            take: 1,
            select: {
              id: true,
              planCode: true,
              status: true,
              validFrom: true,
              validUntil: true,
            },
          },
          dues: {
            where: { tenantId },
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
            },
          },
        },
      }),
    ]);

    if (!tenant) throw new NotFoundException('Club not found');
    if (!member) throw new NotFoundException('Member profile is not linked to this club');

    const now = new Date();
    const dues = member.dues.map((due) => ({
      ...due,
      status: due.status === 'OPEN' && due.dueDate < now ? 'OVERDUE' : due.status,
      outstandingAmount: due.amount.minus(due.paidAmount),
    }));
    const outstandingDues = dues.filter((due) => due.status === 'OPEN' || due.status === 'PARTIALLY_PAID' || due.status === 'OVERDUE');
    const nextDue = outstandingDues[0] ?? null;

    return {
      club: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: {
          logoUrl: tenant.settings?.logoUrl ?? null,
          logoDarkUrl: tenant.settings?.logoDarkUrl ?? null,
          heroImageUrl: tenant.settings?.heroImageUrl ?? null,
          primaryColor: tenant.settings?.primaryColor ?? '#008C45',
          secondaryColor: tenant.settings?.secondaryColor ?? '#005B2A',
          accentColor: tenant.settings?.accentColor ?? '#D7E83F',
          backgroundColor: tenant.settings?.backgroundColor ?? '#07110D',
          surfaceColor: tenant.settings?.surfaceColor ?? '#102019',
          textColor: tenant.settings?.textColor ?? '#FFFFFF',
          mutedTextColor: tenant.settings?.mutedTextColor ?? '#A7B5AE',
          slogan: tenant.settings?.slogan ?? null,
          shortName: tenant.settings?.shortName ?? null,
          defaultLocale: tenant.settings?.defaultLocale ?? 'pt-PT',
        },
        features: tenant.settings?.enabledFeatures ?? {},
        home: tenant.settings?.homeConfiguration ?? {},
        socialLinks: tenant.settings?.socialLinks ?? {},
        legalLinks: tenant.settings?.legalLinks ?? {},
      },
      member: {
        id: member.id,
        memberNumber: member.memberNumber,
        displayName: `${member.firstName} ${member.lastName}`.trim(),
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        membership: member.memberships[0] ?? null,
      },
      dues: {
        outstandingAmount: outstandingDues.reduce((total, due) => total.plus(due.outstandingAmount), new (require('@prisma/client').Prisma.Decimal)(0)),
        nextDue,
        items: dues,
      },
    };
  }
}
