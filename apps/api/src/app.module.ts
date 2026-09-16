import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { ErpModule } from './erp/erp.module';
import { FootballModule } from './football/football.module';
import { HealthModule } from './health/health.module';
import { MembershipModule } from './membership/membership.module';
import { MeModule } from './me/me.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TenancyModule,
    AuthModule,
    AdminModule,
    ClubsModule,
    ContentModule,
    ErpModule,
    FootballModule,
    HealthModule,
    MeModule,
    MembershipModule,
    NotificationsModule,
    PaymentsModule,
    TicketsModule,
  ],
})
export class AppModule {}
