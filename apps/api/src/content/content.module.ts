import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AdminContentController } from './admin-content.controller';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({ controllers: [ContentController, AdminContentController], providers: [PrismaService, ContentService], exports: [ContentService] })
export class ContentModule {}
