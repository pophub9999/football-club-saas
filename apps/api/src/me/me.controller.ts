import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { AuthenticatedUser } from '../auth/auth.types';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get()
  getMe(@UserRequest() user: AuthenticatedUser) {
    return user;
  }
}
