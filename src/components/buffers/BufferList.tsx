import { useState, memo } from 'react';
import { useBuffers } from '@/hooks/use-buffers';
import { BufferItem } from './BufferItem';
import { BufferSearch } from './BufferSearch';
import { ScrollArea } from '@/components/ui/scroll-area';

export const BufferList = memo(function BufferList() {
  const [filter, setFilter] = useState('');
  const buffers = useBuffers(filter);

  return (
    <div className="flex h-full flex-col" data-testid="buffer-list">
      <BufferSearch value={filter} onChange={setFilter} />
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {buffers.map((buffer) => (
            <BufferItem key={buffer.id} buffer={buffer} />
          ))}
          {buffers.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground text-center">
              {filter ? 'No matching buffers' : 'No buffers'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
