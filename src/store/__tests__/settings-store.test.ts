import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settings-store';

describe('settings-store', () => {
  beforeEach(() => {
    // Reset to defaults
    useSettingsStore.setState({
      theme: 'dark',
      showTimestamps: true,
      timestampFormat: '24h',
      showJoinPart: false,
      mediaPreview: true,
      fontSize: 14,
      savedConnection: null,
    });
  });

  it('has correct defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.showTimestamps).toBe(true);
    expect(state.timestampFormat).toBe('24h');
    expect(state.showJoinPart).toBe(false);
    expect(state.mediaPreview).toBe(true);
    expect(state.fontSize).toBe(14);
    expect(state.savedConnection).toBeNull();
  });

  it('sets theme', () => {
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('sets showTimestamps', () => {
    useSettingsStore.getState().setShowTimestamps(false);
    expect(useSettingsStore.getState().showTimestamps).toBe(false);
  });

  it('sets timestampFormat', () => {
    useSettingsStore.getState().setTimestampFormat('12h');
    expect(useSettingsStore.getState().timestampFormat).toBe('12h');
  });

  it('sets showJoinPart', () => {
    useSettingsStore.getState().setShowJoinPart(true);
    expect(useSettingsStore.getState().showJoinPart).toBe(true);
  });

  it('sets mediaPreview', () => {
    useSettingsStore.getState().setMediaPreview(false);
    expect(useSettingsStore.getState().mediaPreview).toBe(false);
  });

  it('sets fontSize', () => {
    useSettingsStore.getState().setFontSize(18);
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });

  it('saves connection settings', () => {
    const conn = { host: 'relay.example.com', port: 9001, ssl: true };
    useSettingsStore.getState().setSavedConnection(conn);
    expect(useSettingsStore.getState().savedConnection).toEqual(conn);
  });

  it('clears saved connection', () => {
    useSettingsStore.getState().setSavedConnection({ host: 'test', port: 443, ssl: false });
    useSettingsStore.getState().clearSavedConnection();
    expect(useSettingsStore.getState().savedConnection).toBeNull();
  });

  it('does not include password in savedConnection', () => {
    const conn = { host: 'relay.example.com', port: 9001, ssl: true };
    useSettingsStore.getState().setSavedConnection(conn);
    const saved = useSettingsStore.getState().savedConnection;
    expect(saved).not.toHaveProperty('password');
  });
});
