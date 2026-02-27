import { useCallback, useRef, useMemo, memo } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useMessages } from '@/hooks/use-messages';
import { useHistoryState } from '@/hooks/use-history-state';
import { MessageItem } from './MessageItem';
import { DayDivider } from './DayDivider';
import { Loader2 } from 'lucide-react';
import type { WeechatMessage } from '@/store/types';

/**
 * Large initial value for Virtuoso's firstItemIndex.
 * When items are prepended, we decrease this value so Virtuoso
 * maintains the user's scroll position correctly.
 */
const FIRST_ITEM_INDEX_BASE = 100_000;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type ListItem = { type: 'divider'; date: Date } | { type: 'message'; message: WeechatMessage };

function buildItems(messages: WeechatMessage[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDate: Date | null = null;

  for (const msg of messages) {
    if (!lastDate || !isSameDay(lastDate, msg.date)) {
      items.push({ type: 'divider', date: msg.date });
      lastDate = msg.date;
    }
    items.push({ type: 'message', message: msg });
  }

  return items;
}

function HistoryHeader({ loadingOlder, hasMoreMessages }: { loadingOlder: boolean; hasMoreMessages: boolean }) {
  if (loadingOlder) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground" data-testid="loading-older">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading older messages...
      </div>
    );
  }

  if (!hasMoreMessages) {
    return (
      <div className="flex items-center gap-2 py-3 px-4" data-testid="history-start">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">Beginning of conversation</span>
        <div className="flex-1 border-t border-border" />
      </div>
    );
  }

  return null;
}

interface MessageListProps {
  onStartReached?: () => void;
}

export const MessageList = memo(function MessageList({ onStartReached }: MessageListProps) {
  const messages = useMessages();
  const { loadingOlder, hasMoreMessages } = useHistoryState();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const items = useMemo(() => buildItems(messages), [messages]);

  // Shift firstItemIndex down as items grow so Virtuoso keeps scroll position
  // when messages are prepended at the top.
  const firstItemIndex = Math.max(0, FIRST_ITEM_INDEX_BASE - items.length);

  const renderItem = useCallback((_index: number, item: ListItem) => {
    if (item.type === 'divider') {
      return <DayDivider date={item.date} />;
    }
    return <MessageItem message={item.message} />;
  }, []);

  const Header = useCallback(() => (
    <HistoryHeader loadingOlder={loadingOlder} hasMoreMessages={hasMoreMessages} />
  ), [loadingOlder, hasMoreMessages]);

  // Use atTopStateChange for reliable scroll-to-top detection.
  // startReached can miss re-fires after prepending items with alignToBottom.
  const handleAtTopStateChange = useCallback((atTop: boolean) => {
    if (atTop) {
      onStartReached?.();
    }
  }, [onStartReached]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No messages yet
      </div>
    );
  }

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={items}
      firstItemIndex={firstItemIndex}
      initialTopMostItemIndex={items.length - 1}
      itemContent={renderItem}
      atTopStateChange={handleAtTopStateChange}
      components={{ Header }}
      followOutput="smooth"
      alignToBottom
      className="h-full"
      increaseViewportBy={{ top: 200, bottom: 200 }}
    />
  );
});
