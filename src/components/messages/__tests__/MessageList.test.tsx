import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageList } from '../MessageList';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useHistoryStore } from '@/store/history-store';
import type { WeechatMessage } from '@/store/types';

// Track firstItemIndex values across renders for scroll-position assertions
let capturedFirstItemIndex: number | undefined;

// Mock react-virtuoso since it requires DOM measurements
vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data,
    itemContent,
    atTopStateChange,
    firstItemIndex,
    components,
  }: {
    data: unknown[];
    itemContent: (index: number, item: unknown) => React.ReactNode;
    atTopStateChange?: (atTop: boolean) => void;
    firstItemIndex?: number;
    components?: { Header?: React.ComponentType };
    [key: string]: unknown;
  }) => {
    capturedFirstItemIndex = firstItemIndex;
    const HeaderComponent = components?.Header;
    return (
      <div data-testid="virtuoso-mock">
        {HeaderComponent && <HeaderComponent />}
        {data.map((item, i) => (
          <div key={i}>{itemContent(i, item)}</div>
        ))}
        {atTopStateChange && (
          <button data-testid="start-reached-trigger" onClick={() => atTopStateChange(true)}>
            Load more
          </button>
        )}
      </div>
    );
  },
}));

function makeMessage(id: string, text: string, date?: Date): WeechatMessage {
  return {
    id,
    bufferId: 'buf1',
    date: date ?? new Date('2025-01-15T10:00:00Z'),
    prefix: 'nick',
    message: text,
    tags: [],
    highlight: false,
    displayed: true,
  };
}

describe('MessageList', () => {
  beforeEach(() => {
    useBufferStore.setState({ activeBufferId: 'buf1', buffers: {} });
    useMessageStore.setState({ messages: {} });
    useHistoryStore.getState().resetAll();
  });

  it('shows empty state when no messages', () => {
    render(<MessageList />);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('renders messages', () => {
    useMessageStore.setState({
      messages: {
        buf1: [makeMessage('1', 'Hello world')],
      },
    });
    render(<MessageList />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('passes onStartReached callback', () => {
    useMessageStore.setState({
      messages: {
        buf1: [makeMessage('1', 'test message')],
      },
    });
    const onLoadMore = vi.fn();
    render(<MessageList onStartReached={onLoadMore} />);

    const trigger = screen.getByTestId('start-reached-trigger');
    trigger.click();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loadingOlder is true', () => {
    useMessageStore.setState({
      messages: { buf1: [makeMessage('1', 'test')] },
    });
    useHistoryStore.getState().startLoading('buf1');

    render(<MessageList />);
    expect(screen.getByTestId('loading-older')).toBeInTheDocument();
    expect(screen.getByText('Loading older messages...')).toBeInTheDocument();
  });

  it('shows beginning of conversation when hasMoreMessages is false', () => {
    useMessageStore.setState({
      messages: { buf1: [makeMessage('1', 'test')] },
    });
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().finishLoading('buf1', false);

    render(<MessageList />);
    expect(screen.getByTestId('history-start')).toBeInTheDocument();
    expect(screen.getByText('Beginning of conversation')).toBeInTheDocument();
  });

  it('shows no header when hasMoreMessages is true and not loading', () => {
    useMessageStore.setState({
      messages: { buf1: [makeMessage('1', 'test')] },
    });

    render(<MessageList />);
    expect(screen.queryByTestId('loading-older')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-start')).not.toBeInTheDocument();
  });

  it('does not change firstItemIndex when messages are appended', () => {
    const initial = [makeMessage('1', 'hello'), makeMessage('2', 'world')];
    useMessageStore.setState({ messages: { buf1: initial } });

    const { rerender } = render(<MessageList />);
    const indexAfterInitial = capturedFirstItemIndex!;

    // Append a new message (simulates receiving a new message in the channel)
    useMessageStore.setState({
      messages: { buf1: [...initial, makeMessage('3', 'new message')] },
    });
    rerender(<MessageList />);

    expect(capturedFirstItemIndex).toBe(indexAfterInitial);
  });

  it('decreases firstItemIndex when messages are prepended', () => {
    const initial = [makeMessage('2', 'hello'), makeMessage('3', 'world')];
    useMessageStore.setState({ messages: { buf1: initial } });

    const { rerender } = render(<MessageList />);
    const indexAfterInitial = capturedFirstItemIndex!;

    // Prepend older messages (simulates loading history)
    useMessageStore.setState({
      messages: { buf1: [makeMessage('1', 'older'), ...initial] },
    });
    rerender(<MessageList />);

    expect(capturedFirstItemIndex).toBeLessThan(indexAfterInitial);
  });
});
