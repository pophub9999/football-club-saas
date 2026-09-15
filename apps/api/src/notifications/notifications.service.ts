import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export interface NotificationPreferences {
  notifications: boolean;
  matchday: boolean;
  marketing: boolean;
}

export type NotificationPreferencePatch = {
  notifications?: boolean | undefined;
  matchday?: boolean | undefined;
  marketing?: boolean | undefined;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notifications: true,
  matchday: true,
  marketing: false,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string, tenantId: string): Promise<NotificationPreferences> {
    const rows = await this.prisma.$queryRaw<Array<{ notifications: boolean; matchday: boolean; marketing: boolean }>>(
      Prisma.sql`SELECT notifications, matchday, marketing
                 FROM user_tenant_notification_preferences
                 WHERE user_id = ${userId}::uuid AND tenant_id = ${tenantId}::uuid
                 LIMIT 1`,
    );
    return rows[0] ? { notifications: rows[0].notifications, matchday: rows[0].matchday, marketing: rows[0].marketing } : { ...DEFAULT_PREFERENCES };
  }

  async updatePreferences(userId: string, tenantId: string, input: NotificationPreferencePatch): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId, tenantId);
    const next: NotificationPreferences = {
      notifications: typeof input.notifications === 'boolean' ? input.notifications : current.notifications,
      matchday: typeof input.matchday === 'boolean' ? input.matchday : current.matchday,
      marketing: typeof input.marketing === 'boolean' ? input.marketing : current.marketing,
    };

    await this.prisma.$executeRaw(
      Prisma.sql`INSERT INTO user_tenant_notification_preferences
                   (user_id, tenant_id, notifications, matchday, marketing, created_at, updated_at)
                 VALUES (${userId}::uuid, ${tenantId}::uuid, ${next.notifications}, ${next.matchday}, ${next.marketing}, NOW(), NOW())
                 ON CONFLICT (user_id, tenant_id)
                 DO UPDATE SET notifications = EXCLUDED.notifications,
                               matchday = EXCLUDED.matchday,
                               marketing = EXCLUDED.marketing,
                               updated_at = NOW()`,
    );

    return next;
  }
}
