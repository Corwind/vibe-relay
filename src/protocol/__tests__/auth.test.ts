import { describe, it, expect } from 'vitest';
import { computeHash, generateClientNonce } from '../auth';
import type { HashAlgorithm } from '../types';

describe('auth', () => {
  describe('computeHash', () => {
    it('returns plain password', async () => {
      const result = await computeHash('plain', 'secret', 'aabb', 'ccdd');
      expect(result).toBe('password=secret');
    });

    it('computes sha256 hash with client nonce', async () => {
      const result = await computeHash('sha256', 'secret', 'aa', 'bb');
      expect(result).toMatch(/^password_hash_sha256:bb:[0-9a-f]{64}$/);
    });

    it('computes sha512 hash with client nonce', async () => {
      const result = await computeHash('sha512', 'secret', 'aa', 'bb');
      expect(result).toMatch(/^password_hash_sha512:bb:[0-9a-f]{128}$/);
    });

    it('computes pbkdf2+sha256 hash with client nonce and iterations', async () => {
      const result = await computeHash('pbkdf2+sha256', 'secret', 'aa', 'bb', 1000);
      expect(result).toMatch(/^password_hash_pbkdf2_sha256:bb:1000:[0-9a-f]{64}$/);
    });

    it('computes pbkdf2+sha512 hash with client nonce and iterations', async () => {
      const result = await computeHash('pbkdf2+sha512', 'secret', 'aa', 'bb', 1000);
      expect(result).toMatch(/^password_hash_pbkdf2_sha512:bb:1000:[0-9a-f]{64}$/);
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
      const result = await computeHash('sha256', 'secret', 'aabb', 'ccdd');
      // Format: password_hash_sha256:CLIENT_NONCE:HASH
      const parts = result.split(':');
      expect(parts[0]).toBe('password_hash_sha256');
      expect(parts[1]).toBe('ccdd');
      expect(parts[2]).toHaveLength(64);
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

  // =================================================================
  // Known-answer / edge case tests
  // =================================================================
  describe('known-answer tests', () => {
    // Helper to compute SHA-256 directly for reference verification
    async function sha256hex(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    async function sha512hex(data: Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest('SHA-512', data.buffer as ArrayBuffer);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    function hex2bytes(hex: string): Uint8Array {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    }

    it('sha256: matches manually computed hash', async () => {
      const serverNonce = 'aabbccdd';
      const clientNonce = '11223344';
      const password = 'testpass';

      // Manually compute: SHA-256(hex2bytes(serverNonce+clientNonce) + utf8(password))
      const salt = hex2bytes(serverNonce + clientNonce);
      const passBytes = new TextEncoder().encode(password);
      const input = new Uint8Array(salt.length + passBytes.length);
      input.set(salt, 0);
      input.set(passBytes, salt.length);
      const expectedHash = await sha256hex(input);

      const result = await computeHash('sha256', password, serverNonce, clientNonce);
      expect(result).toBe(`password_hash_sha256:${clientNonce}:${expectedHash}`);
    });

    it('sha512: matches manually computed hash', async () => {
      const serverNonce = 'deadbeef';
      const clientNonce = 'cafebabe';
      const password = 'mysecret';

      const salt = hex2bytes(serverNonce + clientNonce);
      const passBytes = new TextEncoder().encode(password);
      const input = new Uint8Array(salt.length + passBytes.length);
      input.set(salt, 0);
      input.set(passBytes, salt.length);
      const expectedHash = await sha512hex(input);

      const result = await computeHash('sha512', password, serverNonce, clientNonce);
      expect(result).toBe(`password_hash_sha512:${clientNonce}:${expectedHash}`);
    });

    it('sha256: empty password produces valid hash', async () => {
      const result = await computeHash('sha256', '', 'aa', 'bb');
      expect(result).toMatch(/^password_hash_sha256:bb:[0-9a-f]{64}$/);
    });

    it('sha512: empty password produces valid hash', async () => {
      const result = await computeHash('sha512', '', 'aa', 'bb');
      expect(result).toMatch(/^password_hash_sha512:bb:[0-9a-f]{128}$/);
    });

    it('pbkdf2+sha256: deterministic with same inputs', async () => {
      const a = await computeHash('pbkdf2+sha256', 'pass', 'aabb', 'ccdd', 1000);
      const b = await computeHash('pbkdf2+sha256', 'pass', 'aabb', 'ccdd', 1000);
      expect(a).toBe(b);
    });

    it('pbkdf2+sha512: deterministic with same inputs', async () => {
      const a = await computeHash('pbkdf2+sha512', 'pass', 'aabb', 'ccdd', 1000);
      const b = await computeHash('pbkdf2+sha512', 'pass', 'aabb', 'ccdd', 1000);
      expect(a).toBe(b);
    });

    it('pbkdf2+sha256: different iterations produce different hashes', async () => {
      const a = await computeHash('pbkdf2+sha256', 'pass', 'aabb', 'ccdd', 1000);
      const b = await computeHash('pbkdf2+sha256', 'pass', 'aabb', 'ccdd', 2000);
      expect(a).not.toBe(b);
    });

    it('pbkdf2+sha256 vs pbkdf2+sha512 produce different results', async () => {
      const a = await computeHash('pbkdf2+sha256', 'pass', 'aabb', 'ccdd', 1000);
      const b = await computeHash('pbkdf2+sha512', 'pass', 'aabb', 'ccdd', 1000);
      expect(a).not.toBe(b);
    });

    it('sha256 vs sha512 produce different length hashes', async () => {
      const sha256Result = await computeHash('sha256', 'pass', 'aa', 'bb');
      const sha512Result = await computeHash('sha512', 'pass', 'aa', 'bb');
      // Format: password_hash_ALGO:CLIENT_NONCE:HASH
      const sha256Parts = sha256Result.split(':');
      const sha512Parts = sha512Result.split(':');
      expect(sha256Parts[2]).toHaveLength(64); // 256 bits = 64 hex chars
      expect(sha512Parts[2]).toHaveLength(128); // 512 bits = 128 hex chars
    });

    it('plain: passes through password unchanged', async () => {
      const result = await computeHash('plain', 'my p@ssw0rd!', 'ignored', 'ignored');
      expect(result).toBe('password=my p@ssw0rd!');
    });

    it('plain: handles empty password', async () => {
      const result = await computeHash('plain', '', 'aa', 'bb');
      expect(result).toBe('password=');
    });

    it('throws on unsupported algorithm', async () => {
      await expect(computeHash('unknown' as HashAlgorithm, 'pass', 'aa', 'bb')).rejects.toThrow(
        'Unsupported algorithm',
      );
    });

    it('sha256: Unicode password produces valid hash', async () => {
      const result = await computeHash('sha256', '\u00e9\u00e8\u00ea\u{1F600}', 'aa', 'bb');
      expect(result).toMatch(/^password_hash_sha256:bb:[0-9a-f]{64}$/);
    });

    it('pbkdf2+sha256: long nonces work correctly', async () => {
      const longServerNonce = 'aa'.repeat(32); // 64 hex chars = 32 bytes
      const longClientNonce = 'bb'.repeat(32);
      const result = await computeHash(
        'pbkdf2+sha256',
        'pass',
        longServerNonce,
        longClientNonce,
        1000,
      );
      expect(result).toMatch(
        new RegExp(`^password_hash_pbkdf2_sha256:${longClientNonce}:1000:[0-9a-f]{64}$`),
      );
    });
  });
});
