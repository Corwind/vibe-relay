import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface BufferSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const BufferSearch = memo(function BufferSearch({ value, onChange }: BufferSearchProps) {
  return (
    <div className="relative px-2 py-2">
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter buffers..."
        className="pl-8 h-8 text-sm"
        data-testid="buffer-search"
      />
    </div>
  );
});
