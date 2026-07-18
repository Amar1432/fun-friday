import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
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
  private readonly logger = new Logger(AuthService.name);
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

  /**
   * Handles the Google OAuth2 redirect callback.
   *
   * 1. Exchanges the authorization code for an id_token (Google token endpoint)
   * 2. Verifies the id_token
   * 3. Creates or finds the user
   * 4. Returns a signed application JWT
   */
  async handleGoogleCallback(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<{
    accessToken: string;
    expiresIn: number;
    user: { id: string; name: string; email: string };
  }> {
    // Step 1: Exchange the authorization code for an id_token
    const idToken = await this.googleSsoProvider.exchangeAuthorizationCode(
      code,
      codeVerifier,
      redirectUri,
    );

    // Step 2-4: Reuse the existing ssoLogin flow
    return this.ssoLogin('google', idToken);
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
      role: 'host',
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

  async registerGuest(
    roomCode: string,
    displayName: string,
  ): Promise<{
    player: { id: string; displayName: string };
    room: { id: string; code: string };
    accessToken: string;
    expiresIn: number;
  }> {
    const code = roomCode.toUpperCase();
    const room = await this.prisma.room.findUnique({
      where: { code },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (room.status !== 'LOBBY') {
      throw new UnprocessableEntityException(
        'Room is no longer accepting players',
      );
    }

    // Resolve duplicate display names by appending a numbered suffix
    const resolvedName = await this.resolveDisplayName(room.id, displayName);

    const player = await this.prisma.player.create({
      data: {
        roomId: room.id,
        displayName: resolvedName,
      },
    });

    const payload: TokenPayload = {
      sub: player.id,
      name: player.displayName,
      role: 'guest',
      roomId: room.id,
    };

    const accessToken = await this.tokenService.signToken(payload);
    const expiresIn = 14400; // 4 hours in seconds

    return {
      player: {
        id: player.id,
        displayName: player.displayName,
      },
      room: {
        id: room.id,
        code: room.code,
      },
      accessToken,
      expiresIn,
    };
  }

  private async findOrCreateUser(
    profile: SsoUserProfile,
  ): Promise<{ id: string; email: string; name: string }> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        return existingUser;
      }

      return await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
        },
      });
    } catch (error) {
      const dbError = error as { code?: string };
      if (dbError?.code === 'P2002') {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: profile.email },
        });
        if (existingUser) {
          return existingUser;
        }
      }
      throw error;
    }
  }

  /**
   * Resolves a display name to a unique variant by appending a numbered suffix
   * if another player in the same room already has the same name.
   *
   * Examples:
   *   - "Alex" (unique)       → "Alex"
   *   - "Alex" (taken)        → "Alex (1)"
   *   - "Alex" (1 & 2 taken) → "Alex (3)"
   */
  private async resolveDisplayName(
    roomId: string,
    displayName: string,
  ): Promise<string> {
    // Fetch all players in this room to check existing display names
    const existingPlayers = await this.prisma.player.findMany({
      where: { roomId },
      select: { displayName: true },
    });

    const existingNames = new Set(
      existingPlayers.map((p) => p.displayName.toLowerCase()),
    );

    // If the name is unique, use it as-is
    if (!existingNames.has(displayName.toLowerCase())) {
      return displayName;
    }

    // Otherwise, find the next available suffix
    let suffix = 1;
    let resolvedName = `${displayName} (${suffix})`;
    while (existingNames.has(resolvedName.toLowerCase())) {
      suffix++;
      resolvedName = `${displayName} (${suffix})`;
    }

    this.logger.log(
      `Duplicate displayName resolved: "${displayName}" → "${resolvedName}"`,
    );
    return resolvedName;
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
