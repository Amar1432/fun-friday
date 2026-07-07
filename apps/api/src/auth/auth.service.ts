import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TokenService, TokenPayload } from './token.service';
import { GoogleSsoProvider } from './providers/google-sso.provider';
import { MicrosoftSsoProvider } from './providers/microsoft-sso.provider';
import {
  SsoProvider,
  SsoUserProfile,
} from './providers/sso-provider.interface';

@Injectable()
export class AuthService {
  private readonly providers: Record<string, SsoProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly googleSsoProvider: GoogleSsoProvider,
    private readonly microsoftSsoProvider: MicrosoftSsoProvider,
  ) {
    this.providers = {
      google: this.googleSsoProvider,
      microsoft: this.microsoftSsoProvider,
    };
  }

  async ssoLogin(
    provider: string,
    idToken: string,
  ): Promise<{
    accessToken: string;
    expiresIn: number;
    user: { id: string; name: string; email: string };
  }> {
    const ssoProvider = this.providers[provider];
    if (!ssoProvider) {
      throw new UnauthorizedException(`Unsupported SSO provider: ${provider}`);
    }

    const profile: SsoUserProfile = await ssoProvider.verifyIdToken(idToken);

    // Find or create user
    const user = await this.findOrCreateUser(profile);

    // Sign application JWT
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    const accessToken = await this.tokenService.signToken(payload);

    // Parse expiration from env (default 24h = 86400s)
    const expiresIn = this.parseExpiresIn(process.env.JWT_EXPIRATION ?? '24h');

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  private async findOrCreateUser(
    profile: SsoUserProfile,
  ): Promise<{ id: string; email: string; name: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
      },
    });
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value);
    if (!match) return 86400; // default 24h

    const num = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 3600;
      case 'd':
        return num * 86400;
      default:
        return 86400;
    }
  }
}
