import { BadRequestException, Body, Controller, Delete, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('preferences')
  getPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.getPreferences(user.id, user.tenantId);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    return this.notifications.updatePreferences(user.id, user.tenantId, {
      notifications: typeof body.notifications === 'boolean' ? body.notifications : undefined,
      matchday: typeof body.matchday === 'boolean' ? body.matchday : undefined,
      marketing: typeof body.marketing === 'boolean' ? body.marketing : undefined,
    });
  }

  @Post('devices')
  registerDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    const token = typeof body.token === 'string' ? body.token : '';
    const platform = body.platform === 'android' || body.platform === 'ios' ? body.platform : null;
    const appVersion = typeof body.appVersion === 'string' ? body.appVersion : undefined;

    if (!token || !platform) {
      throw new BadRequestException('token and platform (android|ios) are required');
    }

    return this.notifications.registerDevice(user.id, user.tenantId, {
      token,
      platform,
      appVersion,
    });
  }

  @Delete('devices')
  unregisterDevice(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    const token = typeof body.token === 'string' ? body.token : '';
    if (!token) throw new BadRequestException('token is required');
    return this.notifications.unregisterDevice(user.id, user.tenantId, token);
  }
}
