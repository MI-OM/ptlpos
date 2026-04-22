import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const errors = this.formatValidationErrors(exception);

    this.logger.warn(
      `Validation failed for ${request.method} ${request.url}`,
      {
        errors,
        body: request.body,
      },
    );

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: errors,
    });
  }

  private formatValidationErrors(validationErrors: ValidationError[]): any[] {
    return validationErrors.map((error) => {
      const constraints = error.constraints;
      const property = error.property;

      return {
        property,
        message: constraints ? Object.values(constraints)[0] : 'Invalid value',
        value: error.value,
        constraints: constraints || {},
      };
    });
  }
}
