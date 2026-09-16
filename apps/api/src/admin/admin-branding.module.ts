import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminBrandingController } from './admin-branding.controller';
import { AdminBrandingService } from './admin-branding.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminBrandingController],
  providers: [AdminBrandingService],
})
export class AdminBrandingModule {}
