import pako from 'pako';
import { decompress as fzstdDecompress } from 'fzstd';

export function decompressZlib(data: Uint8Array): Uint8Array {
  return pako.inflate(data);
}

export function decompressZstd(data: Uint8Array): Uint8Array {
  return fzstdDecompress(data);
}
