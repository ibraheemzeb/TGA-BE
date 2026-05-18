import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        if (obj.message) message = obj.message as string | string[];
        if (typeof obj.code === 'string') code = obj.code;
      }
      if (status < 500) {
        code =
          status === HttpStatus.UNAUTHORIZED
            ? 'UNAUTHORIZED'
            : status === HttpStatus.FORBIDDEN
              ? 'FORBIDDEN'
              : status === HttpStatus.CONFLICT
                ? 'CONFLICT'
                : status === HttpStatus.BAD_REQUEST
                  ? 'BAD_REQUEST'
                  : 'HTTP_ERROR';
      }
    } else {
      this.logger.error(exception);
    }

    const safeMessage = Array.isArray(message) ? message : [message];
    response.status(status).json({
      statusCode: status,
      code,
      message: safeMessage.length === 1 ? safeMessage[0] : safeMessage,
      error: safeMessage,
    });
  }
}
