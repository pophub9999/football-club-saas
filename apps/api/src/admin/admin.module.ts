import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminBrandingController } from './admin-branding.controller';
import { AdminBrandingService } from './admin-branding.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AdminBrandingController],
  providers: [AdminService, AdminBrandingService],
})
export class AdminModule {}
