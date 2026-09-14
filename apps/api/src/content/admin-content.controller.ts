import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRequest } from '../auth/user-request';
import { ContentService } from './content.service';
import { CreateArticleDto } from './dto/create-article.dto';

@Controller('admin/content')
@UseGuards(JwtAuthGuard)
export class AdminContentController {
  constructor(private readonly content: ContentService) {}

  @Post('news')
  create(@UserRequest() user: AuthenticatedUser, @Body() dto: CreateArticleDto) {
    return this.content.createArticle(user.tenantId, user.id, user.roles, dto);
  }
}
