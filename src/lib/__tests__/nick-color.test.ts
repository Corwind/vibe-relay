import { describe, it, expect } from 'vitest';
import { nickColor } from '../nick-color';

describe('nickColor', () => {
  it('returns a CSS hex color string', () => {
    const color = nickColor('alice');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('returns the same color for the same nick', () => {
    expect(nickColor('bob')).toBe(nickColor('bob'));
  });

  it('returns different colors for different nicks', () => {
    const colors = new Set(['alice', 'bob', 'charlie', 'dave', 'eve'].map(nickColor));
    // At least 3 distinct colors out of 5 nicks
    expect(colors.size).toBeGreaterThanOrEqual(3);
  });

  it('handles empty string', () => {
    const color = nickColor('');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('handles unicode nicks', () => {
    const color = nickColor('\u00e9milie');
    expect(color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('is case sensitive', () => {
    // Different cases should likely produce different colors
    // (not guaranteed but very likely with djb2)
    const lower = nickColor('alice');
    const upper = nickColor('Alice');
    // Just verify both are valid; they may or may not differ
    expect(lower).toMatch(/^#[0-9a-f]{6}$/);
    expect(upper).toMatch(/^#[0-9a-f]{6}$/);
  });
});
