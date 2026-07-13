import * as argon2 from 'argon2';
import { ConflictException, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { toAuthUserResponse } from '../../src/auth/auth.mapper';
import { FakeUserRepository } from '../support/fake-user-repository';
import { makeUser } from '../support/fixtures';

function buildAuthService(usersRepo: FakeUserRepository): { service: AuthService; jwtService: { sign: jest.Mock } } {
  const jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };
  const service = new AuthService(usersRepo as any, jwtService as any);
  return { service, jwtService };
}

describe('AuthService', () => {
  describe('register', () => {
    it('hashes the password with argon2 and verifies the original password round-trips', async () => {
      const usersRepo = new FakeUserRepository();
      const { service } = buildAuthService(usersRepo);

      const { user } = await service.register({ name: 'Jane Doe', email: 'Jane@Example.com', password: 'correct-horse-battery' });

      expect(user.passwordHash).not.toBe('correct-horse-battery');
      await expect(argon2.verify(user.passwordHash, 'correct-horse-battery')).resolves.toBe(true);
      await expect(argon2.verify(user.passwordHash, 'wrong-password')).resolves.toBe(false);
    });

    it('lowercases the email before storing', async () => {
      const usersRepo = new FakeUserRepository();
      const { service } = buildAuthService(usersRepo);

      const { user } = await service.register({ name: 'Jane Doe', email: 'Jane@Example.com', password: 'correct-horse-battery' });

      expect(user.email).toBe('jane@example.com');
    });

    it('throws ConflictException with a generic message when the email already exists', async () => {
      const usersRepo = new FakeUserRepository();
      usersRepo.seed(makeUser({ email: 'jane@example.com' }));
      const { service } = buildAuthService(usersRepo);

      await expect(service.register({ name: 'Jane Doe', email: 'jane@example.com', password: 'correct-horse-battery' })).rejects.toThrow(
        ConflictException,
      );
      await expect(
        service.register({ name: 'Jane Doe', email: 'jane@example.com', password: 'correct-horse-battery' }),
      ).rejects.toMatchObject({ message: 'Unable to register with these details.' });
    });
  });

  describe('login', () => {
    it('throws the same generic 401 for an unknown email as for a wrong password', async () => {
      const usersRepo = new FakeUserRepository();
      const passwordHash = await argon2.hash('correct-password');
      usersRepo.seed(makeUser({ email: 'jane@example.com', passwordHash }));
      const { service } = buildAuthService(usersRepo);

      const unknownEmailAttempt = service.login({ email: 'nobody@example.com', password: 'anything' });
      const wrongPasswordAttempt = service.login({ email: 'jane@example.com', password: 'wrong-password' });

      await expect(unknownEmailAttempt).rejects.toThrow(UnauthorizedException);
      await expect(wrongPasswordAttempt).rejects.toThrow(UnauthorizedException);
      await expect(unknownEmailAttempt).rejects.toMatchObject({ message: 'Invalid email or password.' });
      await expect(wrongPasswordAttempt).rejects.toMatchObject({ message: 'Invalid email or password.' });
    });

    it('logs a login_failed audit event with no email or password on failure', async () => {
      const usersRepo = new FakeUserRepository();
      const passwordHash = await argon2.hash('correct-password');
      usersRepo.seed(makeUser({ email: 'jane@example.com', passwordHash }));
      const { service } = buildAuthService(usersRepo);
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

      await expect(service.login({ email: 'jane@example.com', password: 'wrong-password' })).rejects.toThrow(
        UnauthorizedException,
      );

      const loggedLines = logSpy.mock.calls.map((call) => String(call[0]));
      expect(loggedLines.some((line) => line.includes('auth.login_failed'))).toBe(true);
      for (const line of loggedLines) {
        expect(line).not.toContain('jane@example.com');
        expect(line).not.toContain('wrong-password');
        expect(line).not.toContain(passwordHash);
      }

      logSpy.mockRestore();
    });

    it('succeeds and signs a token for correct credentials', async () => {
      const usersRepo = new FakeUserRepository();
      const passwordHash = await argon2.hash('correct-password');
      const seeded = makeUser({ email: 'jane@example.com', passwordHash });
      usersRepo.seed(seeded);
      const { service, jwtService } = buildAuthService(usersRepo);

      const { user, token } = await service.login({ email: 'jane@example.com', password: 'correct-password' });

      expect(user.id).toBe(seeded.id);
      expect(token).toBe('signed.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: seeded.id });
    });
  });

  describe('toAuthUserResponse', () => {
    it('excludes passwordHash from the mapped response', () => {
      const user = makeUser({ passwordHash: 'super-secret-hash' });

      const response = toAuthUserResponse(user);

      expect(response).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      });
      expect(response).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(response)).not.toContain('super-secret-hash');
    });
  });
});
