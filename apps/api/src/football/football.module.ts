import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AdminFootballController } from './admin-football.controller';
import { FootballController } from './football.controller';
import { FootballService } from './football.service';
import { FootballProvider } from './football.types';
import { MockFootballProvider } from './mock-football.provider';
import { SportmonksFootballProvider } from './sportmonks-football.provider';

@Module({
  controllers: [FootballController, AdminFootballController],
  providers: [
    PrismaService,
    MockFootballProvider,
    SportmonksFootballProvider,
    {
      provide: 'FOOTBALL_PROVIDER',
      inject: [ConfigService, MockFootballProvider, SportmonksFootballProvider],
      useFactory: (config: ConfigService, mock: MockFootballProvider, sportmonks: SportmonksFootballProvider): FootballProvider => {
        const selected = (config.get<string>('FOOTBALL_PROVIDER') ?? 'mock').toLowerCase();
        return selected === 'sportmonks' ? sportmonks : mock;
      },
    },
    { provide: FootballService, useFactory: (prisma: PrismaService, provider: FootballProvider) => new FootballService(prisma, provider), inject: [PrismaService, 'FOOTBALL_PROVIDER'] },
  ],
  exports: [FootballService],
})
export class FootballModule {}
