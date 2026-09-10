import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TenancyModule } from './tenancy/tenancy.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, TenancyModule, HealthModule],
})
export class AppModule {}
