import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
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

    // Check duplicate name
    const existingPlayer = await this.prisma.player.findFirst({
      where: {
        roomId: room.id,
        displayName,
      },
    });

    if (existingPlayer) {
      throw new ConflictException('Display name already exists');
    }

    const player = await this.prisma.player.create({
      data: {
        roomId: room.id,
        displayName,
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
