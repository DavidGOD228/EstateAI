import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logs one structured line per request: requestId, method, path, status,
 * duration and (when authenticated) userId. Never logs bodies, cookies,
 * headers, or any request/response payload — see docs/TECHNICAL_PLAN.md §22.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, response, startedAt),
        error: () => this.log(request, response, startedAt),
      }),
    );
  }

  private log(request: Request, response: Response, startedAt: number): void {
    const durationMs = Date.now() - startedAt;
    const entry: Record<string, unknown> = {
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs,
    };
    if (request.user?.id) {
      entry.userId = request.user.id;
    }
    this.logger.log(JSON.stringify(entry));
  }
}
