import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { SsoProvider, SsoUserProfile } from './sso-provider.interface';

export interface MicrosoftJwk {
  kty: string;
  use?: string;
  kid: string;
  n: string;
  e: string;
  [key: string]: any;
}

@Injectable()
export class MicrosoftSsoProvider implements SsoProvider {
  private readonly clientId: string;
  private keysCache: MicrosoftJwk[] = [];
  private cacheExpiry = 0;

  constructor() {
    this.clientId = process.env.MICROSOFT_CLIENT_ID ?? '';
  }

  async verifyIdToken(idToken: string): Promise<SsoUserProfile> {
    try {
      const decoded = jwt.decode(idToken, { complete: true });
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new UnauthorizedException('Invalid Microsoft token header');
      }

      const kid = decoded.header.kid;
      const jwk = await this.findJwk(kid);
      if (!jwk) {
        throw new UnauthorizedException(
          'Microsoft public key not found for kid',
        );
      }

      const publicKey = crypto.createPublicKey({
        format: 'jwk',
        key: jwk,
      });

      const payload = jwt.verify(idToken, publicKey, {
        audience: this.clientId,
      }) as jwt.JwtPayload;

      // Microsoft Azure AD token issuer check
      const iss = payload.iss;
      if (
        !iss ||
        !iss.startsWith('https://login.microsoftonline.com/') ||
        !iss.endsWith('/v2.0')
      ) {
        throw new UnauthorizedException('Invalid Microsoft token issuer');
      }

      const email = (payload.email || payload.preferred_username) as
        string | undefined;
      const name = payload.name as string | undefined;

      if (!email || !name) {
        throw new UnauthorizedException(
          'Microsoft token is missing required user profile fields (email or name)',
        );
      }

      return {
        email,
        name,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Invalid Microsoft ID token: ${(error as Error).message}`,
      );
    }
  }

  private async findJwk(kid: string): Promise<MicrosoftJwk | null> {
    let keys = await this.getJwks();
    let jwk = keys.find((key) => key.kid === kid);

    // If key not found in cache, clear cache and force refetch once
    if (!jwk && this.keysCache.length > 0) {
      this.keysCache = [];
      this.cacheExpiry = 0;
      keys = await this.getJwks();
      jwk = keys.find((key) => key.kid === kid);
    }

    return jwk || null;
  }

  private async getJwks(): Promise<MicrosoftJwk[]> {
    const now = Date.now();
    if (this.keysCache.length > 0 && now < this.cacheExpiry) {
      return this.keysCache;
    }

    try {
      const response = await fetch(
        'https://login.microsoftonline.com/common/discovery/v2.0/keys',
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
      }
      const data = (await response.json()) as { keys: MicrosoftJwk[] };
      if (!data || !Array.isArray(data.keys)) {
        throw new Error('Invalid JWKS response format');
      }

      this.keysCache = data.keys;
      this.cacheExpiry = now + 24 * 60 * 60 * 1000; // Cache for 24 hours
      return this.keysCache;
    } catch (error) {
      if (this.keysCache.length > 0) {
        return this.keysCache;
      }
      throw error;
    }
  }
}
