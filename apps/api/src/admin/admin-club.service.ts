import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ADMIN_ROLES = ['club_owner', 'club_admin'];

@Injectable()
export class AdminClubService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(roles: string[]) {
    if (!roles.some(role => ADMIN_ROLES.includes(role))) throw new ForbiddenException('Admin role required');
  }

  async get(tenantId: string, roles: string[]) {
    this.assertAdmin(roles);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, name: true, status: true, createdAt: true, updatedAt: true, settings: true },
    });
    if (!tenant) throw new BadRequestException('Tenant not found');
    return { id: tenant.id, slug: tenant.slug, name: tenant.name, status: tenant.status, createdAt: tenant.createdAt, updatedAt: tenant.updatedAt, shortName: tenant.settings?.shortName ?? null, slogan: tenant.settings?.slogan ?? null };
  }

  async update(tenantId: string, roles: string[], body: Record<string, unknown>) {
    this.assertAdmin(roles);
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : undefined;
    if (name !== undefined && (name.length < 2 || name.length > 160)) throw new BadRequestException('Invalid club name');
    if (slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new BadRequestException('Invalid club slug');

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { ...(name !== undefined ? { name } : {}), ...(slug !== undefined ? { slug } : {}) },
      select: { id: true, slug: true, name: true, status: true, updatedAt: true },
    });
    return tenant;
  }
}
