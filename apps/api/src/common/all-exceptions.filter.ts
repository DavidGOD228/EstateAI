import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string;
  requestId?: string;
}

/**
 * Every error, thrown anywhere in the app, is normalized to a single safe
 * shape: { statusCode, message, requestId }. Stack traces and provider
 * internals never leave the process; the full error is logged server-side
 * against the request id for correlation.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const requestId: string | undefined = request?.requestId;

    const { statusCode, message } = this.resolve(exception);

    this.logger.error(
      `[${requestId ?? 'no-request-id'}] ${request?.method ?? '?'} ${request?.originalUrl ?? '?'} -> ${statusCode}: ${this.describe(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: ErrorResponseBody = { statusCode, message, requestId };
    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): { statusCode: number; message: string } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const message = this.extractMessage(exception.getResponse(), exception.message);
      return { statusCode, message };
    }

    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }

  private extractMessage(response: unknown, fallback: string): string {
    if (typeof response === 'string') {
      return response;
    }
    if (response && typeof response === 'object' && 'message' in response) {
      const raw = (response as { message?: unknown }).message;
      if (Array.isArray(raw)) {
        return raw.length > 0 ? String(raw[0]) : fallback;
      }
      if (typeof raw === 'string') {
        return raw;
      }
    }
    return fallback;
  }

  private describe(exception: unknown): string {
    return exception instanceof Error ? exception.message : String(exception);
  }
}
