import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from 'src/core/filters/http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('formats standard http exceptions into a unified response shape', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = createHost(status, json, '/api/products/unknown');

    filter.catch(new NotFoundException('Product not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        path: '/api/products/unknown',
        error: 'Not Found',
        message: 'Product not found',
      }),
    );
  });

  it('preserves validation error arrays from bad request exceptions', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = createHost(status, json, '/api/products');

    filter.catch(
      new BadRequestException({
        message: ['name should not be empty', 'price must be a number'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        message: ['name should not be empty', 'price must be a number'],
      }),
    );
  });

  it('formats unexpected errors as internal server errors and logs them', () => {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = createHost(status, json, '/api/sales');

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

function createHost(
  status: jest.Mock,
  json: jest.Mock,
  path: string,
): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: path,
        originalUrl: path,
      }),
      getResponse: () => ({
        status,
        json,
      }),
    }),
  } as ArgumentsHost;
}
