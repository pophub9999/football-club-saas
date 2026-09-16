import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { RewardsService } from './rewards.service';

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get('balance')
  balance(@CurrentUser() user: AuthenticatedUser) { return this.rewards.getBalance(user.id, user.tenantId); }

  @Get('catalog')
  catalog(@CurrentUser() user: AuthenticatedUser) { return this.rewards.getCatalog(user.tenantId); }

  @Get('ledger')
  ledger(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.rewards.getLedger(user.id, user.tenantId, Number.isFinite(parsed) ? parsed : 50);
  }

  @Post(':rewardId/redeem')
  redeem(@CurrentUser() user: AuthenticatedUser, @Param('rewardId') rewardId: string) {
    if (!rewardId) throw new BadRequestException('rewardId is required');
    return this.rewards.redeem(user.id, user.tenantId, rewardId);
  }
}
