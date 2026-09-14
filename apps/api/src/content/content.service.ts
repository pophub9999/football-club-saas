import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateArticleInput {
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  imageUrl?: string;
  category?: string;
  publishedAt?: string;
  isPublished?: boolean;
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async listArticles(tenantId: string, limit = 20) {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    return this.prisma.article.findMany({
      where: { tenantId, isPublished: true, publishedAt: { lte: new Date() } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: safeLimit,
      select: { id: true, slug: true, title: true, excerpt: true, imageUrl: true, category: true, publishedAt: true },
    });
  }

  async getArticle(tenantId: string, articleIdOrSlug: string) {
    const article = await this.prisma.article.findFirst({
      where: { tenantId, isPublished: true, publishedAt: { lte: new Date() }, OR: [{ id: articleIdOrSlug }, { slug: articleIdOrSlug }] },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async createArticle(tenantId: string, userId: string, roles: string[], input: CreateArticleInput) {
    const allowed = ['club_owner', 'club_admin', 'content_editor'];
    if (!roles.some((role) => allowed.includes(role))) throw new ForbiddenException('Insufficient permissions');
    const article = await this.prisma.article.create({
      data: {
        tenantId,
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        body: input.body,
        imageUrl: input.imageUrl,
        category: input.category,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : input.isPublished ? new Date() : null,
        isPublished: input.isPublished ?? false,
      },
    });
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: 'article.created', resource: 'article', resourceId: article.id } });
    return article;
  }
}
