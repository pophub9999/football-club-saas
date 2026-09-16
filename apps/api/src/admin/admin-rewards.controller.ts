import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { RewardsService } from '../rewards/rewards.service';

function isClubAdmin(user: AuthenticatedUser) {
  return user.roles.includes('club_owner') || user.roles.includes('club_admin');
}

@Controller('admin/rewards')
@UseGuards(JwtAuthGuard)
export class AdminRewardsController {
  constructor(private readonly rewards: RewardsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    if (!isClubAdmin(user)) throw new Error('Forbidden');
    return this.rewards.adminList(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    if (!isClubAdmin(user)) throw new Error('Forbidden');
    return this.rewards.adminCreate(user.tenantId, {
      name: typeof body.name === 'string' ? body.name : '',
      description: typeof body.description === 'string' ? body.description : undefined,
      pointsCost: Number(body.pointsCost),
      stock: body.stock === null || body.stock === undefined || body.stock === '' ? null : Number(body.stock),
    });
  }

  @Patch(':rewardId')
  setActive(@CurrentUser() user: AuthenticatedUser, @Param('rewardId') rewardId: string, @Body() body: Record<string, unknown>) {
    if (!isClubAdmin(user)) throw new Error('Forbidden');
    return this.rewards.adminSetActive(user.tenantId, rewardId, body.isActive === true);
  }

  @Post('/award')
  award(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, unknown>) {
    if (!isClubAdmin(user)) throw new Error('Forbidden');
    return this.rewards.adminAward(user.tenantId, String(body.userId ?? ''), Number(body.points), String(body.reason ?? ''));
  }
}
