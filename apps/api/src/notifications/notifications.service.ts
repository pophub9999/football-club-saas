import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PUSH_PROVIDER, PushNotificationMessage, PushProvider } from './push-provider';

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

export type NotificationDevicePlatform = 'android' | 'ios';
export type NotificationCategory = 'general' | 'matchday' | 'marketing';

export interface RegisterNotificationDeviceInput {
  token: string;
  platform: NotificationDevicePlatform;
  appVersion?: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notifications: true,
  matchday: true,
  marketing: false,
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PROVIDER) private readonly pushProvider: PushProvider,
  ) {}

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

  async registerDevice(userId: string, tenantId: string, input: RegisterNotificationDeviceInput) {
    const token = input.token.trim();
    if (token.length < 20 || token.length > 4096) {
      throw new Error('Invalid notification device token');
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const appVersion = input.appVersion?.trim().slice(0, 40) || null;

    await this.prisma.$executeRaw(
      Prisma.sql`INSERT INTO user_notification_devices
                   (user_id, tenant_id, token, token_hash, platform, app_version, last_seen_at, created_at, updated_at)
                 VALUES (${userId}::uuid, ${tenantId}::uuid, ${token}, ${tokenHash}, ${input.platform}, ${appVersion}, NOW(), NOW(), NOW())
                 ON CONFLICT (token_hash)
                 DO UPDATE SET user_id = EXCLUDED.user_id,
                               tenant_id = EXCLUDED.tenant_id,
                               platform = EXCLUDED.platform,
                               app_version = EXCLUDED.app_version,
                               last_seen_at = NOW(),
                               updated_at = NOW()`,
    );

    return { registered: true, platform: input.platform };
  }

  async unregisterDevice(userId: string, tenantId: string, token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) return { removed: false };

    const tokenHash = createHash('sha256').update(normalizedToken).digest('hex');
    const removed = await this.prisma.$executeRaw(
      Prisma.sql`DELETE FROM user_notification_devices
                 WHERE token_hash = ${tokenHash}
                   AND user_id = ${userId}::uuid
                   AND tenant_id = ${tenantId}::uuid`,
    );

    return { removed: removed > 0 };
  }

  async sendToUser(
    userId: string,
    tenantId: string,
    message: PushNotificationMessage,
    category: NotificationCategory = 'general',
  ) {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences.notifications) {
      return { sent: 0, skipped: true, skipReason: 'notifications_disabled' as const, invalidTokens: [] as string[] };
    }
    if (category === 'matchday' && !preferences.matchday) {
      return { sent: 0, skipped: true, skipReason: 'matchday_disabled' as const, invalidTokens: [] as string[] };
    }
    if (category === 'marketing' && !preferences.marketing) {
      return { sent: 0, skipped: true, skipReason: 'marketing_disabled' as const, invalidTokens: [] as string[] };
    }

    const devices = await this.prisma.$queryRaw<Array<{ token: string; platform: NotificationDevicePlatform }>>(
      Prisma.sql`SELECT token, platform
                 FROM user_notification_devices
                 WHERE user_id = ${userId}::uuid AND tenant_id = ${tenantId}::uuid`,
    );

    if (devices.length === 0) return { sent: 0, skipped: false, invalidTokens: [] as string[] };

    const result = await this.pushProvider.send(devices, message);
    if (result.invalidTokens.length > 0) {
      const hashes = result.invalidTokens.map((token) => createHash('sha256').update(token).digest('hex'));
      await this.prisma.$executeRaw(
        Prisma.sql`DELETE FROM user_notification_devices
                   WHERE tenant_id = ${tenantId}::uuid
                     AND token_hash IN (${Prisma.join(hashes)})`,
      );
    }

    return { sent: result.sent, skipped: false, invalidTokens: result.invalidTokens };
  }

  sendGeneralNotification(userId: string, tenantId: string, message: PushNotificationMessage) {
    return this.sendToUser(userId, tenantId, message, 'general');
  }

  sendMatchdayNotification(userId: string, tenantId: string, message: PushNotificationMessage) {
    return this.sendToUser(userId, tenantId, message, 'matchday');
  }

  sendMarketingNotification(userId: string, tenantId: string, message: PushNotificationMessage) {
    return this.sendToUser(userId, tenantId, message, 'marketing');
  }
}
