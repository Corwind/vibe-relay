import { memo } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { themes } from '@/lib/themes';

function ThemeSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border border-foreground/20"
      style={{ backgroundColor: color }}
      title={label}
      aria-label={label}
    />
  );
}

function ThemePicker() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const lightThemes = themes.filter((t) => !t.isDark);
  const darkThemes = themes.filter((t) => t.isDark);

  return (
    <div className="space-y-3">
      {/* System option */}
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
          theme === 'system'
            ? 'border-primary bg-primary/10 font-medium'
            : 'border-input hover:bg-accent/50'
        }`}
        data-testid="theme-option-system"
      >
        <span className="flex-1">System</span>
        <span className="text-xs text-muted-foreground">Auto</span>
      </button>

      {/* Light themes */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Light</p>
        <div className="space-y-1">
          {lightThemes.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                theme === t.id
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-input hover:bg-accent/50'
              }`}
              data-testid={`theme-option-${t.id}`}
            >
              <span className="flex-1">{t.name}</span>
              <span className="flex gap-1">
                <ThemeSwatch color={t.colors.background} label="background" />
                <ThemeSwatch color={t.colors.primary} label="primary" />
                <ThemeSwatch color={t.colors.accent} label="accent" />
                <ThemeSwatch color={t.colors.destructive} label="destructive" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Dark themes */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Dark</p>
        <div className="space-y-1">
          {darkThemes.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                theme === t.id
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-input hover:bg-accent/50'
              }`}
              data-testid={`theme-option-${t.id}`}
            >
              <span className="flex-1">{t.name}</span>
              <span className="flex gap-1">
                <ThemeSwatch color={t.colors.background} label="background" />
                <ThemeSwatch color={t.colors.primary} label="primary" />
                <ThemeSwatch color={t.colors.accent} label="accent" />
                <ThemeSwatch color={t.colors.destructive} label="destructive" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SettingsForm = memo(function SettingsForm() {
  const showTimestamps = useSettingsStore((s) => s.showTimestamps);
  const timestampFormat = useSettingsStore((s) => s.timestampFormat);
  const showJoinPart = useSettingsStore((s) => s.showJoinPart);
  const mediaPreview = useSettingsStore((s) => s.mediaPreview);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setShowTimestamps = useSettingsStore((s) => s.setShowTimestamps);
  const setTimestampFormat = useSettingsStore((s) => s.setTimestampFormat);
  const setShowJoinPart = useSettingsStore((s) => s.setShowJoinPart);
  const setMediaPreview = useSettingsStore((s) => s.setMediaPreview);
  const showEmojis = useSettingsStore((s) => s.showEmojis);
  const setFontSize = useSettingsStore((s) => s.setFontSize);
  const setShowEmojis = useSettingsStore((s) => s.setShowEmojis);
  const savedConnection = useSettingsStore((s) => s.savedConnection);
  const clearSavedConnection = useSettingsStore((s) => s.clearSavedConnection);

  return (
    <div className="space-y-6" data-testid="settings-form">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Theme</h3>
        <ThemePicker />
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="fontSize" className="text-sm">
            Font size
          </label>
          <input
            id="fontSize"
            type="number"
            min="10"
            max="24"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
            className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Messages</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="showTimestamps" className="text-sm">
            Show timestamps
          </label>
          <input
            id="showTimestamps"
            type="checkbox"
            checked={showTimestamps}
            onChange={(e) => setShowTimestamps(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
        </div>
        {showTimestamps && (
          <div className="flex items-center justify-between">
            <label htmlFor="timestampFormat" className="text-sm">
              Time format
            </label>
            <select
              id="timestampFormat"
              value={timestampFormat}
              onChange={(e) => setTimestampFormat(e.target.value as '12h' | '24h')}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        )}
        <div className="flex items-center justify-between">
          <label htmlFor="showJoinPart" className="text-sm">
            Show join/part messages
          </label>
          <input
            id="showJoinPart"
            type="checkbox"
            checked={showJoinPart}
            onChange={(e) => setShowJoinPart(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="mediaPreview" className="text-sm">
            Media previews
          </label>
          <input
            id="mediaPreview"
            type="checkbox"
            checked={mediaPreview}
            onChange={(e) => setMediaPreview(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="showEmojis" className="text-sm">
            Emoji shortcodes
          </label>
          <input
            id="showEmojis"
            type="checkbox"
            checked={showEmojis}
            onChange={(e) => setShowEmojis(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
        </div>
      </div>

      {savedConnection && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Connection</h3>
            <p className="text-xs text-muted-foreground">
              Saved: {savedConnection.host}:{savedConnection.port} ({savedConnection.ssl ? 'SSL' : 'plain'})
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSavedConnection}
              data-testid="clear-saved-connection"
            >
              Clear saved connection
            </Button>
          </div>
        </>
      )}
    </div>
  );
});
