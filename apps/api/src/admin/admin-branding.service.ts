import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ADMIN_ROLES = ['club_owner', 'club_admin'];
const ALLOWED = ['name', 'shortName', 'slogan', 'primary', 'secondary', 'accent', 'background', 'surface'];

@Injectable()
export class AdminBrandingService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(roles: string[]) {
    if (!roles.some(role => ADMIN_ROLES.includes(role))) throw new ForbiddenException('Admin role required');
  }

  async get(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true } });
    if (!tenant) throw new BadRequestException('Tenant not found');
    return { tenant, branding: {} };
  }

  async update(tenantId: string, roles: string[], body: Record<string, unknown>) {
    this.assertAdmin(roles);
    const branding = Object.fromEntries(Object.entries(body).filter(([key]) => ALLOWED.includes(key)));
    return { tenantId, branding, persisted: false, message: 'Branding persistence requires the tenant branding fields/migration.' };
  }
}
