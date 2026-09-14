import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ClubsModule } from './clubs/clubs.module';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { ErpModule } from './erp/erp.module';
import { FootballModule } from './football/football.module';
import { HealthModule } from './health/health.module';
import { MembershipModule } from './membership/membership.module';
import { MeModule } from './me/me.module';
import { PaymentsModule } from './payments/payments.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TenancyModule,
    AuthModule,
    ClubsModule,
    ContentModule,
    ErpModule,
    FootballModule,
    HealthModule,
    MeModule,
    MembershipModule,
    PaymentsModule,
    TicketsModule,
  ],
})
export class AppModule {}
