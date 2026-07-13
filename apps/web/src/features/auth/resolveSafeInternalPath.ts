/**
 * Open-redirect defense (A01/A05).
 *
 * `location.state.from` is attacker-influenceable (anyone can craft a link to
 * `/login` with router state, or a `from` value could be echoed from a query
 * param upstream). If we navigated to it unconditionally, a value like
 * `https://evil.com` or `//evil.com` (protocol-relative — inherits the
 * current scheme) would redirect the user off-site right after they
 * authenticate, which is a classic phishing vector.
 *
 * This helper only ever returns a same-origin, root-relative path:
 * - must start with a single `/` (rules out absolute URLs and bare hosts)
 * - must not start with `//` (rules out protocol-relative URLs)
 * - must not contain a `:` before the first `/` (rules out `javascript:...`
 *   and other scheme-prefixed values)
 *
 * Anything that doesn't satisfy all three falls back to `/`.
 */
export function resolveSafeInternalPath(state: unknown): string {
  const from = extractFrom(state);
  return isSafeInternalPath(from) ? from : '/';
}

function extractFrom(state: unknown): string | null {
  if (!state || typeof state !== 'object' || !('from' in state)) return null;
  const from = (state as { from?: unknown }).from;
  return typeof from === 'string' && from.length > 0 ? from : null;
}

function isSafeInternalPath(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;

  const firstSlashIndex = path.indexOf('/');
  const firstColonIndex = path.indexOf(':');
  if (firstColonIndex !== -1 && firstColonIndex < firstSlashIndex) return false;

  return true;
}
