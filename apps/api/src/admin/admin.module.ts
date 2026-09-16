import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBrandingController } from './admin-branding.controller';
import { AdminBrandingService } from './admin-branding.service';
import { AdminClubController } from './admin-club.controller';
import { AdminClubService } from './admin-club.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AdminBrandingController, AdminClubController],
  providers: [AdminService, AdminBrandingService, AdminClubService],
})
export class AdminModule {}
