import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AdminFootballController } from './admin-football.controller';
import { FootballController } from './football.controller';
import { FootballService } from './football.service';
import { MockFootballProvider } from './mock-football.provider';

@Module({
  controllers: [FootballController, AdminFootballController],
  providers: [PrismaService, FootballService, MockFootballProvider],
  exports: [FootballService],
})
export class FootballModule {}
