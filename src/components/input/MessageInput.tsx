import { memo, useRef, useEffect, useCallback } from 'react';
import { useInput } from '@/hooks/use-input';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const MessageInput = memo(function MessageInput({ onSend, disabled }: MessageInputProps) {
  const { value, setValue, send, handleKeyDown } = useInput({ onSend });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.slice(0, start) + emoji + value.slice(end);
        setValue(newValue);
        // Restore cursor position after the inserted emoji
        requestAnimationFrame(() => {
          const pos = start + emoji.length;
          textarea.setSelectionRange(pos, pos);
          textarea.focus();
        });
      } else {
        setValue(value + emoji);
      }
    },
    [value, setValue],
  );

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <div className="flex items-end gap-2 border-t border-border p-3" data-testid="message-input">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        aria-label="Message input"
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="message-textarea"
      />
      <EmojiPicker onSelect={handleEmojiSelect} disabled={disabled} />
      <Button
        size="icon"
        variant="ghost"
        onClick={send}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        data-testid="send-button"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
});
