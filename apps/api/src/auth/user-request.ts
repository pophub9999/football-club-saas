import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from './auth.types';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

export const UserRequest = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequest =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>(),
);
