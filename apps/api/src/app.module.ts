import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MembershipModule } from './membership/membership.module';
import { MeModule } from './me/me.module';
import { PaymentsModule } from './payments/payments.module';
import { TenancyModule } from './tenancy/tenancy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TenancyModule,
    AuthModule,
    HealthModule,
    MeModule,
    MembershipModule,
    PaymentsModule,
  ],
})
export class AppModule {}
