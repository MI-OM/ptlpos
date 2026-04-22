import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          
          // Log slow queries (>1 second)
          if (duration > 1000) {
            this.logger.warn(
              `Slow Request: ${method} ${url} - ${duration}ms`,
              {
                method,
                url,
                duration,
                responseSize: JSON.stringify(data).length,
                userAgent: request.get('user-agent'),
                ip: request.ip,
              },
            );
          } else {
            this.logger.debug(
              `Request: ${method} ${url} - ${duration}ms`,
              {
                method,
                url,
                duration,
              },
            );
          }

          // Alert for very slow queries (>3 seconds)
          if (duration > 3000) {
            this.logger.error(
              `Very Slow Request Alert: ${method} ${url} took ${duration}ms`,
              {
                method,
                url,
                duration,
                timestamp: new Date().toISOString(),
              },
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `Request Failed: ${method} ${url} - ${duration}ms - ${error.message}`,
            {
              method,
              url,
              duration,
              error: error.message,
              stack: error.stack,
            },
          );
        },
      }),
    );
  }
}
