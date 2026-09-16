import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MembersModule } from './members/members.module';
import { BillingModule } from './billing/billing.module';
import { FootballModule } from './football/football.module';
import { ContentModule } from './content/content.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [PrismaModule, AuthModule, MembersModule, BillingModule, FootballModule, ContentModule, TicketsModule, NotificationsModule, AdminModule],
})
export class AppModule {}
