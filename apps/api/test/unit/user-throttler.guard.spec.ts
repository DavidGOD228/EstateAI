import { UserThrottlerGuard } from '../../src/ai/user-throttler.guard';

/**
 * `getTracker` is `protected`, and the constructor requires the full set of
 * `ThrottlerGuard` collaborators (options/storage/reflector) that this unit
 * doesn't exercise, so we build the guard via `Object.create` — same idea as
 * mocking out DI in the other unit specs, just for a protected method.
 */
function buildGuard(): { getTracker: (req: Record<string, any>) => Promise<string> } {
  const guard = Object.create(UserThrottlerGuard.prototype) as UserThrottlerGuard;
  return { getTracker: (req: Record<string, any>) => (guard as any).getTracker(req) };
}

describe('UserThrottlerGuard', () => {
  describe('getTracker', () => {
    it('keys authenticated requests by user id, not IP', async () => {
      const { getTracker } = buildGuard();

      const tracker = await getTracker({ user: { id: 'user-123' }, ip: '203.0.113.7' });

      expect(tracker).toBe('user:user-123');
    });

    it('falls back to IP when there is no authenticated user', async () => {
      const { getTracker } = buildGuard();

      const tracker = await getTracker({ ip: '203.0.113.7' });

      expect(tracker).toBe('ip:203.0.113.7');
    });

    it('falls back to IP when user.id is present but empty', async () => {
      const { getTracker } = buildGuard();

      const tracker = await getTracker({ user: { id: '' }, ip: '203.0.113.7' });

      expect(tracker).toBe('ip:203.0.113.7');
    });

    it('produces distinct trackers for two different users sharing one IP', async () => {
      const { getTracker } = buildGuard();

      const trackerA = await getTracker({ user: { id: 'user-a' }, ip: '203.0.113.7' });
      const trackerB = await getTracker({ user: { id: 'user-b' }, ip: '203.0.113.7' });

      expect(trackerA).not.toBe(trackerB);
    });
  });
});
