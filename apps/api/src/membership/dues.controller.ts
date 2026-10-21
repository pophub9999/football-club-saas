import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { DuesQueryDto } from './dto/dues-query.dto';
import { DuesService } from './dues.service';

@Controller('membership/dues')
@UseGuards(JwtAuthGuard)
export class DuesController {
  constructor(private readonly duesService: DuesService) {}

  @Get()
  list(@UserRequest() user: AuthenticatedUser, @Query() query: DuesQueryDto) {
    return this.duesService.listForMember(user.tenantId, user.id, query.status);
  }

  @Get(':dueId')
  get(@UserRequest() user: AuthenticatedUser, @Param('dueId') dueId: string) {
    return this.duesService.getForMember(user.tenantId, user.id, dueId);
  }
}
