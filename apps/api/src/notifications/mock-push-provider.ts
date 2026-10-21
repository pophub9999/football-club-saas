import { Injectable } from '@nestjs/common';
import { PushNotificationMessage, PushNotificationTarget, PushProvider } from './push-provider';

@Injectable()
export class MockPushProvider implements PushProvider {
  readonly sentMessages: Array<{ targets: PushNotificationTarget[]; message: PushNotificationMessage }> = [];

  async send(targets: PushNotificationTarget[], message: PushNotificationMessage) {
    this.sentMessages.push({ targets: [...targets], message });
    return { sent: targets.length, invalidTokens: [] };
  }
}
