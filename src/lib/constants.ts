export enum BufferType {
  Channel = 'channel',
  Private = 'private',
  Server = 'server',
}

export const IRC_COLORS: Record<number, string> = {
  0: '#ffffff', // white
  1: '#000000', // black
  2: '#00007f', // blue (navy)
  3: '#009300', // green
  4: '#ff0000', // red
  5: '#7f0000', // brown (maroon)
  6: '#9c009c', // purple
  7: '#fc7f00', // orange (olive)
  8: '#ffff00', // yellow
  9: '#00fc00', // light green (lime)
  10: '#009393', // teal
  11: '#00ffff', // cyan
  12: '#0000fc', // light blue (royal)
  13: '#ff00ff', // pink (fuchsia)
  14: '#7f7f7f', // grey
  15: '#d2d2d2', // light grey (silver)
};

export function getXterm256Color(index: number): string {
  if (index < 16) {
    return IRC_COLORS[index] ?? '#ffffff';
  }
  if (index < 232) {
    const n = index - 16;
    const r = Math.floor(n / 36) * 51;
    const g = (Math.floor(n / 6) % 6) * 51;
    const b = (n % 6) * 51;
    return `rgb(${r},${g},${b})`;
  }
  const gray = (index - 232) * 10 + 8;
  return `rgb(${gray},${gray},${gray})`;
}

export const NICK_PREFIXES = ['~', '&', '@', '%', '+'] as const;
export type NickPrefix = (typeof NICK_PREFIXES)[number];

export const NICK_PREFIX_LABELS: Record<string, string> = {
  '~': 'Owner',
  '&': 'Admin',
  '@': 'Op',
  '%': 'Halfop',
  '+': 'Voice',
};
