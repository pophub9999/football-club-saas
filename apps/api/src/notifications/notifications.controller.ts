import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
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
}
