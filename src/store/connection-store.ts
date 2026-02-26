import { create } from 'zustand';
import type { ConnectionSettings, ConnectionState } from './types';

interface ConnectionStore {
  state: ConnectionState;
  settings: ConnectionSettings;
  error: string | null;
  setState: (state: ConnectionState) => void;
  setSettings: (settings: ConnectionSettings) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const defaultSettings: ConnectionSettings = {
  host: '',
  port: 9001,
  password: '',
  ssl: true,
};

export const useConnectionStore = create<ConnectionStore>((set) => ({
  state: 'disconnected',
  settings: defaultSettings,
  error: null,
  setState: (state) => set({ state, error: null }),
  setSettings: (settings) => set({ settings }),
  setError: (error) => set({ error, state: 'disconnected' }),
  reset: () => set({ state: 'disconnected', error: null }),
}));
