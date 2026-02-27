import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useSettingsStore } from '@/store/settings-store';
import { getThemeById, THEME_VARIABLES } from '@/lib/themes';

describe('ThemeProvider', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void>;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    // Clear all inline styles
    for (const variable of THEME_VARIABLES) {
      document.documentElement.style.removeProperty(`--${variable}`);
    }
    matchMediaListeners = [];
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
          matchMediaListeners.push(cb);
        },
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    // Reset store to defaults
    useSettingsStore.setState({ theme: 'default-dark' });
  });

  it('adds dark class when theme is a dark theme', () => {
    render(<ThemeProvider />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when theme is a light theme', () => {
    useSettingsStore.setState({ theme: 'default-light' });
    render(<ThemeProvider />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('follows system preference when theme is system', () => {
    useSettingsStore.setState({ theme: 'system' });
    render(<ThemeProvider />);
    // matchMedia mock returns matches=false (light), so no dark class
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reacts to system preference changes', () => {
    useSettingsStore.setState({ theme: 'system' });
    render(<ThemeProvider />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Simulate system going dark
    act(() => {
      matchMediaListeners.forEach((cb) => cb({ matches: true }));
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('updates when store theme changes', () => {
    render(<ThemeProvider />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      useSettingsStore.setState({ theme: 'default-light' });
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies CSS custom properties for default-dark', () => {
    render(<ThemeProvider />);
    const theme = getThemeById('default-dark')!;
    const root = document.documentElement;

    expect(root.style.getPropertyValue('--background')).toBe(theme.colors.background);
    expect(root.style.getPropertyValue('--foreground')).toBe(theme.colors.foreground);
    expect(root.style.getPropertyValue('--primary')).toBe(theme.colors.primary);
  });

  it('applies CSS custom properties for a named theme', () => {
    useSettingsStore.setState({ theme: 'dracula' });
    render(<ThemeProvider />);
    const theme = getThemeById('dracula')!;
    const root = document.documentElement;

    expect(root.style.getPropertyValue('--background')).toBe(theme.colors.background);
    expect(root.style.getPropertyValue('--primary')).toBe(theme.colors.primary);
    expect(root.style.getPropertyValue('--destructive')).toBe(theme.colors.destructive);
  });

  it('sets all THEME_VARIABLES on the root element', () => {
    useSettingsStore.setState({ theme: 'nord' });
    render(<ThemeProvider />);
    const root = document.documentElement;

    for (const variable of THEME_VARIABLES) {
      expect(root.style.getPropertyValue(`--${variable}`)).toBeTruthy();
    }
  });

  it('falls back to default-dark for unknown theme', () => {
    useSettingsStore.setState({ theme: 'nonexistent' });
    render(<ThemeProvider />);
    const theme = getThemeById('default-dark')!;
    const root = document.documentElement;

    expect(root.style.getPropertyValue('--background')).toBe(theme.colors.background);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
