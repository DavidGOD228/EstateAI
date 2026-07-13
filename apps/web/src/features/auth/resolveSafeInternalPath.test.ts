import { describe, expect, it } from 'vitest';
import { resolveSafeInternalPath } from './resolveSafeInternalPath';

describe('resolveSafeInternalPath', () => {
  it('accepts a root-relative internal path', () => {
    expect(resolveSafeInternalPath({ from: '/properties/abc' })).toBe('/properties/abc');
  });

  it('rejects an absolute off-site URL', () => {
    expect(resolveSafeInternalPath({ from: 'https://evil.com' })).toBe('/');
  });

  it('rejects a protocol-relative URL', () => {
    expect(resolveSafeInternalPath({ from: '//evil.com' })).toBe('/');
  });

  it('rejects a javascript: URL', () => {
    expect(resolveSafeInternalPath({ from: 'javascript:alert(1)' })).toBe('/');
  });

  it('falls back to "/" when state has no from', () => {
    expect(resolveSafeInternalPath({})).toBe('/');
    expect(resolveSafeInternalPath(null)).toBe('/');
    expect(resolveSafeInternalPath(undefined)).toBe('/');
  });

  it('falls back to "/" when from is not a string', () => {
    expect(resolveSafeInternalPath({ from: 123 })).toBe('/');
    expect(resolveSafeInternalPath({ from: '' })).toBe('/');
  });
});
