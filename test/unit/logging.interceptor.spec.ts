import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from 'src/core/interceptors/logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('logs successful http requests with duration and context', (done) => {
    const context = createExecutionContext({
      method: 'GET',
      url: '/api/products',
      statusCode: 200,
      auth: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'ADMIN',
      },
    });
    const next: CallHandler = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(logSpy.mock.calls[0][0]).toContain('"event":"http_request_completed"');
        expect(logSpy.mock.calls[0][0]).toContain('"tenantId":"tenant-1"');
        done();
      },
    });
  });

  it('logs failed http requests with duration and error message', (done) => {
    const context = createExecutionContext({
      method: 'POST',
      url: '/api/sales',
      statusCode: 400,
      auth: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        role: 'ADMIN',
      },
    });
    const next: CallHandler = {
      handle: () => throwError(() => ({ message: 'boom', status: 400 })),
    };

    interceptor.intercept(context, next).subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0][0]).toContain('"event":"http_request_failed"');
        expect(errorSpy.mock.calls[0][0]).toContain('"message":"boom"');
        done();
      },
    });
  });
});

function createExecutionContext(input: {
  method: string;
  url: string;
  statusCode: number;
  auth?: {
    tenantId: string;
    userId: string;
    role: string;
  };
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: input.method,
        url: input.url,
        originalUrl: input.url,
        auth: input.auth,
      }),
      getResponse: () => ({
        statusCode: input.statusCode,
      }),
    }),
  } as ExecutionContext;
}
