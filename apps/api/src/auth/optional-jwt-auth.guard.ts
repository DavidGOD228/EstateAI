import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Same passport-jwt strategy as `JwtAuthGuard` (see ./jwt-auth.guard.ts for
 * why this works from any module), but never rejects the request: an
 * absent, malformed, or expired session cookie simply resolves to
 * `request.user = null` instead of throwing 401. Used on endpoints that
 * stay PUBLIC but still need to know "is this requester the owner?" when a
 * valid session happens to be present (GET /api/properties, GET
 * /api/properties/:id).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = Express.User>(_err: unknown, user: TUser | false): TUser | null {
    return user || null;
  }
}
