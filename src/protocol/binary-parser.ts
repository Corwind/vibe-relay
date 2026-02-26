import type {
  WeechatType,
  WeechatHdata,
  WeechatHashtable,
  WeechatInfolist,
  WeechatArray,
  WeechatObject,
} from './types';

export class BinaryParser {
  private view: DataView;
  private offset: number;
  private decoder: TextDecoder;

  constructor(buffer: ArrayBuffer, offset = 0) {
    this.view = new DataView(buffer);
    this.offset = offset;
    this.decoder = new TextDecoder('utf-8');
  }

  readByte(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  readChar(): number {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  readInt(): number {
    const value = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return value;
  }

  readLong(): string {
    const length = this.readByte();
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    const str = this.decoder.decode(bytes);
    this.offset += length;
    return str;
  }

  readString(): string | null {
    const length = this.readInt();
    if (length === -1) {
      return null;
    }
    if (length === 0) {
      return '';
    }
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    const str = this.decoder.decode(bytes);
    this.offset += length;
    return str;
  }

  readBuffer(): Uint8Array | null {
    const length = this.readInt();
    if (length === -1) {
      return null;
    }
    if (length === 0) {
      return new Uint8Array(0);
    }
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;
    return new Uint8Array(bytes);
  }

  readPointer(): string {
    const length = this.readByte();
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    const hex = this.decoder.decode(bytes);
    this.offset += length;
    return '0x' + hex;
  }

  readTime(): Date {
    const length = this.readByte();
    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    const str = this.decoder.decode(bytes);
    this.offset += length;
    return new Date(parseInt(str, 10) * 1000);
  }

  readType(): WeechatType {
    const bytes = new Uint8Array(this.view.buffer, this.offset, 3);
    const type = this.decoder.decode(bytes) as WeechatType;
    this.offset += 3;
    return type;
  }

  readHashtable(): WeechatHashtable {
    const keyType = this.readType();
    const valueType = this.readType();
    const count = this.readInt();
    const entries = new Map<unknown, unknown>();

    for (let i = 0; i < count; i++) {
      const key = this.readValueOfType(keyType);
      const value = this.readValueOfType(valueType);
      entries.set(key, value);
    }

    return { keyType, valueType, entries };
  }

  readArray(): WeechatArray {
    const type = this.readType();
    const count = this.readInt();
    const values: unknown[] = [];

    for (let i = 0; i < count; i++) {
      values.push(this.readValueOfType(type));
    }

    return { type, values };
  }

  readHdata(): WeechatHdata {
    const path = this.readString()!;
    const keysStr = this.readString()!;
    const count = this.readInt();

    const pathSegments = path.split('/');
    const pointerCount = pathSegments.length;

    const keys: Array<{ name: string; type: WeechatType }> = [];
    if (keysStr) {
      for (const part of keysStr.split(',')) {
        const colonIdx = part.lastIndexOf(':');
        const name = part.substring(0, colonIdx);
        const type = part.substring(colonIdx + 1) as WeechatType;
        keys.push({ name, type });
      }
    }

    const entries: WeechatHdata['entries'] = [];
    for (let i = 0; i < count; i++) {
      const pointers: string[] = [];
      for (let p = 0; p < pointerCount; p++) {
        pointers.push(this.readPointer());
      }

      const values: Record<string, unknown> = {};
      for (const key of keys) {
        values[key.name] = this.readValueOfType(key.type);
      }

      entries.push({ pointers, values });
    }

    return { path, keys, entries };
  }

  readInfo(): { key: string; value: string } {
    const key = this.readString()!;
    const value = this.readString()!;
    return { key, value };
  }

  readInfolist(): WeechatInfolist {
    const name = this.readString()!;
    const itemCount = this.readInt();
    const items: Array<Record<string, unknown>> = [];

    for (let i = 0; i < itemCount; i++) {
      const fieldCount = this.readInt();
      const item: Record<string, unknown> = {};

      for (let j = 0; j < fieldCount; j++) {
        const fieldName = this.readString()!;
        const fieldType = this.readType();
        item[fieldName] = this.readValueOfType(fieldType);
      }

      items.push(item);
    }

    return { name, items };
  }

  readObject(): WeechatObject {
    const type = this.readType();
    const value = this.readValueOfType(type);
    return { type, value };
  }

  remaining(): number {
    return this.view.byteLength - this.offset;
  }

  hasRemaining(): boolean {
    return this.offset < this.view.byteLength;
  }

  private readValueOfType(type: WeechatType): unknown {
    switch (type) {
      case 'chr':
        return this.readChar();
      case 'int':
        return this.readInt();
      case 'lon':
        return this.readLong();
      case 'str':
        return this.readString();
      case 'buf':
        return this.readBuffer();
      case 'ptr':
        return this.readPointer();
      case 'tim':
        return this.readTime();
      case 'htb':
        return this.readHashtable();
      case 'arr':
        return this.readArray();
      case 'hda':
        return this.readHdata();
      case 'inf':
        return this.readInfo();
      case 'inl':
        return this.readInfolist();
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}
