import { describe, it, expect } from 'vitest';
import { parseColors } from '../color-parser';

describe('parseColors', () => {
  it('returns plain text as single segment', () => {
    const segments = parseColors('hello world');
    expect(segments).toEqual([{ text: 'hello world' }]);
  });

  it('returns empty array for empty string', () => {
    const segments = parseColors('');
    expect(segments).toEqual([]);
  });

  describe('IRC format codes', () => {
    it('handles IRC bold toggle (0x02)', () => {
      const text = 'normal \x02bold\x02 normal';
      const segments = parseColors(text);
      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ text: 'normal ' });
      expect(segments[1]).toEqual({ text: 'bold', bold: true });
      expect(segments[2]).toEqual({ text: ' normal' });
    });

    it('handles IRC italic toggle (0x1D)', () => {
      const text = 'normal \x1Ditalic\x1D end';
      const segments = parseColors(text);
      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ text: 'normal ' });
      expect(segments[1]).toEqual({ text: 'italic', italic: true });
      expect(segments[2]).toEqual({ text: ' end' });
    });

    it('handles IRC underline toggle (0x1F)', () => {
      const text = '\x1Funderlined\x1F';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({ text: 'underlined', underline: true });
    });

    it('handles IRC reverse toggle (0x16)', () => {
      const text = '\x16reversed\x16';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({ text: 'reversed', reverse: true });
    });

    it('handles IRC color (0x03) with fg', () => {
      const text = '\x034red text';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('red text');
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles IRC color (0x03) with fg and bg', () => {
      const text = '\x034,2colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('colored');
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[0].bgColor).toBeDefined();
    });

    it('handles IRC color with 2-digit color numbers', () => {
      const text = '\x0312blue';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('blue');
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles IRC reset (0x0F)', () => {
      const text = '\x02bold\x0Fnormal';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'bold', bold: true });
      expect(segments[1]).toEqual({ text: 'normal' });
    });
  });

  describe('WeeChat color codes', () => {
    it('handles WeeChat foreground color with F prefix', () => {
      const text = '\x19F05colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('colored');
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles WeeChat background color with B prefix', () => {
      const text = '\x19B03background';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('background');
      expect(segments[0].bgColor).toBeDefined();
    });

    it('handles WeeChat color with * prefix (fg with attributes)', () => {
      const text = '\x19*05colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('colored');
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles WeeChat bold attribute via *', () => {
      const text = '\x19**05bold colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('bold colored');
      expect(segments[0].bold).toBe(true);
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles WeeChat reset (0x1C)', () => {
      const text = '\x19F05colored\x1Cnormal';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[0].text).toBe('colored');
      expect(segments[1]).toEqual({ text: 'normal' });
    });

    it('handles bare color number as foreground', () => {
      const text = '\x1905colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('colored');
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles foreground~background separator', () => {
      const text = '\x1905~03both';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('both');
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[0].bgColor).toBeDefined();
    });

    it('handles set attribute (0x1A)', () => {
      const text = 'before\x1A*bold';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'before' });
      expect(segments[1]).toEqual({ text: 'bold', bold: true });
    });

    it('handles remove attribute (0x1B)', () => {
      const text = '\x1A*bold\x1B*notbold';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({ text: 'bold', bold: true });
      expect(segments[1]).toEqual({ text: 'notbold' });
    });
  });

  describe('mixed codes', () => {
    it('handles mix of IRC and WeeChat codes', () => {
      const text = '\x02bold\x02 \x19F05colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(3);
      expect(segments[0]).toEqual({ text: 'bold', bold: true });
      expect(segments[1]).toEqual({ text: ' ' });
      expect(segments[2].text).toBe('colored');
      expect(segments[2].fgColor).toBeDefined();
    });

    it('preserves formatting across segments', () => {
      const text = '\x02\x19F05bold and colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('bold and colored');
      expect(segments[0].bold).toBe(true);
      expect(segments[0].fgColor).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles consecutive control codes with no text between', () => {
      const text = '\x02\x02visible';
      const segments = parseColors(text);
      // bold toggled on then off, so result should be plain
      expect(segments).toHaveLength(1);
      expect(segments[0]).toEqual({ text: 'visible' });
    });

    it('handles text that is only control codes', () => {
      const text = '\x02\x1D\x1F';
      const segments = parseColors(text);
      expect(segments).toEqual([]);
    });

    it('handles color code at end of string (truncated WeeChat color)', () => {
      // 0x19 at the end with no subsequent color data
      const text = 'hello\x19';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('hello');
    });

    it('handles WeeChat color F with no digits following', () => {
      const text = 'before\x19Fafter';
      const segments = parseColors(text);
      // F reads no color number, text resumes
      const allText = segments.map((s) => s.text).join('');
      expect(allText).toContain('before');
    });

    it('handles nested WeeChat color codes (color within color)', () => {
      // Set fg=5 then change fg=12
      const text = '\x19F05first\x19F12second';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('first');
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[1].text).toBe('second');
      expect(segments[1].fgColor).toBeDefined();
      // Colors should be different
      expect(segments[0].fgColor).not.toBe(segments[1].fgColor);
    });

    it('handles IRC color code with no digits (bare 0x03)', () => {
      // Bare 0x03 should just reset colors
      const text = '\x034red\x03plain';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[1].text).toBe('plain');
    });

    it('handles all IRC color codes 0-15', () => {
      for (let i = 0; i <= 15; i++) {
        const code = i < 10 ? `\x030${i}` : `\x03${i}`;
        const text = `${code}text`;
        const segments = parseColors(text);
        expect(segments).toHaveLength(1);
        expect(segments[0].text).toBe('text');
        expect(segments[0].fgColor).toBeDefined();
      }
    });

    it('handles WeeChat extended color (@NNN)', () => {
      // Extended color: @ prefix followed by up to 5 digits
      const text = '\x19F@00100colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('colored');
      expect(segments[0].fgColor).toBeDefined();
    });

    it('handles multiple attribute toggles', () => {
      // bold + italic + underline simultaneously
      const text = '\x1A*\x1A/\x1A_styled\x1C';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('styled');
      expect(segments[0].bold).toBe(true);
      expect(segments[0].italic).toBe(true);
      expect(segments[0].underline).toBe(true);
    });

    it('handles WeeChat reset (0x1C) clearing all formatting', () => {
      const text = '\x02\x1D\x19F05styled\x1Cplain';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe('styled');
      expect(segments[0].bold).toBe(true);
      expect(segments[0].italic).toBe(true);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[1]).toEqual({ text: 'plain' });
    });

    it('handles IRC reset (0x0F) clearing all formatting', () => {
      const text = '\x02\x1D\x034bold italic red\x0Fplain';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].bold).toBe(true);
      expect(segments[0].italic).toBe(true);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[1]).toEqual({ text: 'plain' });
    });

    it('handles string with only WeeChat reset code', () => {
      const segments = parseColors('\x1C');
      expect(segments).toEqual([]);
    });

    it('handles string with only IRC reset code', () => {
      const segments = parseColors('\x0F');
      expect(segments).toEqual([]);
    });

    it('handles WeeChat fg~bg with extended colors', () => {
      const text = '\x1905~03both colors';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('both colors');
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[0].bgColor).toBeDefined();
    });

    it('handles IRC color with fg,bg where bg is 2 digits', () => {
      const text = '\x034,12colored';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[0].bgColor).toBeDefined();
    });

    it('preserves attributes when color changes', () => {
      // Set bold, then change color - bold should persist
      const text = '\x02\x19F05bold and colored\x19F12still bold new color';
      const segments = parseColors(text);
      expect(segments).toHaveLength(2);
      expect(segments[0].bold).toBe(true);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[1].bold).toBe(true);
      expect(segments[1].fgColor).toBeDefined();
      expect(segments[0].fgColor).not.toBe(segments[1].fgColor);
    });

    it('handles mixed WeeChat and IRC color codes in same string', () => {
      const text = '\x034irc red\x1Creset\x19F12wc blue';
      const segments = parseColors(text);
      expect(segments).toHaveLength(3);
      expect(segments[0].fgColor).toBeDefined();
      expect(segments[0].text).toBe('irc red');
      expect(segments[1]).toEqual({ text: 'reset' });
      expect(segments[2].fgColor).toBeDefined();
      expect(segments[2].text).toBe('wc blue');
    });

    it('handles WeeChat bar color code (bF, bB, etc)', () => {
      // Bar color codes should be skipped without producing text
      const text = 'before\x19bFafter';
      const segments = parseColors(text);
      const allText = segments.map((s) => s.text).join('');
      expect(allText).toBe('beforeafter');
    });

    it('handles WeeChat emphasis code (E)', () => {
      const text = 'before\x19Eafter';
      const segments = parseColors(text);
      const allText = segments.map((s) => s.text).join('');
      expect(allText).toBe('beforeafter');
    });

    it('handles rapid format toggles without text between', () => {
      // Bold on, italic on, bold off, underline on, then text
      const text = '\x02\x1D\x02\x1Fstyled';
      const segments = parseColors(text);
      expect(segments).toHaveLength(1);
      expect(segments[0].text).toBe('styled');
      // Bold toggled on then off
      expect(segments[0].bold).toBeFalsy();
      expect(segments[0].italic).toBe(true);
      expect(segments[0].underline).toBe(true);
    });
  });
});
