import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { AdminNotificationsService } from './admin-notifications.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isClubAdmin(user: AuthenticatedUser) {
  return user.roles.includes('club_owner') || user.roles.includes('club_admin');
}

function parseLimit(value?: string) {
  if (value === undefined) return 50;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new BadRequestException('limit must be an integer between 1 and 100');
  }
  return parsed;
}

function parseData(value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BadRequestException('data must be an object');
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 20) throw new BadRequestException('data supports up to 20 fields');

  const data: Record<string, string> = {};
  for (const [key, item] of entries) {
    if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(key) || typeof item !== 'string' || item.length > 500) {
      throw new BadRequestException('data keys must be simple identifiers and values must be strings up to 500 characters');
    }
    data[key] = item;
  }
  return data;
}

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    if (!isClubAdmin(user)) throw new BadRequestException('Admin role required');
    return this.notifications.history(user.tenantId, parseLimit(limit));
  }

  @Post('send')
  send(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    if (!isClubAdmin(user)) throw new BadRequestException('Admin role required');

    const category = body.category;
    if (category !== 'general' && category !== 'matchday' && category !== 'marketing') {
      throw new BadRequestException('category must be general, matchday or marketing');
    }

    const audience = body.audience;
    if (audience !== 'all' && audience !== 'user') {
      throw new BadRequestException('audience must be all or user');
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || !message) throw new BadRequestException('title and body are required');
    if (title.length > 160) throw new BadRequestException('title must be 160 characters or fewer');
    if (message.length > 1000) throw new BadRequestException('body must be 1000 characters or fewer');

    let userId: string | undefined;
    if (audience === 'user') {
      if (typeof body.userId !== 'string' || !UUID_RE.test(body.userId)) {
        throw new BadRequestException('valid userId is required for user audience');
      }
      userId = body.userId;
    }

    return this.notifications.send(user.tenantId, user.id, {
      category,
      audience,
      userId,
      title,
      body: message,
      data: parseData(body.data),
    });
  }
}
