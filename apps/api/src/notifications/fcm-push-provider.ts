import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createSign } from 'node:crypto';
import { PushNotificationMessage, PushNotificationTarget, PushProvider } from './push-provider';

interface GoogleAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

@Injectable()
export class FcmPushProvider implements PushProvider {
  private readonly logger = new Logger(FcmPushProvider.name);
  private cachedToken?: { value: string; expiresAt: number };

  constructor(private readonly config: ConfigService) {}

  async send(targets: PushNotificationTarget[], message: PushNotificationMessage) {
    const projectId = this.config.get<string>('FCM_PROJECT_ID');
    const clientEmail = this.config.get<string>('FCM_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('FCM is not configured: FCM_PROJECT_ID, FCM_CLIENT_EMAIL and FCM_PRIVATE_KEY are required');
    }

    const accessToken = await this.getAccessToken(clientEmail, privateKey);
    let sent = 0;
    const invalidTokens: string[] = [];

    for (const target of targets) {
      const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: target.token,
            notification: { title: message.title, body: message.body },
            data: message.data,
          },
        }),
      });

      if (response.ok) {
        sent += 1;
        continue;
      }

      const body = await response.text();
      if (body.includes('UNREGISTERED') || body.includes('registration-token-not-registered')) {
        invalidTokens.push(target.token);
        continue;
      }

      if (response.status === 401) {
        this.cachedToken = undefined;
      }
      this.logger.error(`FCM send failed (${response.status}): ${body.slice(0, 500)}`);
    }

    return { sent, invalidTokens };
  }

  private async getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.value;
    }

    const now = Math.floor(Date.now() / 1000);
    const assertion = [
      this.base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
      this.base64Url(JSON.stringify({
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })),
    ];
    const signer = createSign('RSA-SHA256');
    signer.update(assertion.join('.'));
    assertion.push(this.base64Url(signer.sign(privateKey)));

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion.join('.'),
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Unable to obtain FCM access token (${response.status})`);
    }

    const payload = await response.json() as GoogleAccessTokenResponse;
    this.cachedToken = {
      value: payload.access_token,
      expiresAt: Date.now() + Math.max(payload.expires_in - 60, 60) * 1000,
    };
    return payload.access_token;
  }

  private base64Url(value: string | Buffer): string {
    const encoded = Buffer.isBuffer(value) ? value.toString('base64') : Buffer.from(value).toString('base64');
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
}
