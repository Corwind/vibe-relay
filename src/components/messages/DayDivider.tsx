import { memo } from 'react';
import { Separator } from '@/components/ui/separator';

interface DayDividerProps {
  date: Date;
}

function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - target.getTime();
  const dayMs = 86400000;

  if (diff === 0) return 'Today';
  if (diff === dayMs) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const DayDivider = memo(function DayDivider({ date }: DayDividerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <Separator className="flex-1" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(date)}</span>
      <Separator className="flex-1" />
    </div>
  );
});
