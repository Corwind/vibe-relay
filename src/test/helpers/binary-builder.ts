export class BinaryBuilder {
  private parts: Uint8Array[] = [];
  private encoder = new TextEncoder();

  writeChar(value: number): this {
    const buf = new Uint8Array(1);
    const view = new DataView(buf.buffer);
    view.setInt8(0, value);
    this.parts.push(buf);
    return this;
  }

  writeInt(value: number): this {
    const buf = new Uint8Array(4);
    const view = new DataView(buf.buffer);
    view.setInt32(0, value, false);
    this.parts.push(buf);
    return this;
  }

  writeLong(value: string): this {
    const digits = this.encoder.encode(value);
    const buf = new Uint8Array(1 + digits.length);
    buf[0] = digits.length;
    buf.set(digits, 1);
    this.parts.push(buf);
    return this;
  }

  writeString(value: string | null): this {
    if (value === null) {
      this.writeInt(-1);
      return this;
    }
    const encoded = this.encoder.encode(value);
    this.writeInt(encoded.length);
    if (encoded.length > 0) {
      this.parts.push(encoded);
    }
    return this;
  }

  writeBuffer(value: Uint8Array | null): this {
    if (value === null) {
      this.writeInt(-1);
      return this;
    }
    this.writeInt(value.length);
    if (value.length > 0) {
      this.parts.push(new Uint8Array(value));
    }
    return this;
  }

  writePointer(value: string): this {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    const chars = this.encoder.encode(hex);
    const buf = new Uint8Array(1 + chars.length);
    buf[0] = chars.length;
    buf.set(chars, 1);
    this.parts.push(buf);
    return this;
  }

  writeTime(value: Date | number): this {
    const timestamp =
      typeof value === 'number'
        ? value
        : Math.floor(value.getTime() / 1000);
    const digits = this.encoder.encode(String(timestamp));
    const buf = new Uint8Array(1 + digits.length);
    buf[0] = digits.length;
    buf.set(digits, 1);
    this.parts.push(buf);
    return this;
  }

  writeType(type: string): this {
    const encoded = this.encoder.encode(type.slice(0, 3));
    this.parts.push(encoded);
    return this;
  }

  writeHashtable(
    keyType: string,
    valueType: string,
    entries: [unknown, unknown][],
  ): this {
    this.writeType(keyType);
    this.writeType(valueType);
    this.writeInt(entries.length);
    for (const [key, val] of entries) {
      this.writeValueOfType(keyType, key);
      this.writeValueOfType(valueType, val);
    }
    return this;
  }

  writeArray(type: string, values: unknown[]): this {
    this.writeType(type);
    this.writeInt(values.length);
    for (const val of values) {
      this.writeValueOfType(type, val);
    }
    return this;
  }

  writeHdata(
    path: string,
    keys: Array<{ name: string; type: string }>,
    entries: Array<{ pointers: string[]; values: unknown[] }>,
  ): this {
    this.writeString(path);
    const keysStr = keys.map((k) => `${k.name}:${k.type}`).join(',');
    this.writeString(keysStr);
    this.writeInt(entries.length);

    for (const entry of entries) {
      for (const ptr of entry.pointers) {
        this.writePointer(ptr);
      }
      for (let i = 0; i < keys.length; i++) {
        this.writeValueOfType(keys[i].type, entry.values[i]);
      }
    }
    return this;
  }

  writeInfo(key: string, value: string): this {
    this.writeString(key);
    this.writeString(value);
    return this;
  }

  writeInfolist(
    name: string,
    items: Array<Record<string, { type: string; value: unknown }>>,
  ): this {
    this.writeString(name);
    this.writeInt(items.length);
    for (const item of items) {
      const fields = Object.entries(item);
      this.writeInt(fields.length);
      for (const [fieldName, field] of fields) {
        this.writeString(fieldName);
        this.writeType(field.type);
        this.writeValueOfType(field.type, field.value);
      }
    }
    return this;
  }

  writeObject(type: string, value: unknown): this {
    this.writeType(type);
    switch (type) {
      case 'htb': {
        const htb = value as {
          keyType: string;
          valueType: string;
          entries: [unknown, unknown][];
        };
        this.writeHashtable(htb.keyType, htb.valueType, htb.entries);
        break;
      }
      case 'arr': {
        const arr = value as { type: string; values: unknown[] };
        this.writeArray(arr.type, arr.values);
        break;
      }
      case 'hda': {
        const hda = value as {
          path: string;
          keys: Array<{ name: string; type: string }>;
          entries: Array<{ pointers: string[]; values: unknown[] }>;
        };
        this.writeHdata(hda.path, hda.keys, hda.entries);
        break;
      }
      case 'inf': {
        const inf = value as { key: string; value: string };
        this.writeInfo(inf.key, inf.value);
        break;
      }
      case 'inl': {
        const inl = value as {
          name: string;
          items: Array<Record<string, { type: string; value: unknown }>>;
        };
        this.writeInfolist(inl.name, inl.items);
        break;
      }
      default:
        this.writeValueOfType(type, value);
        break;
    }
    return this;
  }

  buildMessage(id: string, compression = 0): ArrayBuffer {
    const idEncoded = this.encoder.encode(id);
    const content = this.concat();

    // id as string: 4-byte length + bytes
    const idLength = 4 + idEncoded.length;
    // header: 4-byte total length + 1-byte compression
    const totalLength = 4 + 1 + idLength + content.length;

    const result = new Uint8Array(totalLength);
    const headerView = new DataView(result.buffer);
    headerView.setInt32(0, totalLength, false);
    result[4] = compression;

    // Write id as a string (length-prefixed)
    headerView.setInt32(5, idEncoded.length, false);
    result.set(idEncoded, 9);

    // Write content
    result.set(content, 9 + idEncoded.length);

    return result.buffer as ArrayBuffer;
  }

  build(): ArrayBuffer {
    return this.concat().buffer as ArrayBuffer;
  }

  private concat(): Uint8Array {
    let totalLength = 0;
    for (const part of this.parts) {
      totalLength += part.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of this.parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }

  private writeValueOfType(type: string, value: unknown): void {
    switch (type) {
      case 'chr':
        this.writeChar(value as number);
        break;
      case 'int':
        this.writeInt(value as number);
        break;
      case 'lon':
        this.writeLong(value as string);
        break;
      case 'str':
        this.writeString(value as string | null);
        break;
      case 'buf':
        this.writeBuffer(value as Uint8Array | null);
        break;
      case 'ptr':
        this.writePointer(value as string);
        break;
      case 'tim':
        this.writeTime(value as Date | number);
        break;
      case 'htb': {
        const htb = value as {
          keyType: string;
          valueType: string;
          entries: [unknown, unknown][];
        };
        this.writeHashtable(htb.keyType, htb.valueType, htb.entries);
        break;
      }
      case 'arr': {
        const arr = value as { type: string; values: unknown[] };
        this.writeArray(arr.type, arr.values);
        break;
      }
      case 'hda': {
        const hda = value as {
          path: string;
          keys: Array<{ name: string; type: string }>;
          entries: Array<{ pointers: string[]; values: unknown[] }>;
        };
        this.writeHdata(hda.path, hda.keys, hda.entries);
        break;
      }
      case 'inf': {
        const inf = value as { key: string; value: string };
        this.writeInfo(inf.key, inf.value);
        break;
      }
      case 'inl': {
        const inl = value as {
          name: string;
          items: Array<Record<string, { type: string; value: unknown }>>;
        };
        this.writeInfolist(inl.name, inl.items);
        break;
      }
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
}
