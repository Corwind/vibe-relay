import { describe, it, expect } from 'vitest';
import { BinaryParser } from '../binary-parser';
import { BinaryBuilder as TestBuilder } from '@/test/helpers/binary-builder';

// Helper: build an ArrayBuffer from a sequence of operations
class BinaryBuilder {
  private parts: number[] = [];

  writeByte(v: number): this {
    this.parts.push(v & 0xff);
    return this;
  }

  writeChar(v: number): this {
    this.parts.push(v & 0xff);
    return this;
  }

  writeInt(v: number): this {
    this.parts.push((v >> 24) & 0xff);
    this.parts.push((v >> 16) & 0xff);
    this.parts.push((v >> 8) & 0xff);
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

  writePointer(hex: string): this {
    // hex without "0x" prefix
    this.writeByte(hex.length);
    for (const ch of hex) this.parts.push(ch.charCodeAt(0));
    return this;
  }

  writeLong(digits: string): this {
    this.writeByte(digits.length);
    for (const ch of digits) this.parts.push(ch.charCodeAt(0));
    return this;
  }

  writeTime(digits: string): this {
    this.writeByte(digits.length);
    for (const ch of digits) this.parts.push(ch.charCodeAt(0));
    return this;
  }

  writeType(type: string): this {
    for (const ch of type) this.parts.push(ch.charCodeAt(0));
    return this;
  }

  writeBytes(bytes: number[]): this {
    for (const b of bytes) this.parts.push(b & 0xff);
    return this;
  }

  build(): ArrayBuffer {
    return new Uint8Array(this.parts).buffer;
  }
}

describe('BinaryParser', () => {
  describe('readByte', () => {
    it('reads an unsigned byte', () => {
      const buf = new BinaryBuilder().writeByte(0xff).build();
      const parser = new BinaryParser(buf);
      expect(parser.readByte()).toBe(255);
    });
  });

  describe('readChar', () => {
    it('reads a signed byte', () => {
      const buf = new BinaryBuilder().writeChar(0xff).build();
      const parser = new BinaryParser(buf);
      expect(parser.readChar()).toBe(-1);
    });

    it('reads positive value', () => {
      const buf = new BinaryBuilder().writeChar(65).build();
      const parser = new BinaryParser(buf);
      expect(parser.readChar()).toBe(65);
    });
  });

  describe('readInt', () => {
    it('reads a positive int', () => {
      const buf = new BinaryBuilder().writeInt(12345).build();
      const parser = new BinaryParser(buf);
      expect(parser.readInt()).toBe(12345);
    });

    it('reads a negative int', () => {
      const buf = new BinaryBuilder().writeInt(-1).build();
      const parser = new BinaryParser(buf);
      expect(parser.readInt()).toBe(-1);
    });

    it('reads zero', () => {
      const buf = new BinaryBuilder().writeInt(0).build();
      const parser = new BinaryParser(buf);
      expect(parser.readInt()).toBe(0);
    });
  });

  describe('readLong', () => {
    it('reads a long value as string', () => {
      const buf = new BinaryBuilder().writeLong('1234567890123').build();
      const parser = new BinaryParser(buf);
      expect(parser.readLong()).toBe('1234567890123');
    });
  });

  describe('readString', () => {
    it('reads a normal string', () => {
      const buf = new BinaryBuilder().writeString('hello').build();
      const parser = new BinaryParser(buf);
      expect(parser.readString()).toBe('hello');
    });

    it('reads a null string (length -1)', () => {
      const buf = new BinaryBuilder().writeString(null).build();
      const parser = new BinaryParser(buf);
      expect(parser.readString()).toBeNull();
    });

    it('reads an empty string', () => {
      const buf = new BinaryBuilder().writeString('').build();
      const parser = new BinaryParser(buf);
      expect(parser.readString()).toBe('');
    });

    it('reads UTF-8 string', () => {
      const buf = new BinaryBuilder().writeString('caf\u00e9').build();
      const parser = new BinaryParser(buf);
      expect(parser.readString()).toBe('caf\u00e9');
    });
  });

  describe('readBuffer', () => {
    it('reads buffer data', () => {
      const buf = new BinaryBuilder()
        .writeInt(3) // length
        .writeBytes([0x01, 0x02, 0x03])
        .build();
      const parser = new BinaryParser(buf);
      const result = parser.readBuffer();
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('reads null buffer', () => {
      const buf = new BinaryBuilder().writeInt(-1).build();
      const parser = new BinaryParser(buf);
      expect(parser.readBuffer()).toBeNull();
    });

    it('reads empty buffer', () => {
      const buf = new BinaryBuilder().writeInt(0).build();
      const parser = new BinaryParser(buf);
      const result = parser.readBuffer();
      expect(result).toEqual(new Uint8Array(0));
    });
  });

  describe('readPointer', () => {
    it('reads a pointer as 0x-prefixed hex', () => {
      const buf = new BinaryBuilder().writePointer('1a2b3c').build();
      const parser = new BinaryParser(buf);
      expect(parser.readPointer()).toBe('0x1a2b3c');
    });
  });

  describe('readTime', () => {
    it('reads a timestamp', () => {
      const buf = new BinaryBuilder().writeTime('1234567890').build();
      const parser = new BinaryParser(buf);
      const date = parser.readTime();
      expect(date.getTime()).toBe(1234567890000);
    });
  });

  describe('readType', () => {
    it('reads a 3-char type', () => {
      const buf = new BinaryBuilder().writeType('str').build();
      const parser = new BinaryParser(buf);
      expect(parser.readType()).toBe('str');
    });
  });

  describe('readHashtable', () => {
    it('reads a hashtable with string keys and values', () => {
      const buf = new BinaryBuilder()
        .writeType('str') // key type
        .writeType('str') // value type
        .writeInt(2) // count
        .writeString('key1')
        .writeString('val1')
        .writeString('key2')
        .writeString('val2')
        .build();
      const parser = new BinaryParser(buf);
      const ht = parser.readHashtable();
      expect(ht.keyType).toBe('str');
      expect(ht.valueType).toBe('str');
      expect(ht.entries.size).toBe(2);
      expect(ht.entries.get('key1')).toBe('val1');
      expect(ht.entries.get('key2')).toBe('val2');
    });
  });

  describe('readArray', () => {
    it('reads an array of integers', () => {
      const buf = new BinaryBuilder()
        .writeType('int')
        .writeInt(3) // count
        .writeInt(10)
        .writeInt(20)
        .writeInt(30)
        .build();
      const parser = new BinaryParser(buf);
      const arr = parser.readArray();
      expect(arr.type).toBe('int');
      expect(arr.values).toEqual([10, 20, 30]);
    });

    it('reads an array of strings', () => {
      const buf = new BinaryBuilder()
        .writeType('str')
        .writeInt(2)
        .writeString('alpha')
        .writeString('beta')
        .build();
      const parser = new BinaryParser(buf);
      const arr = parser.readArray();
      expect(arr.type).toBe('str');
      expect(arr.values).toEqual(['alpha', 'beta']);
    });
  });

  describe('readHdata', () => {
    it('reads hdata with single path segment', () => {
      const buf = new BinaryBuilder()
        .writeString('buffer') // path
        .writeString('number:int,name:str') // keys
        .writeInt(2) // count
        // entry 1
        .writePointer('abc123') // 1 pointer for 1 path segment
        .writeInt(1)
        .writeString('core.weechat')
        // entry 2
        .writePointer('def456')
        .writeInt(2)
        .writeString('irc.libera.#test')
        .build();
      const parser = new BinaryParser(buf);
      const hd = parser.readHdata();
      expect(hd.path).toBe('buffer');
      expect(hd.keys).toEqual([
        { name: 'number', type: 'int' },
        { name: 'name', type: 'str' },
      ]);
      expect(hd.entries).toHaveLength(2);
      expect(hd.entries[0].pointers).toEqual(['0xabc123']);
      expect(hd.entries[0].values).toEqual({
        number: 1,
        name: 'core.weechat',
      });
      expect(hd.entries[1].pointers).toEqual(['0xdef456']);
      expect(hd.entries[1].values).toEqual({
        number: 2,
        name: 'irc.libera.#test',
      });
    });

    it('reads hdata with multiple path segments (multiple pointers per entry)', () => {
      const buf = new BinaryBuilder()
        .writeString('buffer/lines/line') // 3 segments
        .writeString('message:str') // keys
        .writeInt(1) // count
        // entry: 3 pointers
        .writePointer('aaa')
        .writePointer('bbb')
        .writePointer('ccc')
        .writeString('Hello world')
        .build();
      const parser = new BinaryParser(buf);
      const hd = parser.readHdata();
      expect(hd.entries[0].pointers).toEqual(['0xaaa', '0xbbb', '0xccc']);
      expect(hd.entries[0].values).toEqual({ message: 'Hello world' });
    });
  });

  describe('readInfo', () => {
    it('reads an info pair', () => {
      const buf = new BinaryBuilder().writeString('version').writeString('4.0.0').build();
      const parser = new BinaryParser(buf);
      const result = parser.readInfo();
      expect(result).toEqual({ key: 'version', value: '4.0.0' });
    });
  });

  describe('readInfolist', () => {
    it('reads an infolist', () => {
      const buf = new BinaryBuilder()
        .writeString('buffer') // name
        .writeInt(1) // item count
        .writeInt(2) // field count in item 1
        .writeString('name') // field 1 name
        .writeType('str') // field 1 type
        .writeString('core.weechat') // field 1 value
        .writeString('number') // field 2 name
        .writeType('int') // field 2 type
        .writeInt(1) // field 2 value
        .build();
      const parser = new BinaryParser(buf);
      const il = parser.readInfolist();
      expect(il.name).toBe('buffer');
      expect(il.items).toHaveLength(1);
      expect(il.items[0]).toEqual({ name: 'core.weechat', number: 1 });
    });
  });

  describe('readObject', () => {
    it('reads a typed object (int)', () => {
      const buf = new BinaryBuilder().writeType('int').writeInt(42).build();
      const parser = new BinaryParser(buf);
      const obj = parser.readObject();
      expect(obj.type).toBe('int');
      expect(obj.value).toBe(42);
    });

    it('reads a typed object (str)', () => {
      const buf = new BinaryBuilder().writeType('str').writeString('test').build();
      const parser = new BinaryParser(buf);
      const obj = parser.readObject();
      expect(obj.type).toBe('str');
      expect(obj.value).toBe('test');
    });
  });

  describe('sequential reads', () => {
    it('reads multiple values in sequence', () => {
      const buf = new BinaryBuilder().writeInt(42).writeString('hello').writePointer('ff').build();
      const parser = new BinaryParser(buf);
      expect(parser.readInt()).toBe(42);
      expect(parser.readString()).toBe('hello');
      expect(parser.readPointer()).toBe('0xff');
      expect(parser.hasRemaining()).toBe(false);
    });
  });

  describe('remaining / hasRemaining', () => {
    it('tracks remaining bytes', () => {
      const buf = new BinaryBuilder().writeInt(1).writeInt(2).build();
      const parser = new BinaryParser(buf);
      expect(parser.remaining()).toBe(8);
      expect(parser.hasRemaining()).toBe(true);
      parser.readInt();
      expect(parser.remaining()).toBe(4);
      parser.readInt();
      expect(parser.remaining()).toBe(0);
      expect(parser.hasRemaining()).toBe(false);
    });
  });

  describe('offset constructor parameter', () => {
    it('starts reading from given offset', () => {
      const buf = new BinaryBuilder().writeInt(999).writeInt(42).build();
      const parser = new BinaryParser(buf, 4);
      expect(parser.readInt()).toBe(42);
    });
  });

  // =====================================================================
  // Edge case tests using the test helper BinaryBuilder (roundtrip tests)
  // =====================================================================
  describe('edge cases', () => {

    describe('int edge cases', () => {
      it('reads INT32_MAX (2147483647)', () => {
        const b = new TestBuilder();
        b.writeInt(2147483647);
        expect(new BinaryParser(b.build()).readInt()).toBe(2147483647);
      });

      it('reads INT32_MIN (-2147483648)', () => {
        const b = new TestBuilder();
        b.writeInt(-2147483648);
        expect(new BinaryParser(b.build()).readInt()).toBe(-2147483648);
      });

      it('reads -1', () => {
        const b = new TestBuilder();
        b.writeInt(-1);
        expect(new BinaryParser(b.build()).readInt()).toBe(-1);
      });
    });

    describe('char edge cases', () => {
      it('reads max signed char (127)', () => {
        const b = new TestBuilder();
        b.writeChar(127);
        expect(new BinaryParser(b.build()).readChar()).toBe(127);
      });

      it('reads min signed char (-128)', () => {
        const b = new TestBuilder();
        b.writeChar(-128);
        expect(new BinaryParser(b.build()).readChar()).toBe(-128);
      });
    });

    describe('long edge cases', () => {
      it('reads negative long', () => {
        const b = new TestBuilder();
        b.writeLong('-9999999999');
        expect(new BinaryParser(b.build()).readLong()).toBe('-9999999999');
      });

      it('reads single digit long', () => {
        const b = new TestBuilder();
        b.writeLong('0');
        expect(new BinaryParser(b.build()).readLong()).toBe('0');
      });

      it('reads very large long', () => {
        const b = new TestBuilder();
        b.writeLong('9223372036854775807');
        expect(new BinaryParser(b.build()).readLong()).toBe('9223372036854775807');
      });
    });

    describe('string edge cases', () => {
      it('reads max-length-ish string (10000 chars)', () => {
        const longStr = 'A'.repeat(10000);
        const b = new TestBuilder();
        b.writeString(longStr);
        expect(new BinaryParser(b.build()).readString()).toBe(longStr);
      });

      it('reads string with multibyte UTF-8 (emoji)', () => {
        const b = new TestBuilder();
        b.writeString('\u{1F600}\u{1F4A9}');
        expect(new BinaryParser(b.build()).readString()).toBe('\u{1F600}\u{1F4A9}');
      });

      it('reads string with newlines and special characters', () => {
        const b = new TestBuilder();
        b.writeString('line1\nline2\ttab\r\nwindows');
        expect(new BinaryParser(b.build()).readString()).toBe(
          'line1\nline2\ttab\r\nwindows',
        );
      });

      it('reads multiple null and empty strings in sequence', () => {
        const b = new TestBuilder();
        b.writeString(null).writeString('').writeString(null).writeString('end');
        const p = new BinaryParser(b.build());
        expect(p.readString()).toBeNull();
        expect(p.readString()).toBe('');
        expect(p.readString()).toBeNull();
        expect(p.readString()).toBe('end');
      });
    });

    describe('buffer edge cases', () => {
      it('reads buffer with all byte values (0-255)', () => {
        const bytes = new Uint8Array(256);
        for (let i = 0; i < 256; i++) bytes[i] = i;
        const b = new TestBuilder();
        b.writeBuffer(bytes);
        const result = new BinaryParser(b.build()).readBuffer();
        expect(result).toEqual(bytes);
      });

      it('reads null buffer followed by non-null buffer', () => {
        const b = new TestBuilder();
        b.writeBuffer(null).writeBuffer(new Uint8Array([42]));
        const p = new BinaryParser(b.build());
        expect(p.readBuffer()).toBeNull();
        expect(p.readBuffer()).toEqual(new Uint8Array([42]));
      });
    });

    describe('pointer edge cases', () => {
      it('reads null pointer (0x0)', () => {
        const b = new TestBuilder();
        b.writePointer('0x0');
        expect(new BinaryParser(b.build()).readPointer()).toBe('0x0');
      });

      it('reads long pointer', () => {
        const b = new TestBuilder();
        b.writePointer('0x7ffeabcdef12');
        expect(new BinaryParser(b.build()).readPointer()).toBe('0x7ffeabcdef12');
      });
    });

    describe('time edge cases', () => {
      it('reads epoch zero', () => {
        const b = new TestBuilder();
        b.writeTime(0);
        const date = new BinaryParser(b.build()).readTime();
        expect(date.getTime()).toBe(0);
      });

      it('reads recent timestamp', () => {
        const ts = 1740000000;
        const b = new TestBuilder();
        b.writeTime(ts);
        const date = new BinaryParser(b.build()).readTime();
        expect(date.getTime()).toBe(ts * 1000);
      });
    });

    describe('hashtable edge cases', () => {
      it('reads empty hashtable (0 entries)', () => {
        const b = new TestBuilder();
        b.writeType('htb');
        b.writeHashtable('str', 'str', []);
        const p = new BinaryParser(b.build());
        p.readType();
        const htb = p.readHashtable();
        expect(htb.entries.size).toBe(0);
      });

      it('reads hashtable with int keys and pointer values', () => {
        const b = new TestBuilder();
        b.writeType('htb');
        b.writeHashtable('int', 'ptr', [
          [1, '0xabc'],
          [2, '0xdef'],
        ]);
        const p = new BinaryParser(b.build());
        p.readType();
        const htb = p.readHashtable();
        expect(htb.entries.get(1)).toBe('0xabc');
        expect(htb.entries.get(2)).toBe('0xdef');
      });
    });

    describe('array edge cases', () => {
      it('reads empty array (0 elements)', () => {
        const b = new TestBuilder();
        b.writeType('arr');
        b.writeArray('str', []);
        const p = new BinaryParser(b.build());
        p.readType();
        const arr = p.readArray();
        expect(arr.values).toEqual([]);
      });

      it('reads array of pointers', () => {
        const b = new TestBuilder();
        b.writeType('arr');
        b.writeArray('ptr', ['0xaaa', '0xbbb']);
        const p = new BinaryParser(b.build());
        p.readType();
        const arr = p.readArray();
        expect(arr.type).toBe('ptr');
        expect(arr.values).toEqual(['0xaaa', '0xbbb']);
      });
    });

    describe('hdata edge cases', () => {
      it('reads hdata with 0 entries', () => {
        const b = new TestBuilder();
        b.writeType('hda');
        b.writeHdata('buffer', [{ name: 'number', type: 'int' }], []);
        const p = new BinaryParser(b.build());
        p.readType();
        const hda = p.readHdata();
        expect(hda.path).toBe('buffer');
        expect(hda.entries).toEqual([]);
      });

      it('reads hdata with many key types', () => {
        const b = new TestBuilder();
        b.writeType('hda');
        b.writeHdata(
          'buffer',
          [
            { name: 'num', type: 'int' },
            { name: 'name', type: 'str' },
            { name: 'ptr', type: 'ptr' },
            { name: 'flag', type: 'chr' },
          ],
          [
            {
              pointers: ['0x123'],
              values: [42, 'test', '0xabc', 1],
            },
          ],
        );
        const p = new BinaryParser(b.build());
        p.readType();
        const hda = p.readHdata();
        expect(hda.entries[0].values).toEqual({
          num: 42,
          name: 'test',
          ptr: '0xabc',
          flag: 1,
        });
      });

      it('reads hdata with 4 path segments', () => {
        const b = new TestBuilder();
        b.writeType('hda');
        b.writeHdata(
          'a/b/c/d',
          [{ name: 'val', type: 'int' }],
          [
            {
              pointers: ['0x1', '0x2', '0x3', '0x4'],
              values: [99],
            },
          ],
        );
        const p = new BinaryParser(b.build());
        p.readType();
        const hda = p.readHdata();
        expect(hda.entries[0].pointers).toHaveLength(4);
      });
    });

    describe('infolist edge cases', () => {
      it('reads infolist with nested pointer and time types', () => {
        const b = new TestBuilder();
        b.writeType('inl');
        b.writeInfolist('test', [
          {
            ptr_field: { type: 'ptr', value: '0xdeadbeef' },
            time_field: { type: 'tim', value: 1700000000 },
            int_field: { type: 'int', value: -1 },
          },
        ]);
        const p = new BinaryParser(b.build());
        p.readType();
        const inl = p.readInfolist();
        expect(inl.items[0]['ptr_field']).toBe('0xdeadbeef');
        expect((inl.items[0]['time_field'] as Date).getTime()).toBe(1700000000 * 1000);
        expect(inl.items[0]['int_field']).toBe(-1);
      });

      it('reads infolist with 0 items', () => {
        const b = new TestBuilder();
        b.writeType('inl');
        b.writeInfolist('empty', []);
        const p = new BinaryParser(b.build());
        p.readType();
        const inl = p.readInfolist();
        expect(inl.name).toBe('empty');
        expect(inl.items).toEqual([]);
      });

      it('reads infolist with multiple items', () => {
        const b = new TestBuilder();
        b.writeType('inl');
        b.writeInfolist('multi', [
          { name: { type: 'str', value: 'first' } },
          { name: { type: 'str', value: 'second' } },
          { name: { type: 'str', value: 'third' } },
        ]);
        const p = new BinaryParser(b.build());
        p.readType();
        const inl = p.readInfolist();
        expect(inl.items).toHaveLength(3);
        expect(inl.items.map((i) => i['name'])).toEqual(['first', 'second', 'third']);
      });
    });

    describe('object edge cases', () => {
      it('reads all primitive object types', () => {
        const b = new TestBuilder();
        b.writeObject('chr', 65);
        b.writeObject('int', 42);
        b.writeObject('lon', '9999');
        b.writeObject('str', 'hello');
        b.writeObject('ptr', '0xabc');
        b.writeObject('tim', 1700000000);

        const p = new BinaryParser(b.build());
        expect(p.readObject()).toEqual({ type: 'chr', value: 65 });
        expect(p.readObject()).toEqual({ type: 'int', value: 42 });
        expect(p.readObject()).toEqual({ type: 'lon', value: '9999' });
        expect(p.readObject()).toEqual({ type: 'str', value: 'hello' });
        expect(p.readObject()).toEqual({ type: 'ptr', value: '0xabc' });
        const timObj = p.readObject();
        expect(timObj.type).toBe('tim');
        expect((timObj.value as Date).getTime()).toBe(1700000000 * 1000);
      });
    });
  });
});
