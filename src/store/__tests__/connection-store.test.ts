import { describe, it, expect, beforeEach } from 'vitest';
import { useConnectionStore } from '../connection-store';

describe('connection-store', () => {
  beforeEach(() => {
    useConnectionStore.getState().reset();
  });

  it('starts in disconnected state', () => {
    const state = useConnectionStore.getState();
    expect(state.state).toBe('disconnected');
    expect(state.error).toBeNull();
    expect(state.latency).toBeNull();
  });

  it('sets connection state', () => {
    useConnectionStore.getState().setState('connecting');
    expect(useConnectionStore.getState().state).toBe('connecting');
  });

  it('clears error when setting non-error state', () => {
    useConnectionStore.getState().setError('some error');
    useConnectionStore.getState().setState('connecting');
    expect(useConnectionStore.getState().error).toBeNull();
  });

  it('sets error and transitions to disconnected', () => {
    useConnectionStore.getState().setState('connected');
    useConnectionStore.getState().setError('Connection lost');
    expect(useConnectionStore.getState().error).toBe('Connection lost');
    expect(useConnectionStore.getState().state).toBe('disconnected');
  });

  it('sets and reads latency', () => {
    useConnectionStore.getState().setLatency(42);
    expect(useConnectionStore.getState().latency).toBe(42);
  });

  it('sets settings', () => {
    useConnectionStore.getState().setSettings({
      host: 'example.com',
      port: 9001,
      password: 'secret',
      ssl: true,
    });
    expect(useConnectionStore.getState().settings.host).toBe('example.com');
  });

  it('resets to initial state', () => {
    useConnectionStore.getState().setState('connected');
    useConnectionStore.getState().setLatency(100);
    useConnectionStore.getState().reset();
    expect(useConnectionStore.getState().state).toBe('disconnected');
    expect(useConnectionStore.getState().latency).toBeNull();
    expect(useConnectionStore.getState().error).toBeNull();
  });
});
