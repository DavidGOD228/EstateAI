import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { parseDurationToMs } from '../common/duration.util';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

// JwtAuthGuard must remain exported/usable app-wide — see jwt-auth.guard.ts
// for why it doesn't need to be a provider here.
@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        // jsonwebtoken's `expiresIn` type only accepts a branded string
        // literal or a plain number of seconds — passing a number keeps this
        // strictly typed while still driven entirely by JWT_EXPIRES_IN.
        signOptions: {
          expiresIn: Math.floor(parseDurationToMs(config.get<string>('JWT_EXPIRES_IN', '2h')) / 1000),
        },
      }),
    }),
    // Scoped to auth only (register/login brute-force protection). Not a
    // global APP_GUARD: the AI module throttles its own routes separately.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ThrottlerGuard],
  exports: [AuthService],
})
export class AuthModule {}
