import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = this.buildErrorResponse(exception, status);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        JSON.stringify({
          event: 'unhandled_exception',
          method: request.method,
          path: request.originalUrl ?? request.url,
          statusCode: status,
          message: errorResponse.message,
        })
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      error: errorResponse.error,
      message: errorResponse.message,
      details: errorResponse.details,
    });
  }

  private buildErrorResponse(
    exception: unknown,
    status: number
  ): {
    error: string;
    message: string | string[];
    details?: unknown;
  } {
    if (!(exception instanceof HttpException)) {
      return {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        error: this.resolveErrorLabel(status),
        message: response,
      };
    }

    if (typeof response === 'object' && response !== null) {
      const payload = response as {
        error?: string;
        message?: string | string[];
        details?: unknown;
      };

      return {
        error: payload.error ?? this.resolveErrorLabel(status),
        message: payload.message ?? exception.message,
        details: payload.details,
      };
    }

    return {
      error: this.resolveErrorLabel(status),
      message: exception.message,
    };
  }

  private resolveErrorLabel(status: number): string {
    return HttpStatus[status] ?? 'Error';
  }
}
