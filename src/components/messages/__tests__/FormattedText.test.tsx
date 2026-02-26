import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormattedText } from '../FormattedText';
import type { TextSpan } from '@/store/types';

describe('FormattedText', () => {
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

  it('applies foreground color from IRC palette', () => {
    const spans: TextSpan[] = [{ text: 'Red text', fg: 4 }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Red text');
    expect(span).toHaveStyle({ color: '#ff0000' });
  });

  it('applies background color', () => {
    const spans: TextSpan[] = [{ text: 'Highlighted', bg: 8 }];

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
    const spans: TextSpan[] = [{ text: 'Reversed', fg: 4, bg: 0, reverse: true }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Reversed');
    // fg should become bg (white) and bg should become fg (red)
    expect(span).toHaveStyle({ color: '#ffffff', backgroundColor: '#ff0000' });
  });

  it('handles xterm-256 colors', () => {
    const spans: TextSpan[] = [{ text: 'Xterm', fg: 196 }];

    render(<FormattedText spans={spans} />);

    const span = screen.getByText('Xterm');
    // Color index 196 = (196-16) = 180, r=180/36*51=255, g=(180/6%6)*51=0, b=(180%6)*51=0
    expect(span).toHaveStyle({ color: 'rgb(255,0,0)' });
  });
});
