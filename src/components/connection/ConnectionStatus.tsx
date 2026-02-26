import { memo } from 'react';
import { useConnectionStore } from '@/store/connection-store';
import type { ConnectionState } from '@/store/types';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<ConnectionState, { color: string; label: string }> = {
  disconnected: { color: 'bg-red-500', label: 'Disconnected' },
  connecting: { color: 'bg-yellow-500 animate-pulse', label: 'Connecting' },
  authenticating: { color: 'bg-yellow-500 animate-pulse', label: 'Authenticating' },
  connected: { color: 'bg-green-500', label: 'Connected' },
};

export const ConnectionStatus = memo(function ConnectionStatus() {
  const state = useConnectionStore((s) => s.state);
  const config = STATUS_CONFIG[state];

  return (
    <div className="flex items-center gap-2 px-2" data-testid="connection-status">
      <div className={cn('h-2 w-2 rounded-full', config.color)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
});
