import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
  controllers: [RewardsController],
  providers: [PrismaService, RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
