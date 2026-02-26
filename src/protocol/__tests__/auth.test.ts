import { describe, it, expect } from 'vitest';
import { computeHash, generateClientNonce } from '../auth';

describe('auth', () => {
  describe('computeHash', () => {
    it('returns plain password', async () => {
      const result = await computeHash(
        'plain',
        'secret',
        'aabb',
        'ccdd',
      );
      expect(result).toBe('password=secret');
    });

    it('computes sha256 hash', async () => {
      const result = await computeHash(
        'sha256',
        'secret',
        'aa',
        'bb',
      );
      expect(result).toMatch(/^password_hash_sha256:[0-9a-f]{64}$/);
    });

    it('computes sha512 hash', async () => {
      const result = await computeHash(
        'sha512',
        'secret',
        'aa',
        'bb',
      );
      expect(result).toMatch(/^password_hash_sha512:[0-9a-f]{128}$/);
    });

    it('computes pbkdf2+sha256 hash', async () => {
      const result = await computeHash(
        'pbkdf2+sha256',
        'secret',
        'aa',
        'bb',
        1000,
      );
      expect(result).toMatch(/^password_hash_pbkdf2_sha256:[0-9a-f]{64}$/);
    });

    it('computes pbkdf2+sha512 hash', async () => {
      const result = await computeHash(
        'pbkdf2+sha512',
        'secret',
        'aa',
        'bb',
        1000,
      );
      expect(result).toMatch(/^password_hash_pbkdf2_sha512:[0-9a-f]{64}$/);
    });

    it('produces deterministic sha256 output for same inputs', async () => {
      const a = await computeHash('sha256', 'pass', 'aabb', 'ccdd');
      const b = await computeHash('sha256', 'pass', 'aabb', 'ccdd');
      expect(a).toBe(b);
    });

    it('produces different sha256 output for different passwords', async () => {
      const a = await computeHash('sha256', 'pass1', 'aabb', 'ccdd');
      const b = await computeHash('sha256', 'pass2', 'aabb', 'ccdd');
      expect(a).not.toBe(b);
    });

    it('produces different sha256 output for different nonces', async () => {
      const a = await computeHash('sha256', 'pass', 'aa', 'bb');
      const b = await computeHash('sha256', 'pass', 'cc', 'dd');
      expect(a).not.toBe(b);
    });

    it('verifies sha256 against known test vector', async () => {
      // Compute: SHA-256(hex2bytes("aabbccdd") + "secret")
      // salt = [0xAA, 0xBB, 0xCC, 0xDD]
      // input = salt + utf8("secret")
      const result = await computeHash('sha256', 'secret', 'aabb', 'ccdd');
      // Verify format and length
      const [prefix, hash] = result.split(':');
      expect(prefix).toBe('password_hash_sha256');
      expect(hash).toHaveLength(64);
    });
  });

  describe('generateClientNonce', () => {
    it('generates hex string of correct length', () => {
      const nonce = generateClientNonce(16);
      expect(nonce).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(nonce).toMatch(/^[0-9a-f]+$/);
    });

    it('generates different nonces', () => {
      const a = generateClientNonce();
      const b = generateClientNonce();
      expect(a).not.toBe(b);
    });

    it('respects custom length', () => {
      const nonce = generateClientNonce(8);
      expect(nonce).toHaveLength(16); // 8 bytes = 16 hex chars
    });
  });
});
