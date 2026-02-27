/**
 * Deterministic nick-to-color mapping using a djb2 hash.
 * Returns a CSS hex color string that is readable on both light and dark backgrounds.
 */

const NICK_PALETTE = [
  '#c0392b', // red
  '#e67e22', // orange
  '#f39c12', // amber
  '#27ae60', // green
  '#16a085', // teal
  '#2980b9', // blue
  '#8e44ad', // purple
  '#d35400', // burnt orange
  '#1abc9c', // turquoise
  '#2ecc71', // emerald
  '#3498db', // light blue
  '#9b59b6', // amethyst
  '#e74c3c', // light red
  '#e08283', // salmon
  '#00b5cc', // cyan
  '#5b2c6f', // dark purple
  '#1a5276', // dark blue
  '#7d3c98', // violet
  '#a04000', // brown
  '#117a65', // dark teal
] as const;

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function nickColor(nick: string): string {
  if (!nick) return NICK_PALETTE[0];
  return NICK_PALETTE[djb2(nick) % NICK_PALETTE.length];
}
