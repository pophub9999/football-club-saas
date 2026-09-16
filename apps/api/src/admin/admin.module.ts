import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RewardsModule } from '../rewards/rewards.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBrandingController } from './admin-branding.controller';
import { AdminBrandingService } from './admin-branding.service';
import { AdminClubController } from './admin-club.controller';
import { AdminClubService } from './admin-club.service';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AdminRewardsController } from './admin-rewards.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';

@Module({
  imports: [PrismaModule, NotificationsModule, RewardsModule],
  controllers: [AdminController, AdminBrandingController, AdminClubController, AdminSettingsController, AdminRewardsController, AdminNotificationsController],
  providers: [AdminService, AdminBrandingService, AdminClubService, AdminSettingsService, AdminNotificationsService],
})
export class AdminModule {}
