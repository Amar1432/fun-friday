import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = process.hrtime();

    // Check for incoming request ID or generate a new one
    const rawRequestId = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId) ||
      crypto.randomUUID();

    // Attach request ID to request headers & response headers
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const responseTimeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      const method = req.method;
      const url = req.originalUrl || req.url;
      const status = res.statusCode;

      const logData = {
        method,
        url,
        status,
        responseTime: `${responseTimeMs}ms`,
        requestId,
      };

      this.logger.log(JSON.stringify(logData));
    });

    next();
  }
}
