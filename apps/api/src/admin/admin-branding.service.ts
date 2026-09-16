import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ADMIN_ROLES = ['club_owner', 'club_admin'];
const ALLOWED = ['shortName', 'slogan', 'primary', 'secondary', 'accent', 'background', 'surface', 'logoUrl', 'logoDarkUrl', 'heroImageUrl', 'appIconUrl', 'textColor', 'mutedTextColor'];

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

    const value = (key: string) => typeof body[key] === 'string' ? String(body[key]).trim() : undefined;
    const data = {
      shortName: value('shortName'),
      slogan: value('slogan'),
      primaryColor: value('primary'),
      secondaryColor: value('secondary'),
      accentColor: value('accent'),
      backgroundColor: value('background'),
      surfaceColor: value('surface'),
      logoUrl: value('logoUrl'),
      logoDarkUrl: value('logoDarkUrl'),
      heroImageUrl: value('heroImageUrl'),
      appIconUrl: value('appIconUrl'),
      textColor: value('textColor'),
      mutedTextColor: value('mutedTextColor'),
    };

    const cleaned = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const settings = await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: { tenantId, ...cleaned },
      update: cleaned,
    });
    return { tenantId, branding: settings, persisted: true };
  }
}
