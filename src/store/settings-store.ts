import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  theme: 'light' | 'dark' | 'system';
  showTimestamps: boolean;
  timestampFormat: '12h' | '24h';
  showJoinPart: boolean;
  mediaPreview: boolean;
  fontSize: number;
  showEmojis: boolean;
  savedConnection: { host: string; port: number; ssl: boolean } | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setShowTimestamps: (show: boolean) => void;
  setTimestampFormat: (format: '12h' | '24h') => void;
  setShowJoinPart: (show: boolean) => void;
  setMediaPreview: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
  setShowEmojis: (show: boolean) => void;
  setSavedConnection: (conn: { host: string; port: number; ssl: boolean }) => void;
  clearSavedConnection: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'dark',
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
    },
  ),
);
