import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RequestWithContext } from '../types/request-context';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<{ statusCode?: number }>();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            event: 'http_request_completed',
            method: request.method,
            path: request.originalUrl ?? request.url,
            statusCode: response.statusCode,
            durationMs: Date.now() - now,
            tenantId: request.auth?.tenantId ?? null,
            userId: request.auth?.userId ?? null,
            role: request.auth?.role ?? null,
          })
        );
      }),
      catchError((error: Error & { status?: number }) => {
        this.logger.error(
          JSON.stringify({
            event: 'http_request_failed',
            method: request.method,
            path: request.originalUrl ?? request.url,
            statusCode: error.status ?? response.statusCode ?? 500,
            durationMs: Date.now() - now,
            tenantId: request.auth?.tenantId ?? null,
            userId: request.auth?.userId ?? null,
            role: request.auth?.role ?? null,
            message: error.message,
          })
        );

        return throwError(() => error);
      })
    );
  }
}
