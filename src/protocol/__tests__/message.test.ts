import { describe, it, expect } from 'vitest';
import { parseMessage } from '../message';
import { BinaryBuilder } from '@/test/helpers/binary-builder';
import {
  createHandshakeResponse,
  createBufferListResponse,
  createLineAddedEvent,
  createNicklistResponse,
  createNicklistDiffEvent,
} from '@/test/fixtures/binary-messages';

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
    const payload = new MessageBuilder().writeString('test_id').writeType('int').writeInt(42);

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('test_id');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('int');
    expect(msg.objects[0].value).toBe(42);
  });

  it('parses message with empty id', () => {
    const payload = new MessageBuilder().writeString('').writeType('str').writeString('hello');

    const data = buildUncompressedMessage(payload);
    const msg = parseMessage(data);

    expect(msg.id).toBe('');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('str');
    expect(msg.objects[0].value).toBe('hello');
  });

  it('parses message with null id as empty string', () => {
    const payload = new MessageBuilder().writeString(null).writeType('int').writeInt(0);

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
    const payload = new MessageBuilder().writeString('test').buildPayload();

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

// =================================================================
// Integration tests using pre-built binary fixtures
// =================================================================
describe('parseMessage with binary fixtures', () => {
  it('parses handshake response', () => {
    const msg = parseMessage(createHandshakeResponse());

    expect(msg.id).toBe('handshake');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('htb');

    const htb = msg.objects[0].value as { entries: Map<string, string> };
    expect(htb.entries.get('password_hash_algo')).toBe('pbkdf2+sha512:sha512:sha256:plain');
    expect(htb.entries.get('compression')).toBe('zstd:zlib:off');
    expect(htb.entries.get('nonce')).toBeDefined();
    expect(typeof htb.entries.get('nonce')).toBe('string');
    expect((htb.entries.get('nonce') as string).length).toBe(32); // 16 bytes = 32 hex chars
  });

  it('parses buffer list response', () => {
    const msg = parseMessage(createBufferListResponse());

    expect(msg.id).toBe('listbuffers');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('hda');

    const hda = msg.objects[0].value as {
      path: string;
      entries: Array<{ pointers: string[]; values: Record<string, unknown> }>;
    };
    expect(hda.path).toBe('buffer');
    expect(hda.entries).toHaveLength(3);

    // First buffer: core.weechat
    expect(hda.entries[0].values['full_name']).toBe('core.weechat');
    expect(hda.entries[0].values['short_name']).toBe('weechat');
    expect(hda.entries[0].values['number']).toBe(1);
    expect(hda.entries[0].values['type']).toBe(0);
    expect(hda.entries[0].pointers[0]).toBe('0x1a2b3c');

    // Second buffer: irc.server.libera
    expect(hda.entries[1].values['full_name']).toBe('irc.server.libera');
    expect(hda.entries[1].values['type']).toBe(1);

    // Third buffer: irc.libera.#weechat
    expect(hda.entries[2].values['full_name']).toBe('irc.libera.#weechat');
    expect(hda.entries[2].values['short_name']).toBe('#weechat');

    // Verify local_variables are hashtables
    const localVars = hda.entries[2].values['local_variables'] as {
      entries: Map<string, string>;
    };
    expect(localVars.entries.get('type')).toBe('channel');
    expect(localVars.entries.get('server')).toBe('libera');
  });

  it('parses line added event', () => {
    const msg = parseMessage(createLineAddedEvent());

    expect(msg.id).toBe('_buffer_line_added');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('hda');

    const hda = msg.objects[0].value as {
      entries: Array<{ pointers: string[]; values: Record<string, unknown> }>;
    };
    expect(hda.entries).toHaveLength(1);

    const entry = hda.entries[0];
    expect(entry.values['buffer']).toBe('0x7a8b9c');
    expect(entry.values['date']).toBeInstanceOf(Date);
    expect(typeof entry.values['prefix']).toBe('string');
    expect(typeof entry.values['message']).toBe('string');
    expect(entry.values['highlight']).toBe(0);
    expect(entry.values['displayed']).toBe(1);
    expect(entry.values['notify_level']).toBe(1);

    // tags_array should be a parsed array
    const tags = entry.values['tags_array'] as { type: string; values: string[] };
    expect(tags.type).toBe('str');
    expect(tags.values).toContain('irc_privmsg');
    expect(tags.values).toContain('nick_testuser');
  });

  it('parses nicklist response', () => {
    const msg = parseMessage(createNicklistResponse());

    expect(msg.id).toBe('nicklist');
    expect(msg.objects[0].type).toBe('hda');

    const hda = msg.objects[0].value as {
      entries: Array<{ values: Record<string, unknown> }>;
    };
    expect(hda.entries.length).toBeGreaterThanOrEqual(7);

    // First entry should be root group
    expect(hda.entries[0].values['group']).toBe(1);
    expect(hda.entries[0].values['name']).toBe('root');

    // Find the op nick
    const opNick = hda.entries.find((e) => e.values['group'] === 0 && e.values['prefix'] === '@');
    expect(opNick).toBeDefined();
    expect(opNick!.values['name']).toBe('admin_nick');

    // Find the voiced nick
    const voicedNick = hda.entries.find(
      (e) => e.values['group'] === 0 && e.values['prefix'] === '+',
    );
    expect(voicedNick).toBeDefined();
    expect(voicedNick!.values['name']).toBe('voiced_nick');
  });

  it('parses nicklist diff event', () => {
    const msg = parseMessage(createNicklistDiffEvent());

    expect(msg.id).toBe('_nicklist_diff');
    expect(msg.objects[0].type).toBe('hda');

    const hda = msg.objects[0].value as {
      entries: Array<{ values: Record<string, unknown> }>;
    };
    expect(hda.entries).toHaveLength(3);

    // '+' = 43 (add)
    expect(hda.entries[0].values['_diff']).toBe(43);
    expect(hda.entries[0].values['name']).toBe('new_user');

    // '-' = 45 (remove)
    expect(hda.entries[1].values['_diff']).toBe(45);
    expect(hda.entries[1].values['name']).toBe('leaving_user');

    // '*' = 42 (update)
    expect(hda.entries[2].values['_diff']).toBe(42);
    expect(hda.entries[2].values['name']).toBe('promoted_user');
    expect(hda.entries[2].values['prefix']).toBe('@');
  });

  it('parses zlib-compressed fixture', async () => {
    const pako = await import('pako');
    // Build a fixture, extract its uncompressed payload, compress it, rewrap
    const builder = new BinaryBuilder();
    builder.writeObject('str', 'zlib_test_value');
    const uncompressedMsg = builder.buildMessage('zlib_fixture', 0) as ArrayBuffer;

    // Extract payload (everything after the 5-byte header)
    const payload = new Uint8Array(uncompressedMsg, 5);
    const compressed = pako.deflate(payload);

    const totalLength = 5 + compressed.length;
    const result = new Uint8Array(totalLength);
    const view = new DataView(result.buffer);
    view.setInt32(0, totalLength);
    result[4] = 1; // zlib
    result.set(compressed, 5);

    const msg = parseMessage(result.buffer as ArrayBuffer);
    expect(msg.id).toBe('zlib_fixture');
    expect(msg.objects).toHaveLength(1);
    expect(msg.objects[0].type).toBe('str');
    expect(msg.objects[0].value).toBe('zlib_test_value');
  });

  it('parses zlib-compressed buffer list fixture', async () => {
    const pako = await import('pako');
    // Take a real fixture and re-wrap with zlib compression
    const original = createBufferListResponse() as ArrayBuffer;
    const payload = new Uint8Array(original, 5);
    const compressed = pako.deflate(payload);

    const totalLength = 5 + compressed.length;
    const result = new Uint8Array(totalLength);
    const view = new DataView(result.buffer);
    view.setInt32(0, totalLength);
    result[4] = 1;
    result.set(compressed, 5);

    const msg = parseMessage(result.buffer as ArrayBuffer);
    expect(msg.id).toBe('listbuffers');
    expect(msg.objects).toHaveLength(1);

    const hda = msg.objects[0].value as {
      entries: Array<{ values: Record<string, unknown> }>;
    };
    expect(hda.entries).toHaveLength(3);
    expect(hda.entries[0].values['full_name']).toBe('core.weechat');
  });
});
