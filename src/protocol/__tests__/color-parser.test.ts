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
  });
});
