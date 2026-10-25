import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FcmPushProvider } from './fcm-push-provider';
import { MockPushProvider } from './mock-push-provider';
import { PUSH_PROVIDER, PushProvider } from './push-provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    PrismaService,
    NotificationsService,
    MockPushProvider,
    FcmPushProvider,
    {
      provide: PUSH_PROVIDER,
      inject: [ConfigService, MockPushProvider, FcmPushProvider],
      useFactory: (config: ConfigService, mock: MockPushProvider, fcm: FcmPushProvider): PushProvider =>
        config.get<string>('PUSH_PROVIDER', 'mock') === 'fcm' ? fcm : mock,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
