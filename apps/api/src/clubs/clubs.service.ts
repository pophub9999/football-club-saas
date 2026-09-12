import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

const DEFAULT_FEATURES = {
  tickets: true,
  rewards: true,
  shop: false,
  stadium: true,
  news: true,
};

const DEFAULT_HOME = {
  showNextMatch: true,
  showDues: true,
  showNews: true,
  modulesOrder: ['nextMatch', 'dues', 'news'],
};

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranding(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant) {
      throw new NotFoundException('Club not found');
    }

    const settings = tenant.settings;

    return {
      club: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status,
      },
      branding: {
        logoUrl: settings?.logoUrl ?? null,
        logoDarkUrl: settings?.logoDarkUrl ?? null,
        heroImageUrl: settings?.heroImageUrl ?? null,
        appIconUrl: settings?.appIconUrl ?? null,
        primaryColor: settings?.primaryColor ?? '#008C45',
        secondaryColor: settings?.secondaryColor ?? '#005B2A',
        accentColor: settings?.accentColor ?? '#D7E83F',
        backgroundColor: settings?.backgroundColor ?? '#07110D',
        surfaceColor: settings?.surfaceColor ?? '#102019',
        textColor: settings?.textColor ?? '#FFFFFF',
        mutedTextColor: settings?.mutedTextColor ?? '#A7B5AE',
        slogan: settings?.slogan ?? null,
        shortName: settings?.shortName ?? null,
        defaultLocale: settings?.defaultLocale ?? 'pt-PT',
      },
      features: settings?.enabledFeatures ?? DEFAULT_FEATURES,
      home: settings?.homeConfiguration ?? DEFAULT_HOME,
      socialLinks: settings?.socialLinks ?? {},
      legalLinks: settings?.legalLinks ?? {},
    };
  }

  async updateBranding(tenantId: string, userId: string, roles: string[], dto: UpdateBrandingDto) {
    if (!roles.some((role) => role === 'club_owner' || role === 'club_admin')) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Club not found');

    const settings = await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...dto },
      update: { ...dto },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'branding.updated',
        resource: 'tenant_settings',
        resourceId: settings.id,
        metadata: dto,
      },
    });

    return this.getBranding(tenantId);
  }
}
