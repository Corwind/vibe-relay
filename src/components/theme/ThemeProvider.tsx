import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { resolveTheme, THEME_VARIABLES } from '@/lib/themes';

const DARK_MQ = '(prefers-color-scheme: dark)';

export function ThemeProvider() {
  const themeId = useSettingsStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(DARK_MQ).matches);

  useEffect(() => {
    const mql = window.matchMedia(DARK_MQ);
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => {
      setSystemDark(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const theme = resolveTheme(themeId, systemDark);
    const root = document.documentElement;

    // Apply all CSS custom properties
    for (const variable of THEME_VARIABLES) {
      const value = theme.colors[variable];
      if (value) {
        root.style.setProperty(`--${variable}`, value);
      }
    }

    // Set/remove dark class for Tailwind dark variant
    if (theme.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeId, systemDark]);

  return null;
}
