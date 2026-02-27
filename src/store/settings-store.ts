import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  theme: string;
  showTimestamps: boolean;
  timestampFormat: '12h' | '24h';
  showJoinPart: boolean;
  mediaPreview: boolean;
  fontSize: number;
  showEmojis: boolean;
  savedConnection: { host: string; port: number; ssl: boolean } | null;
  setTheme: (theme: string) => void;
  setShowTimestamps: (show: boolean) => void;
  setTimestampFormat: (format: '12h' | '24h') => void;
  setShowJoinPart: (show: boolean) => void;
  setMediaPreview: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
  setShowEmojis: (show: boolean) => void;
  setSavedConnection: (conn: { host: string; port: number; ssl: boolean }) => void;
  clearSavedConnection: () => void;
}

/**
 * Migrate old theme values ('light', 'dark') to new theme IDs.
 * 'system' is kept as-is since the ThemeProvider handles it.
 */
export function migrateThemeValue(value: string): string {
  if (value === 'light') return 'default-light';
  if (value === 'dark') return 'default-dark';
  return value;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'default-dark',
      showTimestamps: true,
      timestampFormat: '24h',
      showJoinPart: false,
      mediaPreview: true,
      fontSize: 14,
      showEmojis: true,
      savedConnection: null,
      setTheme: (theme) => set({ theme }),
      setShowTimestamps: (showTimestamps) => set({ showTimestamps }),
      setTimestampFormat: (timestampFormat) => set({ timestampFormat }),
      setShowJoinPart: (showJoinPart) => set({ showJoinPart }),
      setMediaPreview: (mediaPreview) => set({ mediaPreview }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowEmojis: (showEmojis) => set({ showEmojis }),
      setSavedConnection: (savedConnection) => set({ savedConnection }),
      clearSavedConnection: () => set({ savedConnection: null }),
    }),
    {
      name: 'relay-settings',
      migrate: (persisted) => {
        const state = persisted as Record<string, unknown>;
        if (state && typeof state.theme === 'string') {
          state.theme = migrateThemeValue(state.theme);
        }
        return state as unknown as SettingsStore;
      },
      version: 1,
    },
  ),
);
