import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useRelay } from '../use-relay';
import { useConnectionStore } from '@/store/connection-store';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useNicklistStore } from '@/store/nicklist-store';
import type { ConnectionSettings } from '@/store/types';

// Mock the RelaySession class
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockSendInput = vi.fn();
const mockFetchLines = vi.fn();
const mockFetchNicklist = vi.fn();

vi.mock('@/relay/session', () => {
  return {
    RelaySession: class MockRelaySession {
      connect = mockConnect;
      disconnect = mockDisconnect;
      sendInput = mockSendInput;
      fetchLines = mockFetchLines;
      fetchNicklist = mockFetchNicklist;
    },
  };
});

const defaultSettings: ConnectionSettings = {
  host: 'localhost',
  port: 9001,
  password: 'secret',
  ssl: true,
};

describe('useRelay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConnectionStore.getState().reset();
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
    useMessageStore.getState().clearAll();
    useNicklistStore.getState().clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns connect, disconnect, and sendInput functions', () => {
    const { result } = renderHook(() => useRelay());
    expect(result.current.connect).toBeInstanceOf(Function);
    expect(result.current.disconnect).toBeInstanceOf(Function);
    expect(result.current.sendInput).toBeInstanceOf(Function);
  });

  it('creates a RelaySession and calls connect with settings', () => {
    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    expect(mockConnect).toHaveBeenCalledWith(
      defaultSettings.host,
      defaultSettings.port,
      defaultSettings.ssl,
      defaultSettings.password,
    );
  });

  it('stores settings in connection store on connect', () => {
    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    expect(useConnectionStore.getState().settings).toEqual(defaultSettings);
  });

  it('calls session.disconnect on disconnect', () => {
    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    act(() => {
      result.current.disconnect();
    });
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('clears stores on disconnect', () => {
    // Set up some state
    useMessageStore.getState().addMessage('buf1', {
      id: 'msg1',
      bufferId: 'buf1',
      date: new Date(),
      prefix: 'nick',
      message: 'hello',
      tags: [],
      highlight: false,
      displayed: true,
    });
    useNicklistStore
      .getState()
      .setNicklist('buf1', [
        { name: 'nick1', prefix: '@', color: '', visible: true, group: '', level: 0 },
      ]);
    useBufferStore.setState({
      buffers: { buf1: {} as never },
      activeBufferId: 'buf1',
    });

    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    act(() => {
      result.current.disconnect();
    });

    expect(useMessageStore.getState().messages).toEqual({});
    expect(useNicklistStore.getState().nicklists).toEqual({});
    expect(useBufferStore.getState().buffers).toEqual({});
    expect(useBufferStore.getState().activeBufferId).toBe('');
  });

  it('delegates sendInput to session.sendInput', () => {
    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    act(() => {
      result.current.sendInput('0x1234', 'hello world');
    });
    expect(mockSendInput).toHaveBeenCalledWith('0x1234', 'hello world');
  });

  it('delegates fetchLines to session.fetchLines', () => {
    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    act(() => {
      result.current.fetchLines('0x1234', 200);
    });
    expect(mockFetchLines).toHaveBeenCalledWith('0x1234', 200);
  });

  it('delegates fetchNicklist to session.fetchNicklist', () => {
    const { result } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    act(() => {
      result.current.fetchNicklist('0x1234');
    });
    expect(mockFetchNicklist).toHaveBeenCalledWith('0x1234');
  });

  it('cleans up session on unmount', () => {
    const { result, unmount } = renderHook(() => useRelay());
    act(() => {
      result.current.connect(defaultSettings);
    });
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
