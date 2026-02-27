import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageItem } from '../MessageItem';
import { useSettingsStore } from '@/store/settings-store';
import { nickColor } from '@/lib/nick-color';
import type { WeechatMessage } from '@/store/types';

function makeMessage(overrides: Partial<WeechatMessage> = {}): WeechatMessage {
  return {
    id: 'msg1',
    bufferId: 'buf1',
    date: new Date('2025-01-15T14:30:00Z'),
    prefix: 'alice',
    message: 'Hello, world!',
    tags: [],
    highlight: false,
    displayed: true,
    ...overrides,
  };
}

describe('MessageItem', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      showTimestamps: true,
      timestampFormat: '24h',
      mediaPreview: false,
    });
  });

  it('renders nick and message text', () => {
    render(<MessageItem message={makeMessage()} />);

    expect(screen.getByTestId('message-nick')).toHaveTextContent('alice');
    expect(screen.getByTestId('message-body')).toHaveTextContent('Hello, world!');
  });

  it('applies nick color to the prefix', () => {
    render(<MessageItem message={makeMessage()} />);

    const nickEl = screen.getByTestId('message-nick');
    expect(nickEl).toHaveStyle({ color: nickColor('alice') });
  });

  it('renders with formatted spans when available', () => {
    const msg = makeMessage({
      spans: [
        { text: 'Hello, ', bold: true },
        { text: 'world!', fgColor: '#ff0000' },
      ],
    });

    render(<MessageItem message={msg} />);

    const body = screen.getByTestId('message-body');
    const spans = body.querySelectorAll('span');
    expect(spans).toHaveLength(2);
    expect(spans[0].textContent).toBe('Hello, ');
    expect(spans[0]).toHaveStyle({ fontWeight: 'bold' });
    expect(spans[1]).toHaveTextContent('world!');
    expect(spans[1]).toHaveStyle({ color: '#ff0000' });
  });

  it('applies highlight styling when message is highlighted', () => {
    const msg = makeMessage({ highlight: true });

    render(<MessageItem message={msg} />);

    const item = screen.getByTestId('message-item');
    expect(item.className).toContain('border-yellow-500');
  });

  it('hides timestamps when disabled in settings', () => {
    useSettingsStore.setState({ showTimestamps: false });

    render(<MessageItem message={makeMessage()} />);

    expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
  });

  it('shows timestamps when enabled in settings', () => {
    useSettingsStore.setState({ showTimestamps: true, timestampFormat: '24h' });

    render(<MessageItem message={makeMessage()} />);

    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders prefixSpans through FormattedText', () => {
    const msg = makeMessage({
      prefixSpans: [{ text: 'alice', fgColor: '#2980b9' }],
    });

    render(<MessageItem message={msg} />);

    const nickEl = screen.getByTestId('message-nick');
    const innerSpan = nickEl.querySelector('span');
    expect(innerSpan).toHaveTextContent('alice');
    expect(innerSpan).toHaveStyle({ color: '#2980b9' });
  });
});
