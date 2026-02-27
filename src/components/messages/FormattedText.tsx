import { memo } from 'react';
import type { TextSpan } from '@/store/types';

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

export const FormattedText = memo(function FormattedText({ spans }: FormattedTextProps) {
  if (!spans || spans.length === 0) return null;

  return (
    <>
      {spans.map((span, i) => {
        const style = spanStyle(span);
        const hasStyle = Object.keys(style).length > 0;
        if (hasStyle) {
          return (
            <span key={i} style={style}>
              {span.text}
            </span>
          );
        }
        return <span key={i}>{span.text}</span>;
      })}
    </>
  );
});
