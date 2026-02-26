import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NickList } from '../NickList';
import { useNicklistStore } from '@/store/nicklist-store';
import { useBufferStore } from '@/store/buffer-store';
import type { NickEntry } from '@/store/types';

function makeNick(overrides: Partial<NickEntry> = {}): NickEntry {
  return {
    name: 'alice',
    prefix: '',
    color: '',
    visible: true,
    group: 'default',
    level: 0,
    ...overrides,
  };
}

describe('NickList', () => {
  beforeEach(() => {
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
    useNicklistStore.setState({ nicklists: {} });
  });

  it('shows empty state when no active buffer', () => {
    render(<NickList />);
    expect(screen.getByText('No users')).toBeInTheDocument();
  });

  it('shows empty state when active buffer has no nicks', () => {
    useBufferStore.setState({ activeBufferId: 'buf1' });
    useNicklistStore.setState({ nicklists: { buf1: [] } });

    render(<NickList />);
    expect(screen.getByText('No users')).toBeInTheDocument();
  });

  it('renders nicks grouped by prefix', () => {
    useBufferStore.setState({ activeBufferId: 'buf1' });
    useNicklistStore.setState({
      nicklists: {
        buf1: [
          makeNick({ name: 'alice', prefix: '@' }),
          makeNick({ name: 'bob', prefix: '' }),
          makeNick({ name: 'carol', prefix: '@' }),
          makeNick({ name: 'dave', prefix: '+' }),
        ],
      },
    });

    render(<NickList />);

    const nickItems = screen.getAllByTestId('nick-item');
    expect(nickItems).toHaveLength(4);

    // Ops should appear first (@ prefix)
    expect(nickItems[0]).toHaveTextContent('alice');
    expect(nickItems[1]).toHaveTextContent('carol');
    // Then voice (+ prefix)
    expect(nickItems[2]).toHaveTextContent('dave');
    // Then regular users
    expect(nickItems[3]).toHaveTextContent('bob');
  });

  it('hides invisible nicks', () => {
    useBufferStore.setState({ activeBufferId: 'buf1' });
    useNicklistStore.setState({
      nicklists: {
        buf1: [
          makeNick({ name: 'visible', visible: true }),
          makeNick({ name: 'hidden', visible: false }),
        ],
      },
    });

    render(<NickList />);

    const nickItems = screen.getAllByTestId('nick-item');
    expect(nickItems).toHaveLength(1);
    expect(nickItems[0]).toHaveTextContent('visible');
  });

  it('sorts nicks alphabetically within groups', () => {
    useBufferStore.setState({ activeBufferId: 'buf1' });
    useNicklistStore.setState({
      nicklists: {
        buf1: [
          makeNick({ name: 'zara', prefix: '' }),
          makeNick({ name: 'alice', prefix: '' }),
          makeNick({ name: 'mike', prefix: '' }),
        ],
      },
    });

    render(<NickList />);

    const nickItems = screen.getAllByTestId('nick-item');
    expect(nickItems[0]).toHaveTextContent('alice');
    expect(nickItems[1]).toHaveTextContent('mike');
    expect(nickItems[2]).toHaveTextContent('zara');
  });
});
