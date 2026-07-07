import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface TokenPayload {
  sub: string; // User ID or Player ID
  email?: string; // Only present for host
  name: string;
  role?: 'host' | 'guest';
  roomId?: string; // Room ID for guests
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync<TokenPayload>(token);
  }
}
