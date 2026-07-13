import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { User } from '../../src/users/user.entity';
import { TestAppContext } from './build-test-app';
import { makeUser } from './fixtures';

/**
 * Seeds a user directly into the fake repo and mints a valid session cookie
 * straight from `JwtService`, bypassing `/api/auth/register` and
 * `/api/auth/login` entirely. Those two routes share a hardcoded 10 req/min
 * throttle (`AuthModule`'s `ThrottlerModule.forRoot`) that this workstream
 * doesn't own/can't relax via env — going around them keeps authenticated
 * fixtures in ai/properties e2e suites off that budget.
 */
export async function seedAuthenticatedUser(
  ctx: TestAppContext,
  overrides: Partial<Pick<User, 'email' | 'name'>> = {},
): Promise<{ user: User; cookie: string }> {
  const passwordHash = await argon2.hash('irrelevant-for-these-tests');
  const user = makeUser({ email: 'authed-user@example.com', name: 'Authed User', passwordHash, ...overrides });
  ctx.usersRepo.seed(user);

  const jwtService = ctx.app.get(JwtService);
  const token = jwtService.sign({ sub: user.id });

  return { user, cookie: `eai_session=${token}` };
}
