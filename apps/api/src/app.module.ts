import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { MembershipModule } from './membership/membership.module';
import { PaymentsModule } from './payments/payments.module';
import { FootballModule } from './football/football.module';
import { ContentModule } from './content/content.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RewardsModule } from './rewards/rewards.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ClubsModule,
    MembershipModule,
    PaymentsModule,
    FootballModule,
    ContentModule,
    TicketsModule,
    NotificationsModule,
    RewardsModule,
    AdminModule,
  ],
})
export class AppModule {}
