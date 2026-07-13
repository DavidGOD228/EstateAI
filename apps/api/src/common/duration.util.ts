const UNIT_MULTIPLIERS_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Parses durations like '2h', '30m', '45s' (the format used by JWT_EXPIRES_IN)
 * into milliseconds, so the session cookie's `maxAge` always matches the JWT
 * expiry. A bare number is treated as seconds, mirroring jsonwebtoken's own
 * convention for numeric `expiresIn` values.
 */
export function parseDurationToMs(input: string): number {
  const trimmed = input.trim();
  const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(trimmed);
  if (match) {
    const value = Number(match[1]);
    const unit = match[2].toLowerCase();
    return value * UNIT_MULTIPLIERS_MS[unit];
  }

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber)) {
    return asNumber * 1000;
  }

  throw new Error(`Invalid duration string: "${input}"`);
}
