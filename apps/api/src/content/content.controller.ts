import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { ContentService } from './content.service';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly content: ContentService) {}
  @Get('news') news(@UserRequest() user: AuthenticatedUser, @Query('limit') limit?: string) { return this.content.listArticles(user.tenantId, Number(limit ?? 20)); }
  @Get('news/:articleIdOrSlug') article(@UserRequest() user: AuthenticatedUser, @Param('articleIdOrSlug') articleIdOrSlug: string) { return this.content.getArticle(user.tenantId, articleIdOrSlug); }
}
