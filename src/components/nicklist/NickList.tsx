import { memo } from 'react';
import { useNicklist } from '@/hooks/use-nicklist';
import { NickItem } from './NickItem';
import { ScrollArea } from '@/components/ui/scroll-area';

export const NickList = memo(function NickList() {
  const groups = useNicklist();

  if (groups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-4">
        No users
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" data-testid="nick-list">
      <div className="p-2">
        {groups.map((group) => (
          <div key={group.prefix} className="mb-2">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </div>
            {group.nicks.map((nick) => (
              <NickItem key={nick.name} nick={nick} />
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
});
