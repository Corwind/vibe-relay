import { describe, it, expect } from 'vitest';
import { BinaryBuilder } from '../helpers/binary-builder';
import { BinaryParser } from '../../protocol/binary-parser';

describe('BinaryBuilder', () => {
  describe('primitives', () => {
    it('writes and reads char', () => {
      const builder = new BinaryBuilder();
      builder.writeChar(42);
      builder.writeChar(-1);
      builder.writeChar(0);
      builder.writeChar(127);

      const parser = new BinaryParser(builder.build());
      expect(parser.readChar()).toBe(42);
      expect(parser.readChar()).toBe(-1);
      expect(parser.readChar()).toBe(0);
      expect(parser.readChar()).toBe(127);
    });

    it('writes and reads int', () => {
      const builder = new BinaryBuilder();
      builder.writeInt(0);
      builder.writeInt(1);
      builder.writeInt(-1);
      builder.writeInt(2147483647);
      builder.writeInt(-2147483648);

      const parser = new BinaryParser(builder.build());
      expect(parser.readInt()).toBe(0);
      expect(parser.readInt()).toBe(1);
      expect(parser.readInt()).toBe(-1);
      expect(parser.readInt()).toBe(2147483647);
      expect(parser.readInt()).toBe(-2147483648);
    });

    it('writes and reads long', () => {
      const builder = new BinaryBuilder();
      builder.writeLong('1234567890');
      builder.writeLong('0');
      builder.writeLong('9999999999999');

      const parser = new BinaryParser(builder.build());
      expect(parser.readLong()).toBe('1234567890');
      expect(parser.readLong()).toBe('0');
      expect(parser.readLong()).toBe('9999999999999');
    });

    it('writes and reads string', () => {
      const builder = new BinaryBuilder();
      builder.writeString('hello world');
      builder.writeString('');
      builder.writeString(null);
      builder.writeString('unicode: \u00e9\u00e8\u00ea');

      const parser = new BinaryParser(builder.build());
      expect(parser.readString()).toBe('hello world');
      expect(parser.readString()).toBe('');
      expect(parser.readString()).toBeNull();
      expect(parser.readString()).toBe('unicode: \u00e9\u00e8\u00ea');
    });

    it('writes and reads buffer', () => {
      const builder = new BinaryBuilder();
      builder.writeBuffer(new Uint8Array([1, 2, 3, 255]));
      builder.writeBuffer(new Uint8Array(0));
      builder.writeBuffer(null);

      const parser = new BinaryParser(builder.build());
      expect(parser.readBuffer()).toEqual(new Uint8Array([1, 2, 3, 255]));
      expect(parser.readBuffer()).toEqual(new Uint8Array(0));
      expect(parser.readBuffer()).toBeNull();
    });

    it('writes and reads pointer', () => {
      const builder = new BinaryBuilder();
      builder.writePointer('0x1a2b3c');
      builder.writePointer('0x0');
      builder.writePointer('abcdef');

      const parser = new BinaryParser(builder.build());
      expect(parser.readPointer()).toBe('0x1a2b3c');
      expect(parser.readPointer()).toBe('0x0');
      expect(parser.readPointer()).toBe('0xabcdef');
    });

    it('writes and reads time', () => {
      const builder = new BinaryBuilder();
      const timestamp = 1700000000;
      builder.writeTime(timestamp);
      builder.writeTime(new Date(timestamp * 1000));

      const parser = new BinaryParser(builder.build());
      const date1 = parser.readTime();
      const date2 = parser.readTime();
      expect(date1.getTime()).toBe(timestamp * 1000);
      expect(date2.getTime()).toBe(timestamp * 1000);
    });

    it('writes and reads type identifier', () => {
      const builder = new BinaryBuilder();
      builder.writeType('str');
      builder.writeType('int');
      builder.writeType('hda');

      const parser = new BinaryParser(builder.build());
      expect(parser.readType()).toBe('str');
      expect(parser.readType()).toBe('int');
      expect(parser.readType()).toBe('hda');
    });
  });

  describe('composites', () => {
    it('writes and reads hashtable', () => {
      const builder = new BinaryBuilder();
      builder.writeType('htb');
      builder.writeHashtable('str', 'str', [
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);

      const parser = new BinaryParser(builder.build());
      parser.readType(); // skip type prefix
      const htb = parser.readHashtable();
      expect(htb.keyType).toBe('str');
      expect(htb.valueType).toBe('str');
      expect(htb.entries.get('key1')).toBe('value1');
      expect(htb.entries.get('key2')).toBe('value2');
      expect(htb.entries.size).toBe(2);
    });

    it('writes and reads hashtable with int keys', () => {
      const builder = new BinaryBuilder();
      builder.writeType('htb');
      builder.writeHashtable('int', 'str', [
        [1, 'one'],
        [2, 'two'],
      ]);

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const htb = parser.readHashtable();
      expect(htb.entries.get(1)).toBe('one');
      expect(htb.entries.get(2)).toBe('two');
    });

    it('writes and reads array', () => {
      const builder = new BinaryBuilder();
      builder.writeType('arr');
      builder.writeArray('str', ['a', 'b', 'c']);

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const arr = parser.readArray();
      expect(arr.type).toBe('str');
      expect(arr.values).toEqual(['a', 'b', 'c']);
    });

    it('writes and reads empty array', () => {
      const builder = new BinaryBuilder();
      builder.writeType('arr');
      builder.writeArray('int', []);

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const arr = parser.readArray();
      expect(arr.type).toBe('int');
      expect(arr.values).toEqual([]);
    });

    it('writes and reads hdata', () => {
      const builder = new BinaryBuilder();
      builder.writeType('hda');
      builder.writeHdata(
        'buffer',
        [
          { name: 'number', type: 'int' },
          { name: 'full_name', type: 'str' },
        ],
        [
          { pointers: ['0x1a2b3c'], values: [1, 'core.weechat'] },
          { pointers: ['0x4d5e6f'], values: [2, 'irc.libera.#test'] },
        ],
      );

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const hda = parser.readHdata();
      expect(hda.path).toBe('buffer');
      expect(hda.keys).toEqual([
        { name: 'number', type: 'int' },
        { name: 'full_name', type: 'str' },
      ]);
      expect(hda.entries).toHaveLength(2);
      expect(hda.entries[0].pointers).toEqual(['0x1a2b3c']);
      expect(hda.entries[0].values['number']).toBe(1);
      expect(hda.entries[0].values['full_name']).toBe('core.weechat');
      expect(hda.entries[1].pointers).toEqual(['0x4d5e6f']);
      expect(hda.entries[1].values['number']).toBe(2);
    });

    it('writes and reads hdata with multi-segment path', () => {
      const builder = new BinaryBuilder();
      builder.writeType('hda');
      builder.writeHdata(
        'buffer/lines/line',
        [{ name: 'message', type: 'str' }],
        [
          {
            pointers: ['0xaaa', '0xbbb', '0xccc'],
            values: ['test message'],
          },
        ],
      );

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const hda = parser.readHdata();
      expect(hda.path).toBe('buffer/lines/line');
      expect(hda.entries[0].pointers).toHaveLength(3);
      expect(hda.entries[0].values['message']).toBe('test message');
    });

    it('writes and reads info', () => {
      const builder = new BinaryBuilder();
      builder.writeType('inf');
      builder.writeInfo('version', '4.1.0');

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const info = parser.readInfo();
      expect(info.key).toBe('version');
      expect(info.value).toBe('4.1.0');
    });

    it('writes and reads infolist', () => {
      const builder = new BinaryBuilder();
      builder.writeType('inl');
      builder.writeInfolist('buffer', [
        {
          name: { type: 'str', value: 'core.weechat' },
          number: { type: 'int', value: 1 },
        },
        {
          name: { type: 'str', value: 'irc.libera.#test' },
          number: { type: 'int', value: 2 },
        },
      ]);

      const parser = new BinaryParser(builder.build());
      parser.readType();
      const inl = parser.readInfolist();
      expect(inl.name).toBe('buffer');
      expect(inl.items).toHaveLength(2);
      expect(inl.items[0]['name']).toBe('core.weechat');
      expect(inl.items[0]['number']).toBe(1);
      expect(inl.items[1]['name']).toBe('irc.libera.#test');
    });
  });

  describe('writeObject', () => {
    it('writes object with type prefix for primitives', () => {
      const builder = new BinaryBuilder();
      builder.writeObject('str', 'hello');
      builder.writeObject('int', 42);

      const parser = new BinaryParser(builder.build());
      const obj1 = parser.readObject();
      expect(obj1.type).toBe('str');
      expect(obj1.value).toBe('hello');

      const obj2 = parser.readObject();
      expect(obj2.type).toBe('int');
      expect(obj2.value).toBe(42);
    });

    it('writes object with type prefix for hashtable', () => {
      const builder = new BinaryBuilder();
      builder.writeObject('htb', {
        keyType: 'str',
        valueType: 'str',
        entries: [['k', 'v']] as [unknown, unknown][],
      });

      const parser = new BinaryParser(builder.build());
      const obj = parser.readObject();
      expect(obj.type).toBe('htb');
      const htb = obj.value as { entries: Map<unknown, unknown> };
      expect(htb.entries.get('k')).toBe('v');
    });
  });

  describe('buildMessage', () => {
    it('creates a message with correct header', () => {
      const builder = new BinaryBuilder();
      builder.writeObject('str', 'test');

      const msg = builder.buildMessage('test_id', 0);
      const view = new DataView(msg);

      // Total length
      const totalLength = view.getInt32(0, false);
      expect(totalLength).toBe(msg.byteLength);

      // Compression byte
      expect(view.getUint8(4)).toBe(0);

      // ID string: length-prefixed
      const idLength = view.getInt32(5, false);
      expect(idLength).toBe(7); // 'test_id' = 7 bytes
    });

    it('is parseable by BinaryParser via message.ts header format', () => {
      const builder = new BinaryBuilder();
      builder.writeObject('str', 'payload_data');
      const msg = builder.buildMessage('my_msg_id', 0);

      // Parse like message.ts does: skip 5-byte header, read id string, then objects
      const payload = msg.slice(5);
      const parser = new BinaryParser(payload);
      const id = parser.readString();
      expect(id).toBe('my_msg_id');

      const obj = parser.readObject();
      expect(obj.type).toBe('str');
      expect(obj.value).toBe('payload_data');
      expect(parser.hasRemaining()).toBe(false);
    });

    it('sets compression flag', () => {
      const builder = new BinaryBuilder();
      const msg = builder.buildMessage('id', 2);
      const view = new DataView(msg);
      expect(view.getUint8(4)).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('handles empty builder', () => {
      const builder = new BinaryBuilder();
      const buf = builder.build();
      expect(buf.byteLength).toBe(0);
    });

    it('handles very long strings', () => {
      const longStr = 'x'.repeat(10000);
      const builder = new BinaryBuilder();
      builder.writeString(longStr);

      const parser = new BinaryParser(builder.build());
      expect(parser.readString()).toBe(longStr);
    });

    it('handles pointer with 0x prefix', () => {
      const builder = new BinaryBuilder();
      builder.writePointer('0xdeadbeef');

      const parser = new BinaryParser(builder.build());
      expect(parser.readPointer()).toBe('0xdeadbeef');
    });

    it('handles pointer without 0x prefix', () => {
      const builder = new BinaryBuilder();
      builder.writePointer('deadbeef');

      const parser = new BinaryParser(builder.build());
      expect(parser.readPointer()).toBe('0xdeadbeef');
    });
  });
});
