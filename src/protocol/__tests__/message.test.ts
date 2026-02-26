import { describe, it, expect } from 'vitest';
import { parseMessage } from '../message';

// Helper to build a minimal WeeChat message
class MessageBuilder {
  private parts: number[] = [];

  writeInt(v: number): this {
    this.parts.push((v >> 24) & 0xff);
    this.parts.push((v >> 16) & 0xff);
    this.parts.push((v >> 8) & 0xff);
    this.parts.push(v & 0xff);
    return this;
  }

  writeByte(v: number): this {
    this.parts.push(v & 0xff);
    return this;
  }

  writeString(v: string | null): this {
    if (v === null) {
      this.writeInt(-1);
      return this;
    }
    const bytes = new TextEncoder().encode(v);
    this.writeInt(bytes.length);
    for (const b of bytes) this.parts.push(b);
    return this;
  }

  writeType(type: string): this {
    for (const ch of type) this.parts.push(ch.charCodeAt(0));
    return this;
  }

  buildPayload(): Uint8Array {
    return new Uint8Array(this.parts);
  }
}

function buildUncompressedMessage(payloadBuilder: MessageBuilder): ArrayBuffer {
  const payload = payloadBuilder.buildPayload();
  // header: 4 bytes length + 1 byte compression(0) + payload
  const totalLength = 5 + payload.length;
  const result = new Uint8Array(totalLength);
  const view = new DataView(result.buffer);
  view.setInt32(0, totalLength);
  result[4] = 0; // no compression
  result.set(payload, 5);
  return result.buffer;
}

describe('parseMessage', () => {
  it('parses uncompressed message with string id and int object', () => {
    const payload = new MessageBuilder()
      .writeString('test_id')
      .writeType('int')
      .writeInt(42);

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('test_id');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('int');
    expect(msg.objects[0].value).toBe(42);
  });

  it('parses message with empty id', () => {
    const payload = new MessageBuilder()
      .writeString('')
      .writeType('str')
      .writeString('hello');

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('str');
    expect(msg.objects[0].value).toBe('hello');
  });

  it('parses message with null id as empty string', () => {
    const payload = new MessageBuilder()
      .writeString(null)
      .writeType('int')
      .writeInt(0);

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('');
  });

  it('parses message with multiple objects', () => {
    const payload = new MessageBuilder()
      .writeString('multi')
      .writeType('int')
      .writeInt(1)
      .writeType('str')
      .writeString('two')
      .writeType('int')
      .writeInt(3);

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('multi');
    expect(msg.objects).toHaveLength(3);
    expect(msg.objects[0].value).toBe(1);
    expect(msg.objects[1].value).toBe('two');
    expect(msg.objects[2].value).toBe(3);
  });

  it('parses message with no objects', () => {
    const payload = new MessageBuilder().writeString('empty');

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('empty');
    expect(msg.objects).toHaveLength(0);
  });

  it('throws on unknown compression type', () => {
    const payload = new MessageBuilder()
      .writeString('test')
      .buildPayload();

    const totalLength = 5 + payload.length;
    const result = new Uint8Array(totalLength);
    const view = new DataView(result.buffer);
    view.setInt32(0, totalLength);
    result[4] = 99; // unknown compression
    result.set(payload, 5);

    expect(() => parseMessage(result.buffer)).toThrow('Unknown compression type: 99');
  });

  it('parses zlib compressed message', async () => {
    // We use pako to compress, then verify parseMessage can decompress
    const pako = await import('pako');

    const payloadBuilder = new MessageBuilder()
      .writeString('compressed_id')
      .writeType('int')
      .writeInt(99);

    const payload = payloadBuilder.buildPayload();
    const compressed = pako.deflate(payload);

    const totalLength = 5 + compressed.length;
    const result = new Uint8Array(totalLength);
    const view = new DataView(result.buffer);
    view.setInt32(0, totalLength);
    result[4] = 1; // zlib compression
    result.set(compressed, 5);

    const msg = parseMessage(result.buffer);
    expect(msg.id).toBe('compressed_id');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].value).toBe(99);
  });
});
