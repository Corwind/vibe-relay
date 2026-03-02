import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BufferList } from '../BufferList';
import { useBufferStore } from '@/store/buffer-store';
import { BufferType } from '@/lib/constants';
import type { WeechatBuffer } from '@/store/types';

function makeBuffer(overrides: Partial<WeechatBuffer> = {}): WeechatBuffer {
  return {
    id: 'buf1',
    fullName: 'irc.libera.#test',
    shortName: '#test',
    title: 'Test channel',
    type: BufferType.Channel,
    number: 1,
    unreadCount: 0,
    highlightCount: 0,
    isActive: false,
    nicklistVisible: true,
    localVariables: {},
    ...overrides,
  };
}

describe('BufferList', () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeAll(() => {
    user = userEvent.setup();
  });

  beforeEach(() => {
    useBufferStore.setState({
      buffers: {},
      activeBufferId: null,
    });
  });

  it('renders empty state when no buffers', () => {
    render(<BufferList />);
    expect(screen.getByText('No buffers')).toBeInTheDocument();
  });

  it('renders buffer items sorted by number', () => {
    const buffers = {
      buf2: makeBuffer({ id: 'buf2', shortName: '#beta', number: 2 }),
      buf1: makeBuffer({ id: 'buf1', shortName: '#alpha', number: 1 }),
      buf3: makeBuffer({ id: 'buf3', shortName: '#gamma', number: 3 }),
    };
    useBufferStore.setState({ buffers });

    render(<BufferList />);

    const items = screen.getAllByTestId('buffer-item');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('#alpha');
    expect(items[1]).toHaveTextContent('#beta');
    expect(items[2]).toHaveTextContent('#gamma');
  });

  it('filters buffers by search input', async () => {
    const buffers = {
      buf1: makeBuffer({ id: 'buf1', shortName: '#react', number: 1 }),
      buf2: makeBuffer({ id: 'buf2', shortName: '#vue', number: 2 }),
      buf3: makeBuffer({ id: 'buf3', shortName: '#angular', number: 3 }),
    };
    useBufferStore.setState({ buffers });

    render(<BufferList />);

    const searchInput = screen.getByTestId('buffer-search');
    await user.click(searchInput);
    await user.paste('react');

    expect(screen.getAllByTestId('buffer-item')).toHaveLength(1);
    expect(screen.getByText('#react')).toBeInTheDocument();
  });

  it('shows no matching buffers message when filter has no results', async () => {
    const buffers = {
      buf1: makeBuffer({ id: 'buf1', shortName: '#test', number: 1 }),
    };
    useBufferStore.setState({ buffers });

    render(<BufferList />);

    const searchInput = screen.getByTestId('buffer-search');
    await user.click(searchInput);
    await user.paste('nonexistent');

    expect(screen.getByText('No matching buffers')).toBeInTheDocument();
  });

  it('displays unread badge', () => {
    const buffers = {
      buf1: makeBuffer({ id: 'buf1', shortName: '#test', unreadCount: 5 }),
    };
    useBufferStore.setState({ buffers });

    render(<BufferList />);

    expect(screen.getByTestId('unread-badge')).toHaveTextContent('5');
  });

  it('displays highlight badge instead of unread when both present', () => {
    const buffers = {
      buf1: makeBuffer({
        id: 'buf1',
        shortName: '#test',
        unreadCount: 10,
        highlightCount: 2,
      }),
    };
    useBufferStore.setState({ buffers });

    render(<BufferList />);

    expect(screen.getByTestId('highlight-badge')).toHaveTextContent('2');
    expect(screen.queryByTestId('unread-badge')).not.toBeInTheDocument();
  });

  it('sets active buffer on click', async () => {
    const buffers = {
      buf1: makeBuffer({ id: 'buf1', shortName: '#test' }),
    };
    useBufferStore.setState({ buffers });

    render(<BufferList />);

    await user.click(screen.getByTestId('buffer-item'));

    expect(useBufferStore.getState().activeBufferId).toBe('buf1');
  });
});
