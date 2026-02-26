import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settings-store';

const DARK_MQ = '(prefers-color-scheme: dark)';

export function ThemeProvider() {
  const theme = useSettingsStore((s) => s.theme);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia(DARK_MQ).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(DARK_MQ);
    const handler = (e: MediaQueryListEvent | { matches: boolean }) => {
      setSystemDark(e.matches);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const isDark =
      theme === 'dark' || (theme === 'system' && systemDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, systemDark]);

  return null;
}
