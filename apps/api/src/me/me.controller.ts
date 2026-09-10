import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRequest } from '../auth/user-request';
import { Request } from 'express';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  @Get()
  getMe(@UserRequest() request: Request) {
    return request.user;
  }
}
