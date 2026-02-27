import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '../AppLayout';
import { useConnectionStore } from '@/store/connection-store';
import { useBufferStore } from '@/store/buffer-store';

// Mock the hooks that trigger side effects
vi.mock('@/hooks/use-relay', () => ({
  useRelay: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    sendInput: vi.fn(),
    fetchLines: vi.fn(),
    fetchNicklist: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/hooks/use-document-title', () => ({
  useDocumentTitle: vi.fn(),
}));

describe('AppLayout — resizable panels', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      state: 'disconnected',
      error: null,
    });
    useBufferStore.setState({
      buffers: {},
      activeBufferId: null,
    });
  });

  it('renders the panel group for desktop layout', () => {
    const { container } = render(<AppLayout />);
    const panelGroup = container.querySelector('#relay-panels[data-group]');
    expect(panelGroup).toBeInTheDocument();
  });

  it('renders three panels in the desktop layout', () => {
    const { container } = render(<AppLayout />);
    const panels = container.querySelectorAll('[data-panel]');
    expect(panels.length).toBe(3);
  });

  it('renders two separator handles between panels', () => {
    const { container } = render(<AppLayout />);
    const separators = container.querySelectorAll('[data-separator]');
    expect(separators.length).toBe(2);
  });

  it('renders sidebar panel', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('renders chat panel', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('chat')).toBeInTheDocument();
  });

  it('renders nicklist panel', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('nicklist')).toBeInTheDocument();
  });

  it('keeps the mobile layout unchanged (no panels)', () => {
    const { container } = render(<AppLayout />);
    const mobileLayout = container.querySelector('.md\\:hidden');
    expect(mobileLayout).toBeInTheDocument();
    const mobilePanelGroup = mobileLayout?.querySelector('[data-group]');
    expect(mobilePanelGroup).toBeNull();
  });

  it('renders the app-layout wrapper', () => {
    render(<AppLayout />);
    expect(screen.getByTestId('app-layout')).toBeInTheDocument();
  });
});
