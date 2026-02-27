import { memo } from 'react';
import type { WeechatMessage } from '@/store/types';
import { FormattedText } from './FormattedText';
import { MediaEmbed } from './MediaEmbed';
import { useMediaEmbed } from '@/hooks/use-media-embed';
import { useSettingsStore } from '@/store/settings-store';
import { cn } from '@/lib/utils';
import { nickColor } from '@/lib/nick-color';

interface MessageItemProps {
  message: WeechatMessage;
}

function formatTimestamp(date: Date, format: '12h' | '24h'): string {
  if (format === '12h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
  const showTimestamps = useSettingsStore((s) => s.showTimestamps);
  const timestampFormat = useSettingsStore((s) => s.timestampFormat);
  const media = useMediaEmbed(message.message);

  const isAction = message.tags.includes('irc_action') || message.message.startsWith('\x01ACTION');

  return (
    <div
      className={cn(
        'group flex gap-2 px-4 py-0.5 hover:bg-accent/50 leading-relaxed',
        message.highlight && 'bg-yellow-500/10 border-l-2 border-yellow-500',
      )}
      data-testid="message-item"
    >
      {showTimestamps && (
        <span className="text-xs text-muted-foreground shrink-0 pt-0.5 select-none tabular-nums">
          {formatTimestamp(message.date, timestampFormat)}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <span className="inline">
          {isAction ? (
            <span className="italic text-muted-foreground">
              *{' '}
              {message.prefixSpans ? <FormattedText spans={message.prefixSpans} /> : message.prefix}{' '}
              {message.spans ? <FormattedText spans={message.spans} /> : message.message}
            </span>
          ) : (
            <>
              <span
                className="font-medium"
                data-testid="message-nick"
                style={{ color: nickColor(message.prefix) }}
              >
                {message.prefixSpans ? (
                  <FormattedText spans={message.prefixSpans} />
                ) : (
                  message.prefix
                )}
              </span>
              {message.prefix && <span className="text-muted-foreground mx-1">|</span>}
              <span data-testid="message-body">
                {message.spans ? <FormattedText spans={message.spans} /> : message.message}
              </span>
            </>
          )}
        </span>

        {media.map((m, i) => (
          <MediaEmbed key={i} media={m} />
        ))}
      </div>
    </div>
  );
});
