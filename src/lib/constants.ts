// Re-export color tables from the protocol layer (single source of truth)
export { IRC_COLORS, WEECHAT_BASIC_COLORS, xterm256Color } from '@/protocol/color-parser';

export const BufferType = {
  Channel: 'channel',
  Private: 'private',
  Server: 'server',
} as const;

export type BufferType = (typeof BufferType)[keyof typeof BufferType];

export const NICK_PREFIXES = ['~', '&', '@', '%', '+'] as const;
export type NickPrefix = (typeof NICK_PREFIXES)[number];

export const NICK_PREFIX_LABELS: Record<string, string> = {
  '~': 'Owner',
  '&': 'Admin',
  '@': 'Op',
  '%': 'Halfop',
  '+': 'Voice',
};
