import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ADMIN_ROLES = ['club_owner', 'club_admin'];

@Injectable()
export class AdminBrandingService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(roles: string[]) {
    if (!roles.some(role => ADMIN_ROLES.includes(role))) throw new ForbiddenException('Admin role required');
  }

  async get(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, name: true, settings: true },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');
    const settings = tenant.settings ?? await this.prisma.tenantSettings.create({ data: { tenantId } });
    return { tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name }, branding: settings };
  }

  async update(tenantId: string, roles: string[], body: Record<string, unknown>) {
    this.assertAdmin(roles);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new BadRequestException('Tenant not found');

    const text = (key: string) => typeof body[key] === 'string' ? String(body[key]).trim() : undefined;
    const name = text('name');
    const settingsData = Object.fromEntries(Object.entries({
      shortName: text('shortName'),
      slogan: text('slogan'),
      primaryColor: text('primary'),
      secondaryColor: text('secondary'),
      accentColor: text('accent'),
      backgroundColor: text('background'),
      surfaceColor: text('surface'),
    }).filter(([, value]) => value !== undefined));

    const [updatedTenant, settings] = await this.prisma.$transaction([
      ...(name !== undefined ? [this.prisma.tenant.update({ where: { id: tenantId }, data: { name } })] : [this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } })]),
      this.prisma.tenantSettings.upsert({ where: { tenantId }, create: { tenantId, ...settingsData }, update: settingsData }),
    ]);
    return { tenantId: updatedTenant.id, branding: settings, persisted: true };
  }
}
