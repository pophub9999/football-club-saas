import { Module } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MockPushProvider } from './mock-push-provider';
import { PUSH_PROVIDER } from './push-provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    NotificationsService,
    MockPushProvider,
    { provide: PUSH_PROVIDER, useExisting: MockPushProvider },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
