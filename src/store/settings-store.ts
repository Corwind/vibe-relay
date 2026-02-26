import { create } from 'zustand';

interface SettingsStore {
  theme: 'light' | 'dark' | 'system';
  showTimestamps: boolean;
  timestampFormat: '12h' | '24h';
  showJoinPart: boolean;
  mediaPreview: boolean;
  fontSize: number;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setShowTimestamps: (show: boolean) => void;
  setTimestampFormat: (format: '12h' | '24h') => void;
  setShowJoinPart: (show: boolean) => void;
  setMediaPreview: (enabled: boolean) => void;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  theme: 'dark',
  showTimestamps: true,
  timestampFormat: '24h',
  showJoinPart: false,
  mediaPreview: true,
  fontSize: 14,
  setTheme: (theme) => set({ theme }),
  setShowTimestamps: (showTimestamps) => set({ showTimestamps }),
  setTimestampFormat: (timestampFormat) => set({ timestampFormat }),
  setShowJoinPart: (showJoinPart) => set({ showJoinPart }),
  setMediaPreview: (mediaPreview) => set({ mediaPreview }),
  setFontSize: (fontSize) => set({ fontSize }),
}));
