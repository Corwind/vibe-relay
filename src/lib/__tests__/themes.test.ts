import { describe, it, expect } from 'vitest';
import {
  themes,
  THEME_VARIABLES,
  getThemeById,
  resolveTheme,
  type ThemeDefinition,
} from '../themes';

describe('themes', () => {
  it('exports at least 13 themes', () => {
    expect(themes.length).toBeGreaterThanOrEqual(13);
  });

  it('has unique theme IDs', () => {
    const ids = themes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique theme names', () => {
    const names = themes.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('includes both light and dark themes', () => {
    expect(themes.some((t) => t.isDark)).toBe(true);
    expect(themes.some((t) => !t.isDark)).toBe(true);
  });

  it('includes default-light and default-dark themes', () => {
    expect(getThemeById('default-light')).toBeDefined();
    expect(getThemeById('default-dark')).toBeDefined();
    expect(getThemeById('default-light')!.isDark).toBe(false);
    expect(getThemeById('default-dark')!.isDark).toBe(true);
  });

  describe('each theme has all required CSS variables', () => {
    themes.forEach((theme: ThemeDefinition) => {
      it(`${theme.id} defines all ${THEME_VARIABLES.length} variables`, () => {
        for (const variable of THEME_VARIABLES) {
          expect(theme.colors).toHaveProperty(variable);
          expect(theme.colors[variable]).toBeTruthy();
        }
      });
    });
  });

  describe('each theme has valid color values', () => {
    themes.forEach((theme: ThemeDefinition) => {
      it(`${theme.id} has non-empty color values`, () => {
        for (const variable of THEME_VARIABLES) {
          const value = theme.colors[variable];
          expect(typeof value).toBe('string');
          expect(value.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('each theme has valid structure', () => {
    themes.forEach((theme: ThemeDefinition) => {
      it(`${theme.id} has required properties`, () => {
        expect(typeof theme.id).toBe('string');
        expect(theme.id.length).toBeGreaterThan(0);
        expect(typeof theme.name).toBe('string');
        expect(theme.name.length).toBeGreaterThan(0);
        expect(typeof theme.isDark).toBe('boolean');
        expect(typeof theme.colors).toBe('object');
      });
    });
  });
});

describe('getThemeById', () => {
  it('returns the correct theme', () => {
    const theme = getThemeById('dracula');
    expect(theme).toBeDefined();
    expect(theme!.name).toBe('Dracula');
  });

  it('returns undefined for unknown ID', () => {
    expect(getThemeById('nonexistent')).toBeUndefined();
  });
});

describe('resolveTheme', () => {
  it('returns default-dark for system when prefers dark', () => {
    const theme = resolveTheme('system', true);
    expect(theme.id).toBe('default-dark');
  });

  it('returns default-light for system when prefers light', () => {
    const theme = resolveTheme('system', false);
    expect(theme.id).toBe('default-light');
  });

  it('returns the requested theme by ID', () => {
    const theme = resolveTheme('nord', false);
    expect(theme.id).toBe('nord');
  });

  it('falls back to default-dark for unknown ID', () => {
    const theme = resolveTheme('nonexistent', false);
    expect(theme.id).toBe('default-dark');
  });
});
