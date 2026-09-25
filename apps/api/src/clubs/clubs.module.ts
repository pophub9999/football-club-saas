import { Module } from '@nestjs/common';
import { AdminClubsController } from './admin-clubs.controller';
import { ClubsController, ClubsMatchdayAdminController } from './clubs.controller';
import { ClubsService } from './clubs.service';

@Module({
  controllers: [ClubsController, AdminClubsController, ClubsMatchdayAdminController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
