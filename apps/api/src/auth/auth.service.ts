import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthResult {
  user: User;
  token: string;
}

const REGISTER_FAILURE_MESSAGE = 'Unable to register with these details.';
const LOGIN_FAILURE_MESSAGE = 'Invalid email or password.';

/** Postgres unique_violation error code. */
const UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(REGISTER_FAILURE_MESSAGE);
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = this.usersRepository.create({ name: dto.name, email, passwordHash });

    try {
      const saved = await this.usersRepository.save(user);
      this.logger.log(JSON.stringify({ event: 'auth.register_success', userId: saved.id }));
      return { user: saved, token: this.signToken(saved) };
    } catch (error) {
      // Race condition: two concurrent registrations for the same email both
      // pass the findOne check above. The DB unique index is the real guard.
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(REGISTER_FAILURE_MESSAGE);
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      // Identical failure for unknown email or wrong password — no account enumeration.
      // No identifying data logged here (no email, no password); request
      // correlation comes from the requestId in the HTTP log line.
      this.logger.log(JSON.stringify({ event: 'auth.login_failed' }));
      throw new UnauthorizedException(LOGIN_FAILURE_MESSAGE);
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password).catch(() => false);
    if (!passwordMatches) {
      this.logger.log(JSON.stringify({ event: 'auth.login_failed' }));
      throw new UnauthorizedException(LOGIN_FAILURE_MESSAGE);
    }

    this.logger.log(JSON.stringify({ event: 'auth.login_success', userId: user.id }));
    return { user, token: this.signToken(user) };
  }

  async getById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  private signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id });
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === UNIQUE_VIOLATION_CODE
    );
  }
}
