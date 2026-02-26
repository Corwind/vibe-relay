import type { BufferType } from '@/lib/constants';

export interface WeechatBuffer {
  id: string;
  fullName: string;
  shortName: string;
  title: string;
  type: BufferType;
  number: number;
  unreadCount: number;
  highlightCount: number;
  isActive: boolean;
  nicklistVisible: boolean;
  hidden?: boolean;
  localVariables: Record<string, string>;
}

export interface TextSpan {
  text: string;
  fg?: number;
  bg?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  reverse?: boolean;
}

export interface WeechatMessage {
  id: string;
  bufferId: string;
  date: Date;
  prefix: string;
  message: string;
  tags: string[];
  highlight: boolean;
  displayed: boolean;
  spans?: TextSpan[];
  prefixSpans?: TextSpan[];
}

export interface NickEntry {
  name: string;
  prefix: string;
  color: string;
  visible: boolean;
  group: string;
  level: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'authenticating' | 'connected';

export interface ConnectionSettings {
  host: string;
  port: number;
  password: string;
  ssl: boolean;
}
