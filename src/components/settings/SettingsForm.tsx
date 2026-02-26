import { memo } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { Separator } from '@/components/ui/separator';

export const SettingsForm = memo(function SettingsForm() {
  const theme = useSettingsStore((s) => s.theme);
  const showTimestamps = useSettingsStore((s) => s.showTimestamps);
  const timestampFormat = useSettingsStore((s) => s.timestampFormat);
  const showJoinPart = useSettingsStore((s) => s.showJoinPart);
  const mediaPreview = useSettingsStore((s) => s.mediaPreview);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setShowTimestamps = useSettingsStore((s) => s.setShowTimestamps);
  const setTimestampFormat = useSettingsStore((s) => s.setTimestampFormat);
  const setShowJoinPart = useSettingsStore((s) => s.setShowJoinPart);
  const setMediaPreview = useSettingsStore((s) => s.setMediaPreview);
  const setFontSize = useSettingsStore((s) => s.setFontSize);

  return (
    <div className="space-y-6" data-testid="settings-form">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="theme" className="text-sm">
            Theme
          </label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
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
      </div>
    </div>
  );
});
