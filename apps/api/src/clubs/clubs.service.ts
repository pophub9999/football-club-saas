import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UpdateMatchdayDto } from './dto/update-matchday.dto';

const DEFAULT_FEATURES = { tickets: true, rewards: true, shop: false, stadium: true, news: true };
const DEFAULT_HOME = { showNextMatch: true, showDues: true, showNews: true, modulesOrder: ['nextMatch', 'dues', 'news'] };
const DEFAULT_MATCHDAY = { location: {}, entrances: [], parking: [], notices: [] };

@Injectable()
export class ClubsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranding(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { settings: true } });
    if (!tenant) throw new NotFoundException('Club not found');
    const settings = tenant.settings;
    return {
      club: { id: tenant.id, slug: tenant.slug, name: tenant.name, status: tenant.status },
      branding: {
        logoUrl: settings?.logoUrl ?? null, logoDarkUrl: settings?.logoDarkUrl ?? null, heroImageUrl: settings?.heroImageUrl ?? null,
        appIconUrl: settings?.appIconUrl ?? null, primaryColor: settings?.primaryColor ?? '#008C45', secondaryColor: settings?.secondaryColor ?? '#005B2A',
        accentColor: settings?.accentColor ?? '#D7E83F', backgroundColor: settings?.backgroundColor ?? '#07110D', surfaceColor: settings?.surfaceColor ?? '#102019',
        textColor: settings?.textColor ?? '#FFFFFF', mutedTextColor: settings?.mutedTextColor ?? '#A7B5AE', slogan: settings?.slogan ?? null,
        shortName: settings?.shortName ?? null, defaultLocale: settings?.defaultLocale ?? 'pt-PT',
      },
      features: settings?.enabledFeatures ?? DEFAULT_FEATURES,
      home: settings?.homeConfiguration ?? DEFAULT_HOME,
      socialLinks: settings?.socialLinks ?? {}, legalLinks: settings?.legalLinks ?? {},
    };
  }

  async getMatchdaySettings(tenantId: string) {
    const settings = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { homeConfiguration: true } });
    const home = settings?.homeConfiguration;
    if (home && typeof home === 'object' && !Array.isArray(home) && 'matchday' in home) {
      return (home as Record<string, unknown>).matchday ?? DEFAULT_MATCHDAY;
    }
    return DEFAULT_MATCHDAY;
  }

  async updateBranding(tenantId: string, userId: string, roles: string[], dto: UpdateBrandingDto) {
    if (!roles.some((role) => role === 'club_owner' || role === 'club_admin')) throw new ForbiddenException('Insufficient permissions');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new NotFoundException('Club not found');
    const data = Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined));
    const settings = await this.prisma.tenantSettings.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: 'branding.updated', resource: 'tenant_settings', resourceId: settings.id, metadata: data } });
    return this.getBranding(tenantId);
  }

  async updateMatchdaySettings(tenantId: string, userId: string, roles: string[], dto: UpdateMatchdayDto) {
    if (!roles.some((role) => ['club_owner', 'club_admin', 'stadium_manager'].includes(role))) throw new ForbiddenException('Insufficient permissions');
    const existing = await this.prisma.tenantSettings.findUnique({ where: { tenantId }, select: { id: true, homeConfiguration: true } });
    const current = existing?.homeConfiguration && typeof existing.homeConfiguration === 'object' && !Array.isArray(existing.homeConfiguration)
      ? existing.homeConfiguration as Record<string, unknown> : {};
    const matchday = { ...DEFAULT_MATCHDAY, ...(current.matchday as Record<string, unknown> | undefined), ...dto };
    const homeConfiguration = JSON.parse(JSON.stringify({ ...current, matchday })) as Prisma.InputJsonValue;
    const settings = await this.prisma.tenantSettings.upsert({ where: { tenantId }, create: { tenantId, homeConfiguration }, update: { homeConfiguration } });
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: 'matchday.updated', resource: 'tenant_settings', resourceId: settings.id, metadata: { matchday: JSON.parse(JSON.stringify(matchday)) } } });
    return matchday;
  }
}
