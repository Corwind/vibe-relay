import { useCallback, useRef, memo } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { useMessages } from '@/hooks/use-messages';
import { MessageItem } from './MessageItem';
import { DayDivider } from './DayDivider';
import type { WeechatMessage } from '@/store/types';

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

export const MessageList = memo(function MessageList() {
  const messages = useMessages();
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const items = buildItems(messages);

  const renderItem = useCallback((_index: number, item: ListItem) => {
    if (item.type === 'divider') {
      return <DayDivider date={item.date} />;
    }
    return <MessageItem message={item.message} />;
  }, []);

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
      itemContent={renderItem}
      followOutput="smooth"
      alignToBottom
      className="h-full"
      increaseViewportBy={{ top: 200, bottom: 200 }}
    />
  );
});
