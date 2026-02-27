import { memo } from 'react';
import type { TextSpan } from '@/store/types';
import { useSettingsStore } from '@/store/settings-store';
import { resolveEmojis, splitTextWithEmojis } from '@/lib/emoji';

interface FormattedTextProps {
  spans: TextSpan[];
}

function spanStyle(span: TextSpan): React.CSSProperties {
  const style: React.CSSProperties = {};

  const fg = span.reverse ? span.bgColor : span.fgColor;
  const bg = span.reverse ? span.fgColor : span.bgColor;

  if (fg) {
    style.color = fg;
  }
  if (bg) {
    style.backgroundColor = bg;
  }
  if (span.bold) style.fontWeight = 'bold';
  if (span.italic) style.fontStyle = 'italic';
  if (span.underline) style.textDecoration = 'underline';
  if (span.strikethrough) {
    style.textDecoration = style.textDecoration
      ? `${style.textDecoration} line-through`
      : 'line-through';
  }

  return style;
}

function renderTextWithEmojis(text: string, showEmojis: boolean): React.ReactNode {
  if (!showEmojis) return text;

  const resolved = resolveEmojis(text);
  const segments = splitTextWithEmojis(resolved);

  if (segments.length === 1 && segments[0].type === 'text') {
    return resolved;
  }

  return segments.map((seg, j) =>
    seg.type === 'emoji' ? (
      <span key={j} className="emoji">
        {seg.content}
      </span>
    ) : (
      seg.content
    ),
  );
}

export const FormattedText = memo(function FormattedText({ spans }: FormattedTextProps) {
  const showEmojis = useSettingsStore((s) => s.showEmojis);

  if (!spans || spans.length === 0) return null;

  return (
    <>
      {spans.map((span, i) => {
        const style = spanStyle(span);
        const hasStyle = Object.keys(style).length > 0;
        const content = renderTextWithEmojis(span.text, showEmojis);
        if (hasStyle) {
          return (
            <span key={i} style={style}>
              {content}
            </span>
          );
        }
        return <span key={i}>{content}</span>;
      })}
    </>
  );
});
