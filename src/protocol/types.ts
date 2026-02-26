// WeeChat wire types
export type WeechatType =
  | 'chr'
  | 'int'
  | 'lon'
  | 'str'
  | 'buf'
  | 'ptr'
  | 'tim'
  | 'htb'
  | 'arr'
  | 'hda'
  | 'inf'
  | 'inl';

// Parsed value types
export interface WeechatHdataEntry {
  pointers: string[];
  values: Record<string, unknown>;
}

export interface WeechatHdata {
  path: string;
  keys: Array<{ name: string; type: WeechatType }>;
  entries: WeechatHdataEntry[];
}

export interface WeechatHashtable {
  keyType: WeechatType;
  valueType: WeechatType;
  entries: Map<unknown, unknown>;
}

export interface WeechatInfolist {
  name: string;
  items: Array<Record<string, unknown>>;
}

export interface WeechatArray {
  type: WeechatType;
  values: unknown[];
}

export interface WeechatObject {
  type: WeechatType;
  value: unknown;
}

export interface WeechatMessage {
  id: string;
  objects: WeechatObject[];
}

// Domain models
export interface RelayBuffer {
  pointer: string;
  number: number;
  fullName: string;
  shortName: string | null;
  title: string;
  type: number;
  hidden: boolean;
  localVariables: Record<string, string>;
  unreadCount: number;
  highlightCount: number;
}

export interface RelayLine {
  buffer: string;
  date: Date;
  prefix: string;
  message: string;
  highlight: boolean;
  tags: string[];
  displayed: boolean;
  notify: number;
}

export interface RelayNicklistItem {
  group: boolean;
  level: number;
  name: string;
  color: string;
  prefix: string;
  prefixColor: string;
  visible: boolean;
}

export interface FormattedSegment {
  text: string;
  fgColor?: string;
  bgColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  reverse?: boolean;
}

// Connection types
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'authenticating'
  | 'connected'
  | 'error';

export type CompressionType = 'off' | 'zlib' | 'zstd';

export type HashAlgorithm = 'plain' | 'sha256' | 'sha512' | 'pbkdf2+sha256' | 'pbkdf2+sha512';
