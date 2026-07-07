import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Socket } from 'socket.io';

@Injectable()
export class SocketLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SocketGateway');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const wsContext = context.switchToWs();
    const client = wsContext.getClient<Socket>();
    const data: unknown = wsContext.getData();
    const eventData = data as Record<string, unknown> | undefined;
    const clientData = client.data as
      { user?: { sub: string }; roomId?: string } | undefined;

    // In NestJS WebSockets, getPattern() returns the event name (e.g. 'JoinRoom')
    const event = wsContext.getPattern();
    const startTime = Date.now();

    const socketId = client.id;
    const playerId = clientData?.user?.sub || 'unauthenticated';
    const roomId =
      (eventData?.roomId as string) ||
      (eventData?.roomCode as string) ||
      clientData?.roomId ||
      'none';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[WS Event Success] event="${event}" socketId="${socketId}" playerId="${playerId}" roomId="${roomId}" duration=${duration}ms`,
          );
        },
        error: (err: any) => {
          const duration = Date.now() - startTime;
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `[WS Event Failed] event="${event}" socketId="${socketId}" playerId="${playerId}" roomId="${roomId}" duration=${duration}ms error="${message}"`,
          );
        },
      }),
    );
  }
}
