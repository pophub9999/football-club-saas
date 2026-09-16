import { BadRequestException, Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { AdminNotificationsService } from './admin-notifications.service';

function isClubAdmin(user: AuthenticatedUser) {
  return user.roles.includes('club_owner') || user.roles.includes('club_admin');
}

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard)
export class AdminNotificationsController {
  constructor(private readonly notifications: AdminNotificationsService) {}

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    if (!isClubAdmin(user)) throw new BadRequestException('Admin role required');
    const parsed = limit ? Number(limit) : 50;
    return this.notifications.history(user.tenantId, Number.isFinite(parsed) ? parsed : 50);
  }

  @Post('send')
  send(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    if (!isClubAdmin(user)) throw new BadRequestException('Admin role required');
    const category = body.category === 'matchday' || body.category === 'marketing' ? body.category : 'general';
    const audience = body.audience === 'user' ? 'user' : 'all';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const message = typeof body.body === 'string' ? body.body.trim() : '';
    if (!title || !message) throw new BadRequestException('title and body are required');
    if (audience === 'user' && typeof body.userId !== 'string') throw new BadRequestException('userId is required for user audience');
    return this.notifications.send(user.tenantId, user.id, {
      category,
      audience,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      title,
      body: message,
      data: body.data && typeof body.data === 'object' ? body.data as Record<string, string> : undefined,
    });
  }
}
