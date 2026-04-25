import { describe, expect, test } from 'vitest';

import { decodeJwt, isTokenExpired } from './auth';

function buildToken(payload) {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('auth utilities', () => {
  test('decodeJwt returns payload for valid tokens', () => {
    const token = buildToken({ role: 'user', exp: 9999999999 });

    expect(decodeJwt(token)).toEqual({ role: 'user', exp: 9999999999 });
  });

  test('decodeJwt returns null for malformed tokens', () => {
    expect(decodeJwt('invalid-token')).toBeNull();
  });

  test('isTokenExpired returns true when exp is in the past', () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) - 60 });

    expect(isTokenExpired(token)).toBe(true);
  });

  test('isTokenExpired returns false when exp is in the future', () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isTokenExpired(token)).toBe(false);
  });
});
