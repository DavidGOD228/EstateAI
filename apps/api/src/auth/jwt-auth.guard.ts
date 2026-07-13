import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Seam contract: protected endpoints depend on this exact path + class name.
 *
 * Extends `AuthGuard('jwt')`, which validates the `eai_session` cookie via
 * the globally-registered passport-jwt strategy (see ./jwt.strategy.ts) and
 * attaches `request.user = { id }`. Because passport strategies register
 * themselves in a process-wide registry (not Nest's DI container), this
 * guard works from any module — including AiModule — without importing
 * AuthModule, as long as AuthModule is instantiated somewhere in the app
 * (it is, via AppModule).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
