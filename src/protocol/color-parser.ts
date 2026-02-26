import type { FormattedSegment } from './types';

// Standard WeeChat colors (0-15)
export const WEECHAT_BASIC_COLORS: Record<number, string> = {
  0: '#000000', // default (black)
  1: '#000000', // black
  2: '#800000', // dark gray (dark red)
  3: '#ff0000', // dark red (red)
  4: '#00ff00', // light red (green)
  5: '#804000', // brown
  6: '#ffff00', // yellow
  7: '#008000', // dark green
  8: '#00ffff', // light green (cyan)
  9: '#008080', // dark cyan
  10: '#00ffff', // light cyan
  11: '#000080', // dark blue
  12: '#0000ff', // light blue
  13: '#800080', // dark magenta
  14: '#ff00ff', // light magenta
  15: '#ffffff', // white (default fg)
};

// IRC mIRC colors (0-15)
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
  10: '#009393', // cyan (teal)
  11: '#00ffff', // light cyan (aqua)
  12: '#0000fc', // light blue (royal)
  13: '#ff00ff', // pink (fuchsia)
  14: '#7f7f7f', // grey
  15: '#d2d2d2', // light grey (silver)
};

// xterm-256 extended colors (16-255)
export function xterm256Color(n: number): string {
  if (n < 16) return WEECHAT_BASIC_COLORS[n] ?? '#ffffff';
  if (n < 232) {
    // 6x6x6 color cube
    const idx = n - 16;
    const r = Math.floor(idx / 36);
    const g = Math.floor((idx % 36) / 6);
    const b = idx % 6;
    const toHex = (v: number) => (v === 0 ? 0 : 55 + v * 40).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  // Grayscale ramp 232-255
  const level = 8 + (n - 232) * 10;
  const hex = level.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

function weechatColor(n: number): string {
  if (n < 16) return WEECHAT_BASIC_COLORS[n] ?? '#ffffff';
  return xterm256Color(n);
}

interface FormatState {
  fg: string | undefined;
  bg: string | undefined;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  reverse: boolean;
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function parseAttribute(ch: string, state: FormatState, set: boolean): void {
  switch (ch) {
    case '*':
      state.bold = set;
      break;
    case '!':
      state.reverse = set;
      break;
    case '/':
      state.italic = set;
      break;
    case '_':
      state.underline = set;
      break;
  }
}

function readAttributes(text: string, pos: number, state: FormatState, set: boolean): number {
  while (pos < text.length) {
    const ch = text[pos];
    if (ch === '*' || ch === '!' || ch === '/' || ch === '_') {
      parseAttribute(ch, state, set);
      pos++;
    } else {
      break;
    }
  }
  return pos;
}

function readColorNumber(text: string, pos: number): [number, number] {
  // Skip the '|' (keep attributes) marker
  if (pos < text.length && text[pos] === '|') {
    pos++;
  }
  // Read up to 5 digits for extended color, or 2 for basic
  let numStr = '';
  // Check for extended color prefix '@'
  if (pos < text.length && text[pos] === '@') {
    pos++;
    // Read 5-digit extended color number
    while (pos < text.length && isDigit(text[pos]) && numStr.length < 5) {
      numStr += text[pos];
      pos++;
    }
  } else {
    // Read up to 2-digit basic color number
    while (pos < text.length && isDigit(text[pos]) && numStr.length < 2) {
      numStr += text[pos];
      pos++;
    }
  }
  const num = numStr.length > 0 ? parseInt(numStr, 10) : -1;
  return [num, pos];
}

function parseWeechatColorSequence(text: string, pos: number, state: FormatState): number {
  if (pos >= text.length) return pos;

  const ch = text[pos];

  if (ch === 'F' || ch === '*') {
    // Foreground (F) or foreground with attributes (*)
    pos++;
    if (ch === '*') {
      pos = readAttributes(text, pos, state, true);
    }
    const [colorNum, newPos] = readColorNumber(text, pos);
    if (colorNum >= 0) state.fg = weechatColor(colorNum);
    return newPos;
  }

  if (ch === 'B') {
    // Background only
    pos++;
    const [colorNum, newPos] = readColorNumber(text, pos);
    if (colorNum >= 0) state.bg = weechatColor(colorNum);
    return newPos;
  }

  if (ch === '@') {
    // Explicit: attributes + foreground,background
    pos++;
    pos = readAttributes(text, pos, state, true);
    const [fgNum, pos2] = readColorNumber(text, pos);
    if (fgNum >= 0) state.fg = weechatColor(fgNum);
    pos = pos2;
    if (pos < text.length && text[pos] === '~') {
      pos++;
      const [bgNum, pos3] = readColorNumber(text, pos);
      if (bgNum >= 0) state.bg = weechatColor(bgNum);
      return pos3;
    }
    return pos;
  }

  // Bare color number for foreground (e.g., "05" means fg=5)
  if (isDigit(ch)) {
    const [colorNum, newPos] = readColorNumber(text, pos);
    if (colorNum >= 0) state.fg = weechatColor(colorNum);
    // Check for ~bg
    if (newPos < text.length && text[newPos] === '~') {
      const [bgNum, pos2] = readColorNumber(text, newPos + 1);
      if (bgNum >= 0) state.bg = weechatColor(bgNum);
      return pos2;
    }
    return newPos;
  }

  // Bar color codes - skip them
  if (ch === 'b') {
    // bar_fg, bar_delim, bar_bg, etc.
    pos++;
    if (pos < text.length) {
      const next = text[pos];
      if (
        next === 'F' ||
        next === 'D' ||
        next === 'B' ||
        next === '_' ||
        next === '-' ||
        next === '#' ||
        next === 'i'
      ) {
        pos++;
      }
    }
    return pos;
  }

  // Emphasis
  if (ch === 'E') {
    pos++;
    return pos;
  }

  // Reset
  if (ch === (0x1c).toString() || text.charCodeAt(pos) === 0x1c) {
    state.fg = undefined;
    state.bg = undefined;
    state.bold = false;
    state.italic = false;
    state.underline = false;
    state.strikethrough = false;
    state.reverse = false;
    return pos + 1;
  }

  return pos;
}

function parseIrcColorSequence(text: string, pos: number, state: FormatState): number {
  // After 0x03: optional fg[,bg] where each is 1-2 digits
  let fgStr = '';
  while (pos < text.length && isDigit(text[pos]) && fgStr.length < 2) {
    fgStr += text[pos];
    pos++;
  }
  if (fgStr.length > 0) {
    const fgNum = parseInt(fgStr, 10);
    if (fgNum >= 0 && fgNum <= 15) {
      state.fg = IRC_COLORS[fgNum];
    }
  }
  if (pos < text.length && text[pos] === ',') {
    pos++;
    let bgStr = '';
    while (pos < text.length && isDigit(text[pos]) && bgStr.length < 2) {
      bgStr += text[pos];
      pos++;
    }
    if (bgStr.length > 0) {
      const bgNum = parseInt(bgStr, 10);
      if (bgNum >= 0 && bgNum <= 15) {
        state.bg = IRC_COLORS[bgNum];
      }
    }
  }
  return pos;
}

export function parseColors(text: string): FormattedSegment[] {
  const segments: FormattedSegment[] = [];
  const state: FormatState = {
    fg: undefined,
    bg: undefined,
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    reverse: false,
  };
  let currentText = '';

  function flush() {
    if (currentText) {
      const segment: FormattedSegment = { text: currentText };
      if (state.fg) segment.fgColor = state.fg;
      if (state.bg) segment.bgColor = state.bg;
      if (state.bold) segment.bold = true;
      if (state.italic) segment.italic = true;
      if (state.underline) segment.underline = true;
      if (state.strikethrough) segment.strikethrough = true;
      if (state.reverse) segment.reverse = true;
      segments.push(segment);
      currentText = '';
    }
  }

  let i = 0;
  while (i < text.length) {
    const ch = text.charCodeAt(i);

    // WeeChat color code (0x19)
    if (ch === 0x19) {
      flush();
      i++;
      i = parseWeechatColorSequence(text, i, state);
      continue;
    }

    // WeeChat set attribute (0x1A)
    if (ch === 0x1a) {
      flush();
      i++;
      i = readAttributes(text, i, state, true);
      continue;
    }

    // WeeChat remove attribute (0x1B)
    if (ch === 0x1b) {
      flush();
      i++;
      i = readAttributes(text, i, state, false);
      continue;
    }

    // WeeChat reset (0x1C)
    if (ch === 0x1c) {
      flush();
      state.fg = undefined;
      state.bg = undefined;
      state.bold = false;
      state.italic = false;
      state.underline = false;
      state.strikethrough = false;
      state.reverse = false;
      i++;
      continue;
    }

    // IRC bold (0x02)
    if (ch === 0x02) {
      flush();
      state.bold = !state.bold;
      i++;
      continue;
    }

    // IRC color (0x03)
    if (ch === 0x03) {
      flush();
      i++;
      i = parseIrcColorSequence(text, i, state);
      continue;
    }

    // IRC reset (0x0F)
    if (ch === 0x0f) {
      flush();
      state.fg = undefined;
      state.bg = undefined;
      state.bold = false;
      state.italic = false;
      state.underline = false;
      state.strikethrough = false;
      state.reverse = false;
      i++;
      continue;
    }

    // IRC reverse (0x16)
    if (ch === 0x16) {
      flush();
      state.reverse = !state.reverse;
      i++;
      continue;
    }

    // IRC italic (0x1D)
    if (ch === 0x1d) {
      flush();
      state.italic = !state.italic;
      i++;
      continue;
    }

    // IRC underline (0x1F)
    if (ch === 0x1f) {
      flush();
      state.underline = !state.underline;
      i++;
      continue;
    }

    currentText += text[i];
    i++;
  }

  flush();
  return segments;
}
