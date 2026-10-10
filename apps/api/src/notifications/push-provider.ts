export interface PushNotificationMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationTarget {
  token: string;
  platform: 'android' | 'ios';
}

export interface PushProvider {
  send(targets: PushNotificationTarget[], message: PushNotificationMessage): Promise<{
    sent: number;
    invalidTokens: string[];
  }>;
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
