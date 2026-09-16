import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBrandingController } from './admin-branding.controller';
import { AdminBrandingService } from './admin-branding.service';
import { AdminClubController } from './admin-club.controller';
import { AdminClubService } from './admin-club.service';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AdminBrandingController, AdminClubController, AdminSettingsController],
  providers: [AdminService, AdminBrandingService, AdminClubService, AdminSettingsService],
})
export class AdminModule {}
