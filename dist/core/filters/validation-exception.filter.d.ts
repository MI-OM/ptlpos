import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { ValidationError } from 'class-validator';
export declare class ValidationExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: ValidationError[], host: ArgumentsHost): void;
    private formatValidationErrors;
}
