import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService, NotificationCategory } from '../notifications/notifications.service';

interface SendInput {
  category: NotificationCategory;
  audience: 'all' | 'user';
  userId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

  async send(tenantId: string, createdByUserId: string, input: SendInput) {
    const users = input.audience === 'user'
      ? await this.prisma.$queryRaw<Array<{ user_id: string }>>(Prisma.sql`
          SELECT user_id FROM user_tenants WHERE tenant_id = ${tenantId}::uuid AND user_id = ${input.userId ?? ''}::uuid LIMIT 1`)
      : await this.prisma.$queryRaw<Array<{ user_id: string }>>(Prisma.sql`
          SELECT user_id FROM user_tenants WHERE tenant_id = ${tenantId}::uuid`);

    if (input.audience === 'user' && users.length === 0) throw new NotFoundException('User is not associated with this club');

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    for (const row of users) {
      try {
        const result = await this.notifications.sendToUser(row.user_id, tenantId, { title: input.title.slice(0, 160), body: input.body.slice(0, 1000), data: input.data }, input.category);
        sentCount += result.sent;
        if (result.skipped) skippedCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      INSERT INTO notification_log
        (tenant_id, created_by_user_id, category, title, body, audience, target_user_id, sent_count, skipped_count, failed_count, data)
      VALUES
        (${tenantId}::uuid, ${createdByUserId}::uuid, ${input.category}, ${input.title.slice(0, 160)}, ${input.body.slice(0, 1000)}, ${input.audience}, ${input.userId ? Prisma.sql`${input.userId}::uuid` : Prisma.sql`NULL`}, ${sentCount}, ${skippedCount}, ${failedCount}, ${input.data ? JSON.stringify(input.data) : null}::jsonb)
      RETURNING id, category, title, body, audience, sent_count, skipped_count, failed_count, created_at`);
    return rows[0];
  }

  history(tenantId: string, limit = 50) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT id, category, title, body, audience, target_user_id, sent_count, skipped_count, failed_count, created_at
      FROM notification_log
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`);
  }
}
