import { memo, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Popover } from 'radix-ui';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMOJI_CATEGORIES } from '@/lib/emoji';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

export const EmojiPicker = memo(function EmojiPicker({
  onSelect,
  disabled,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES;

    const query = search.toLowerCase().trim();
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter((e) =>
        e.shortcode.toLowerCase().includes(query),
      ),
    })).filter((cat) => cat.emojis.length > 0);
  }, [search]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      setOpen(false);
      setSearch('');
    },
    [onSelect],
  );

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearch('');
    }
  }, []);

  useEffect(() => {
    if (open && searchInputRef.current) {
      // Delay focus to after popover animation
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <Button
          size="icon"
          variant="ghost"
          disabled={disabled}
          aria-label="Emoji picker"
          data-testid="emoji-picker-trigger"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-72 rounded-md border border-border bg-popover p-2 shadow-md"
          side="top"
          align="end"
          sideOffset={8}
          data-testid="emoji-picker-popover"
        >
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            aria-label="Search emoji"
            className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            data-testid="emoji-search-input"
          />

          {!search.trim() && (
            <div className="mb-2 flex gap-1 overflow-x-auto" role="tablist">
              {EMOJI_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  role="tab"
                  aria-selected={activeCategory === i}
                  onClick={() => setActiveCategory(i)}
                  className={`shrink-0 rounded px-2 py-0.5 text-xs ${
                    activeCategory === i
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <div
            className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto"
            role="grid"
            data-testid="emoji-grid"
          >
            {(search.trim() ? filteredCategories : [EMOJI_CATEGORIES[activeCategory]])
              .flatMap((cat) => cat.emojis)
              .map((e) => (
                <button
                  key={e.shortcode}
                  type="button"
                  onClick={() => handleSelect(e.emoji)}
                  title={`:${e.shortcode}:`}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-accent"
                  role="gridcell"
                  data-testid={`emoji-${e.shortcode}`}
                >
                  <span className="emoji">{e.emoji}</span>
                </button>
              ))}
            {filteredCategories.length === 0 && (
              <div className="col-span-8 py-4 text-center text-xs text-muted-foreground">
                No emojis found
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});
