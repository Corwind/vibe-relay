import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormattedText } from '../FormattedText';
import { useSettingsStore } from '@/store/settings-store';
import type { TextSpan } from '@/store/types';

describe('FormattedText', () => {
  beforeEach(() => {
    useSettingsStore.setState({ showEmojis: true });
  });

  it('renders nothing when spans are empty', () => {
    const { container } = render(<FormattedText spans={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders plain text spans', () => {
    const spans: TextSpan[] = [{ text: 'Hello' }, { text: ' World' }];

    render(<FormattedText spans={spans} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('applies foreground color from string', () => {
    const spans: TextSpan[] = [{ text: 'Red text', fgColor: '#ff0000' }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Red text');
    expect(span).toHaveStyle({ color: '#ff0000' });
  });

  it('applies background color from string', () => {
    const spans: TextSpan[] = [{ text: 'Highlighted', bgColor: '#ffff00' }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Highlighted');
    expect(span).toHaveStyle({ backgroundColor: '#ffff00' });
  });

  it('applies bold style', () => {
    const spans: TextSpan[] = [{ text: 'Bold', bold: true }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Bold');
    expect(span).toHaveStyle({ fontWeight: 'bold' });
  });

  it('applies italic style', () => {
    const spans: TextSpan[] = [{ text: 'Italic', italic: true }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Italic');
    expect(span).toHaveStyle({ fontStyle: 'italic' });
  });

  it('applies underline style', () => {
    const spans: TextSpan[] = [{ text: 'Underlined', underline: true }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Underlined');
    expect(span).toHaveStyle({ textDecoration: 'underline' });
  });

  it('applies strikethrough style', () => {
    const spans: TextSpan[] = [{ text: 'Struck', strikethrough: true }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Struck');
    expect(span).toHaveStyle({ textDecoration: 'line-through' });
  });

  it('swaps fg/bg when reverse is set', () => {
    const spans: TextSpan[] = [
      { text: 'Reversed', fgColor: '#ff0000', bgColor: '#ffffff', reverse: true },
    ];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Reversed');
    // fg should become bg (white) and bg should become fg (red)
    expect(span).toHaveStyle({ color: '#ffffff', backgroundColor: '#ff0000' });
  });

  it('renders span without style when no formatting', () => {
    const spans: TextSpan[] = [{ text: 'Plain' }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Plain');
    expect(span.tagName).toBe('SPAN');
  });

  it('resolves emoji shortcodes when showEmojis is enabled', () => {
    const spans: TextSpan[] = [{ text: 'hello :smile: world' }];

    const { container } = render(<FormattedText spans={spans} />);

    // The smile emoji should be rendered
    const emojiSpan = container.querySelector('.emoji');
    expect(emojiSpan).toBeInTheDocument();
    expect(emojiSpan?.textContent).toBe('\u{1F604}');
  });

  it('does not resolve emoji shortcodes when showEmojis is disabled', () => {
    useSettingsStore.setState({ showEmojis: false });
    const spans: TextSpan[] = [{ text: 'hello :smile: world' }];

    render(<FormattedText spans={spans} />);

    // The shortcode should remain as text
    expect(screen.getByText('hello :smile: world')).toBeInTheDocument();
  });

  it('preserves color formatting with emoji content', () => {
    const spans: TextSpan[] = [
      { text: ':heart:', fgColor: '#ff0000' },
    ];

    const { container } = render(<FormattedText spans={spans} />);

    const coloredSpan = container.querySelector('span[style]');
    expect(coloredSpan).toHaveStyle({ color: '#ff0000' });
    const emojiSpan = coloredSpan?.querySelector('.emoji');
    expect(emojiSpan).toBeInTheDocument();
  });
});
