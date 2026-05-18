import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const { method, originalUrl } = req;
    const ip = req.ip || req.socket?.remoteAddress || '';
    const started = Date.now();
    const bodyLog = this.formatBody(req.body);

    this.logger.log(
      `--> ${method} ${originalUrl}${ip ? ` from ${ip}` : ''}${bodyLog}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - started;
          this.logger.log(`<-- ${method} ${originalUrl} ${res.statusCode} ${ms}ms`);
        },
        error: (err: Error & { status?: number; response?: { statusCode?: number } }) => {
          const ms = Date.now() - started;
          const status =
            err.status ??
            err.response?.statusCode ??
            res.statusCode ??
            500;
          this.logger.warn(
            `<-- ${method} ${originalUrl} ${status} ${ms}ms | ${err.message}`,
          );
        },
      }),
    );
  }

  private formatBody(body: unknown): string {
    if (body === undefined || body === null) return '';
    if (typeof body !== 'object') return ` body=${JSON.stringify(body)}`;

    const record = { ...(body as Record<string, unknown>) };
    if ('password' in record) record.password = '[REDACTED]';
    if (Object.keys(record).length === 0) return '';

    try {
      return ` body=${JSON.stringify(record)}`;
    } catch {
      return ' body=[unserializable]';
    }
  }
}
