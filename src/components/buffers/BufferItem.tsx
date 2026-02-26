import { memo, useCallback } from 'react';
import type { WeechatBuffer } from '@/store/types';
import { useBufferStore } from '@/store/buffer-store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BufferItemProps {
  buffer: WeechatBuffer;
}

export const BufferItem = memo(function BufferItem({ buffer }: BufferItemProps) {
  const activeBufferId = useBufferStore((s) => s.activeBufferId);
  const setActiveBuffer = useBufferStore((s) => s.setActiveBuffer);
  const clearUnread = useBufferStore((s) => s.clearUnread);
  const isActive = activeBufferId === buffer.id;

  const handleClick = useCallback(() => {
    setActiveBuffer(buffer.id);
    clearUnread(buffer.id);
  }, [buffer.id, setActiveBuffer, clearUnread]);

  return (
    <button
      onClick={handleClick}
      data-testid="buffer-item"
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground font-medium',
      )}
    >
      <span className="truncate flex-1">{buffer.shortName || buffer.fullName}</span>

      {buffer.highlightCount > 0 && (
        <Badge
          variant="destructive"
          className="h-5 min-w-5 px-1 text-xs"
          data-testid="highlight-badge"
        >
          {buffer.highlightCount}
        </Badge>
      )}

      {buffer.highlightCount === 0 && buffer.unreadCount > 0 && (
        <Badge variant="secondary" className="h-5 min-w-5 px-1 text-xs" data-testid="unread-badge">
          {buffer.unreadCount}
        </Badge>
      )}
    </button>
  );
});
