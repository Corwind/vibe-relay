import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, migrateThemeValue } from '../settings-store';

describe('settings-store', () => {
  beforeEach(() => {
    // Reset to defaults
    useSettingsStore.setState({
      theme: 'default-dark',
      showTimestamps: true,
      timestampFormat: '24h',
      showJoinPart: false,
      mediaPreview: true,
      fontSize: 14,
      showEmojis: true,
      savedConnection: null,
    });
  });

  it('has correct defaults', () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe('default-dark');
    expect(state.showTimestamps).toBe(true);
    expect(state.timestampFormat).toBe('24h');
    expect(state.showJoinPart).toBe(false);
    expect(state.mediaPreview).toBe(true);
    expect(state.fontSize).toBe(14);
    expect(state.showEmojis).toBe(true);
    expect(state.savedConnection).toBeNull();
  });

  it('sets theme to a named theme', () => {
    useSettingsStore.getState().setTheme('dracula');
    expect(useSettingsStore.getState().theme).toBe('dracula');
  });

  it('sets theme to system', () => {
    useSettingsStore.getState().setTheme('system');
    expect(useSettingsStore.getState().theme).toBe('system');
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

  it('sets showEmojis', () => {
    useSettingsStore.getState().setShowEmojis(false);
    expect(useSettingsStore.getState().showEmojis).toBe(false);
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

describe('migrateThemeValue', () => {
  it('migrates "light" to "default-light"', () => {
    expect(migrateThemeValue('light')).toBe('default-light');
  });

  it('migrates "dark" to "default-dark"', () => {
    expect(migrateThemeValue('dark')).toBe('default-dark');
  });

  it('preserves "system"', () => {
    expect(migrateThemeValue('system')).toBe('system');
  });

  it('preserves new theme IDs', () => {
    expect(migrateThemeValue('dracula')).toBe('dracula');
    expect(migrateThemeValue('nord')).toBe('nord');
    expect(migrateThemeValue('default-dark')).toBe('default-dark');
  });
});
