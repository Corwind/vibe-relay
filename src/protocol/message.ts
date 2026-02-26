import type { WeechatMessage, WeechatObject } from './types';
import { BinaryParser } from './binary-parser';
import { decompressZlib, decompressZstd } from './compression';

export function parseMessage(data: ArrayBuffer): WeechatMessage {
  const headerView = new DataView(data);
  headerView.getInt32(0); // total length (consumed but not needed after framing)
  const compression = headerView.getUint8(4);

  let payload: ArrayBuffer;
  if (compression === 0) {
    payload = data.slice(5);
  } else if (compression === 1) {
    const compressed = new Uint8Array(data, 5);
    const decompressed = decompressZlib(compressed);
    payload = (decompressed.buffer as ArrayBuffer).slice(
      decompressed.byteOffset,
      decompressed.byteOffset + decompressed.byteLength,
    );
  } else if (compression === 2) {
    const compressed = new Uint8Array(data, 5);
    const decompressed = decompressZstd(compressed);
    payload = (decompressed.buffer as ArrayBuffer).slice(
      decompressed.byteOffset,
      decompressed.byteOffset + decompressed.byteLength,
    );
  } else {
    throw new Error(`Unknown compression type: ${compression}`);
  }

  const parser = new BinaryParser(payload);
  const id = parser.readString() ?? '';

  const objects: WeechatObject[] = [];
  while (parser.hasRemaining()) {
    objects.push(parser.readObject());
  }

  return { id, objects };
}
