import { describe, it, expect } from 'vitest';
import {
  resolveEmojis,
  splitTextWithEmojis,
  EMOJI_SHORTCODES,
  EMOJI_CATEGORIES,
} from '../emoji';

describe('resolveEmojis', () => {
  it('replaces known shortcodes with unicode', () => {
    expect(resolveEmojis(':smile:')).toBe('\u{1F604}');
    expect(resolveEmojis(':thumbsup:')).toBe('\u{1F44D}');
    expect(resolveEmojis(':heart:')).toBe('\u{2764}\u{FE0F}');
  });

  it('leaves unknown shortcodes as-is', () => {
    expect(resolveEmojis(':notarealshortcode:')).toBe(':notarealshortcode:');
  });

  it('handles mixed text and shortcodes', () => {
    expect(resolveEmojis('hello :smile: world')).toBe('hello \u{1F604} world');
  });

  it('handles multiple shortcodes', () => {
    expect(resolveEmojis(':smile: and :heart:')).toBe(
      '\u{1F604} and \u{2764}\u{FE0F}',
    );
  });

  it('does not match colons inside URLs', () => {
    const url = 'http://example.com:8080/path';
    expect(resolveEmojis(url)).toBe(url);
  });

  it('does not match colons in https URLs', () => {
    const url = 'https://host:443/path';
    expect(resolveEmojis(url)).toBe(url);
  });

  it('handles shortcodes adjacent to URLs', () => {
    expect(resolveEmojis(':smile: http://example.com:8080/path :heart:')).toBe(
      '\u{1F604} http://example.com:8080/path \u{2764}\u{FE0F}',
    );
  });

  it('returns empty string for empty input', () => {
    expect(resolveEmojis('')).toBe('');
  });

  it('returns text unchanged when no shortcodes present', () => {
    expect(resolveEmojis('just some text')).toBe('just some text');
  });

  it('handles shortcodes at start and end of text', () => {
    expect(resolveEmojis(':smile:text:heart:')).toBe(
      '\u{1F604}text\u{2764}\u{FE0F}',
    );
  });

  it('handles plus shortcodes like :+1:', () => {
    expect(resolveEmojis(':+1:')).toBe('\u{1F44D}');
  });

  it('handles shortcodes with underscores', () => {
    expect(resolveEmojis(':stuck_out_tongue:')).toBe('\u{1F61B}');
  });

  it('handles shortcodes with hyphens', () => {
    expect(resolveEmojis(':t-rex:')).toBe('\u{1F996}');
  });
});

describe('splitTextWithEmojis', () => {
  it('returns single text segment for plain text', () => {
    const segments = splitTextWithEmojis('hello world');
    expect(segments).toEqual([{ type: 'text', content: 'hello world' }]);
  });

  it('splits text and unicode emojis', () => {
    const segments = splitTextWithEmojis('hello \u{1F604} world');
    expect(segments).toEqual([
      { type: 'text', content: 'hello ' },
      { type: 'emoji', content: '\u{1F604}' },
      { type: 'text', content: ' world' },
    ]);
  });

  it('handles consecutive emojis', () => {
    const segments = splitTextWithEmojis('\u{1F604}\u{2764}\u{FE0F}');
    expect(segments).toEqual([
      { type: 'emoji', content: '\u{1F604}' },
      { type: 'emoji', content: '\u{2764}\u{FE0F}' },
    ]);
  });

  it('returns empty array for empty input', () => {
    const segments = splitTextWithEmojis('');
    expect(segments).toEqual([]);
  });

  it('handles text with no emojis', () => {
    const segments = splitTextWithEmojis('no emojis here');
    expect(segments).toEqual([{ type: 'text', content: 'no emojis here' }]);
  });

  it('handles emoji at start', () => {
    const segments = splitTextWithEmojis('\u{1F604} start');
    expect(segments).toEqual([
      { type: 'emoji', content: '\u{1F604}' },
      { type: 'text', content: ' start' },
    ]);
  });

  it('handles emoji at end', () => {
    const segments = splitTextWithEmojis('end \u{1F604}');
    expect(segments).toEqual([
      { type: 'text', content: 'end ' },
      { type: 'emoji', content: '\u{1F604}' },
    ]);
  });
});

describe('EMOJI_SHORTCODES', () => {
  it('contains common emoji shortcodes', () => {
    expect(EMOJI_SHORTCODES.get('smile')).toBeDefined();
    expect(EMOJI_SHORTCODES.get('heart')).toBeDefined();
    expect(EMOJI_SHORTCODES.get('thumbsup')).toBeDefined();
    expect(EMOJI_SHORTCODES.get('+1')).toBeDefined();
    expect(EMOJI_SHORTCODES.get('fire')).toBeDefined();
    expect(EMOJI_SHORTCODES.get('rocket')).toBeDefined();
  });

  it('has at least 200 entries', () => {
    expect(EMOJI_SHORTCODES.size).toBeGreaterThanOrEqual(200);
  });
});

describe('EMOJI_CATEGORIES', () => {
  it('has expected category names', () => {
    const names = EMOJI_CATEGORIES.map((c) => c.name);
    expect(names).toContain('Smileys');
    expect(names).toContain('People');
    expect(names).toContain('Nature');
    expect(names).toContain('Food');
    expect(names).toContain('Activities');
    expect(names).toContain('Travel');
    expect(names).toContain('Objects');
    expect(names).toContain('Symbols');
  });

  it('has emojis in each category', () => {
    for (const cat of EMOJI_CATEGORIES) {
      expect(cat.emojis.length).toBeGreaterThan(0);
    }
  });
});
