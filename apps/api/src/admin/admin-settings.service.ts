import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ADMIN_ROLES = ['club_owner', 'club_admin'];
const ALLOWED = ['defaultLocale', 'enabledFeatures', 'homeConfiguration', 'socialLinks', 'legalLinks'];

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(roles: string[]) {
    if (!roles.some(role => ADMIN_ROLES.includes(role))) throw new ForbiddenException('Admin role required');
  }

  async get(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, settings: true } });
    if (!tenant) throw new BadRequestException('Tenant not found');
    const settings = tenant.settings ?? await this.prisma.tenantSettings.create({ data: { tenantId } });
    return { id: settings.id, defaultLocale: settings.defaultLocale, enabledFeatures: settings.enabledFeatures ?? {}, homeConfiguration: settings.homeConfiguration ?? {}, socialLinks: settings.socialLinks ?? {}, legalLinks: settings.legalLinks ?? {} };
  }

  async update(tenantId: string, roles: string[], body: Record<string, unknown>) {
    this.assertAdmin(roles);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new BadRequestException('Tenant not found');
    const data: Record<string, unknown> = {};
    if (typeof body.defaultLocale === 'string' && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(body.defaultLocale)) data.defaultLocale = body.defaultLocale;
    for (const key of ALLOWED.slice(1)) if (body[key] !== undefined && typeof body[key] === 'object' && body[key] !== null) data[key] = body[key];
    const settings = await this.prisma.tenantSettings.upsert({ where: { tenantId }, create: { tenantId, ...data }, update: data });
    return { id: settings.id, defaultLocale: settings.defaultLocale, enabledFeatures: settings.enabledFeatures ?? {}, homeConfiguration: settings.homeConfiguration ?? {}, socialLinks: settings.socialLinks ?? {}, legalLinks: settings.legalLinks ?? {} };
  }
}
