import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseInterceptors } from '@nestjs/common';
import { TokenService, TokenPayload } from '../auth/token.service';
import { SocketLoggingInterceptor } from '../common/interceptors/socket-logging.interceptor';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
@UseInterceptors(SocketLoggingInterceptor)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly tokenService: TokenService) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(
        `Connection rejected: Missing token for socket ${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.tokenService.verifyToken(token);

      const clientData = client.data as { user?: TokenPayload };
      clientData.user = payload;

      this.logger.log(
        `Socket connected and authenticated: id=${client.id}, userId=${payload.sub}, name=${payload.name}, role=${payload.role || 'host'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      this.logger.warn(
        `Connection rejected: ${message} for socket ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const clientData = client.data as { user?: TokenPayload } | undefined;
    const user = clientData?.user;
    const userId = user?.sub || 'unauthenticated';
    this.logger.log(`Socket disconnected: id=${client.id}, userId=${userId}`);
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    let token = auth?.token;

    if (!token) {
      token = client.handshake.headers.authorization;
    }

    if (typeof token !== 'string') return null;

    if (token.startsWith('Bearer ')) {
      return token.substring(7);
    }
    return token;
  }

  @SubscribeMessage('ping')
  handlePing(): { status: string } {
    return { status: 'pong' };
  }
}
