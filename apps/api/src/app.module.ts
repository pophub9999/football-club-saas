import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { BillingModule } from './billing/billing.module';
import { FootballModule } from './football/football.module';
import { ContentModule } from './content/content.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RewardsModule } from './rewards/rewards.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AuthModule, MembersModule, BillingModule, FootballModule, ContentModule, TicketsModule, NotificationsModule, RewardsModule, AdminModule],
})
export class AppModule {}
