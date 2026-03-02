import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { themes, getThemeById, type ThemeDefinition } from '@/lib/themes';

const SWATCH_KEYS = ['background', 'primary', 'accent', 'destructive'] as const;

function ThemeSwatches({ theme }: { theme: ThemeDefinition }) {
  return (
    <span className="inline-flex gap-1">
      {SWATCH_KEYS.map((key) => (
        <span
          key={key}
          data-testid="theme-swatch-dot"
          className="inline-block h-3 w-3 rounded-full border border-foreground/20"
          style={{ backgroundColor: theme.colors[key] }}
        />
      ))}
    </span>
  );
}

function ThemePicker() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const lightThemes = themes.filter((t) => !t.isDark);
  const darkThemes = themes.filter((t) => t.isDark);

  const currentTheme = getThemeById(theme);
  const displayName = theme === 'system' ? 'System (Auto)' : (currentTheme?.name ?? theme);

  const handleSelect = useCallback(
    (id: string) => {
      setTheme(id);
      setOpen(false);
    },
    [setTheme],
  );

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm">Theme</label>
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          data-testid="theme-select"
          className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1 text-sm hover:bg-accent/50 transition-colors"
        >
          {currentTheme && <ThemeSwatches theme={currentTheme} />}
          <span>{displayName}</span>
          <svg className="h-3 w-3 opacity-60" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 5l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div
            data-testid="theme-dropdown"
            className="absolute right-0 top-full z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-input bg-popover p-1 shadow-md"
          >
            <button
              type="button"
              onClick={() => handleSelect('system')}
              data-testid="theme-option-system"
              data-selected={theme === 'system'}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                theme === 'system' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              System (Auto)
            </button>

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Light</div>
            {lightThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                data-testid={`theme-option-${t.id}`}
                data-selected={theme === t.id}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                  theme === t.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                }`}
              >
                <ThemeSwatches theme={t} />
                <span>{t.name}</span>
              </button>
            ))}

            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Dark</div>
            {darkThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id)}
                data-testid={`theme-option-${t.id}`}
                data-selected={theme === t.id}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                  theme === t.id ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                }`}
              >
                <ThemeSwatches theme={t} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        )}
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
              Saved: {savedConnection.host}:{savedConnection.port} (
              {savedConnection.ssl ? 'SSL' : 'plain'})
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
