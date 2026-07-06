import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ApiErrorPayload {
  code: string;
  message: string;
  details?: string[];
  stack?: string;
}

interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: string[] | undefined = undefined;

    const statusToCodeMap: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = statusToCodeMap[status] ?? 'HTTP_ERROR';
      message = exception.message;

      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if ('message' in responseObj) {
          const responseMessage = responseObj.message;
          if (typeof responseMessage === 'string') {
            message = responseMessage;
          } else if (Array.isArray(responseMessage)) {
            message = 'Validation failed';
            details = responseMessage.map((item) => String(item));
            code = 'VALIDATION_ERROR';
          }
        }
      }
    } else {
      // Non-HttpException (Internal Server Error)
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd && exception instanceof Error) {
        message = exception.message;
      }
    }

    const rawRequestId = request.headers['x-request-id'];
    const requestId =
      (Array.isArray(rawRequestId) ? rawRequestId[0] : rawRequestId) ||
      'unknown';

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - RequestID: ${requestId} - Error: ${
        exception instanceof Error ? exception.message : String(exception)
      }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const isProd = process.env.NODE_ENV === 'production';
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (details) {
      errorResponse.error.details = details;
    }

    if (
      !isProd &&
      exception instanceof Error &&
      status === HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      errorResponse.error.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
