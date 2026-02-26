import { memo } from 'react';
import type { NickEntry } from '@/store/types';

interface NickItemProps {
  nick: NickEntry;
}

export const NickItem = memo(function NickItem({ nick }: NickItemProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 text-sm truncate" data-testid="nick-item">
      {nick.prefix && (
        <span className="text-muted-foreground font-mono w-3 text-center shrink-0">
          {nick.prefix}
        </span>
      )}
      <span className="truncate" style={nick.color ? { color: nick.color } : undefined}>
        {nick.name}
      </span>
    </div>
  );
});
