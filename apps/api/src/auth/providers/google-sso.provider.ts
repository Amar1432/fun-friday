import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { SsoProvider, SsoUserProfile } from './sso-provider.interface';

@Injectable()
export class GoogleSsoProvider implements SsoProvider {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID ?? '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
    // redirect_uri is now passed per-request from the frontend so it matches
    // whichever frontend domain the user is on (localhost, preview, production).
    // The env var is kept as a fallback for the OAuth2Client constructor.
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? '';
    this.client = new OAuth2Client(this.clientId, clientSecret, redirectUri);
  }

  /**
   * Exchanges an OAuth2 authorization code for an id_token using the
   * Google token endpoint. The client_secret is sent server-side where
   * it is safe from exposure.
   *
   * @param code        The authorization code from Google's redirect
   * @param codeVerifier The PKCE code verifier stored during the redirect
   * @returns The JWT id_token string
   */
  async exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<string> {
    try {
      const { tokens } = await this.client.getToken({
        code,
        codeVerifier,
        redirect_uri: redirectUri,
      });

      if (!tokens.id_token) {
        throw new UnauthorizedException('Google did not return an ID token');
      }

      return tokens.id_token;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Google token exchange failed: ${(error as Error).message}`,
      );
    }
  }

  async verifyIdToken(idToken: string): Promise<SsoUserProfile> {
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
