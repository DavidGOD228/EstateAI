import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * AI-endpoint throttling guard, keyed per-user instead of per-IP.
 *
 * The default `ThrottlerGuard` tracks requests by IP address. That's the
 * wrong unit of quota for authenticated AI endpoints (OWASP A06 —
 * insufficient rate limiting for a costly upstream resource): several
 * legitimate users behind the same NAT/VPN/office gateway would share one
 * IP-based bucket and throttle each other, while a single abusive user could
 * dodge the limit entirely by rotating IPs.
 *
 * `JwtAuthGuard` runs first on every AI controller and attaches
 * `req.user = { id }`, so we key the tracker on that stable user id when
 * present. Unauthenticated requests (which `JwtAuthGuard` would normally
 * reject anyway) fall back to the IP so `getTracker` never throws.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.user?.id;
    return typeof userId === 'string' && userId.length > 0 ? `user:${userId}` : `ip:${req.ip}`;
  }
}
