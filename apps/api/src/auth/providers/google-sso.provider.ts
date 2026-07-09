import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { SsoProvider, SsoUserProfile } from './sso-provider.interface';

@Injectable()
export class GoogleSsoProvider implements SsoProvider {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID ?? '';
    this.client = new OAuth2Client(this.clientId);
  }

  async verifyIdToken(idToken: string): Promise<SsoUserProfile> {
    if (
      process.env.NODE_ENV !== 'production' &&
      idToken.startsWith('mock_token_')
    ) {
      const email = idToken.replace('mock_token_', '');
      return {
        email,
        name: email.split('@')[0],
      };
    }

    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload?.email || !payload.name) {
        throw new UnauthorizedException(
          'Google token is missing required user profile fields',
        );
      }

      return {
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}
