import type { HashAlgorithm } from './types';

function hex2bytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeHash(
  algorithm: HashAlgorithm,
  password: string,
  serverNonce: string,
  clientNonce: string,
  iterations?: number,
): Promise<string> {
  if (algorithm === 'plain') {
    return `password=${password}`;
  }

  const encoder = new TextEncoder();
  const salt = hex2bytes(serverNonce + clientNonce);
  const passwordBytes = encoder.encode(password);

  if (algorithm === 'sha256' || algorithm === 'sha512') {
    const algoName = algorithm === 'sha256' ? 'SHA-256' : 'SHA-512';
    const dataToHash = new Uint8Array(salt.length + passwordBytes.length);
    dataToHash.set(salt, 0);
    dataToHash.set(passwordBytes, salt.length);
    const hash = await crypto.subtle.digest(algoName, dataToHash);
    return `password_hash_${algorithm}:${clientNonce}:${bytesToHex(new Uint8Array(hash))}`;
  }

  if (algorithm === 'pbkdf2+sha256' || algorithm === 'pbkdf2+sha512') {
    const shaAlgo = algorithm === 'pbkdf2+sha256' ? 'SHA-256' : 'SHA-512';
    const shaLabel = algorithm === 'pbkdf2+sha256' ? 'sha256' : 'sha512';
    const iterCount = iterations ?? 100000;

    const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, [
      'deriveBits',
    ]);

    // WeeChat relay protocol expects 256-bit derived keys regardless of SHA variant
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: iterCount,
        hash: shaAlgo,
      },
      keyMaterial,
      256,
    );

    return `password_hash_pbkdf2_${shaLabel}:${clientNonce}:${iterCount}:${bytesToHex(new Uint8Array(derivedBits))}`;
  }

  throw new Error(`Unsupported algorithm: ${algorithm}`);
}

export function generateClientNonce(length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
