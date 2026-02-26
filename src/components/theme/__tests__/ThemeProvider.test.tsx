import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useSettingsStore } from '@/store/settings-store';

describe('ThemeProvider', () => {
  let matchMediaListeners: Array<(e: { matches: boolean }) => void>;

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
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
    useSettingsStore.setState({ theme: 'dark' });
  });

  it('adds dark class when theme is dark', () => {
    render(<ThemeProvider />);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when theme is light', () => {
    useSettingsStore.setState({ theme: 'light' });
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
      useSettingsStore.setState({ theme: 'light' });
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
