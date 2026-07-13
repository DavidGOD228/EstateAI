import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { parseDurationToMs } from '../common/duration.util';
import { AuthService } from './auth.service';
import { SESSION_COOKIE_NAME, SESSION_COOKIE_PATH } from './auth.constants';
import { toAuthUserResponse } from './auth.mapper';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

/** Brute-force protection on register/login: 10 requests per 60s window. */
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AuthUserResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponseDto> {
    const { user, token } = await this.authService.register(dto);
    this.setSessionCookie(res, token);
    return toAuthUserResponse(user);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthUserResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUserResponseDto> {
    const { user, token } = await this.authService.login(dto);
    this.setSessionCookie(res, token);
    return toAuthUserResponse(user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Res({ passthrough: true }) res: Response): LogoutResponseDto {
    res.clearCookie(SESSION_COOKIE_NAME, this.baseCookieOptions());
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOkResponse({ type: AuthUserResponseDto })
  async me(@Req() req: Request): Promise<AuthUserResponseDto> {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.getById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    return toAuthUserResponse(user);
  }

  private setSessionCookie(res: Response, token: string): void {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '2h');
    const options: CookieOptions = {
      ...this.baseCookieOptions(),
      maxAge: parseDurationToMs(expiresIn),
    };
    res.cookie(SESSION_COOKIE_NAME, token, options);
  }

  /**
   * Options shared between `res.cookie` (set) and `res.clearCookie` (clear).
   * Browsers only reliably clear a cookie when the clearing attributes
   * (httpOnly, sameSite, secure, path) match the ones it was set with.
   */
  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: SESSION_COOKIE_PATH,
    };
  }
}
