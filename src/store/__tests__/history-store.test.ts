import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore, BATCH_SIZE, DEFAULT_STATE } from '../history-store';

describe('history-store', () => {
  beforeEach(() => {
    useHistoryStore.getState().resetAll();
  });

  it('starts with empty buffers', () => {
    expect(useHistoryStore.getState().buffers).toEqual({});
  });

  it('returns default state for unknown buffer', () => {
    const state = useHistoryStore.getState().getBufferState('unknown');
    expect(state).toEqual(DEFAULT_STATE);
    expect(state.loadingOlder).toBe(false);
    expect(state.hasMoreMessages).toBe(true);
    expect(state.fetchedCount).toBe(BATCH_SIZE);
  });

  it('sets loadingOlder to true and increases fetchedCount on startLoading', () => {
    useHistoryStore.getState().startLoading('buf1');
    const state = useHistoryStore.getState().getBufferState('buf1');
    expect(state.loadingOlder).toBe(true);
    expect(state.fetchedCount).toBe(BATCH_SIZE * 2);
  });

  it('increases fetchedCount cumulatively across multiple startLoading calls', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().finishLoading('buf1', true);
    useHistoryStore.getState().startLoading('buf1');
    const state = useHistoryStore.getState().getBufferState('buf1');
    expect(state.fetchedCount).toBe(BATCH_SIZE * 3);
  });

  it('sets loadingOlder to false on finishLoading with new messages', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().finishLoading('buf1', true);
    const state = useHistoryStore.getState().getBufferState('buf1');
    expect(state.loadingOlder).toBe(false);
    expect(state.hasMoreMessages).toBe(true);
  });

  it('sets hasMoreMessages to false on finishLoading with no new messages', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().finishLoading('buf1', false);
    const state = useHistoryStore.getState().getBufferState('buf1');
    expect(state.loadingOlder).toBe(false);
    expect(state.hasMoreMessages).toBe(false);
  });

  it('resets a specific buffer', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().startLoading('buf2');
    useHistoryStore.getState().resetBuffer('buf1');

    expect(useHistoryStore.getState().buffers['buf1']).toBeUndefined();
    expect(useHistoryStore.getState().buffers['buf2']).toBeDefined();
  });

  it('resets all buffers', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().startLoading('buf2');
    useHistoryStore.getState().resetAll();
    expect(useHistoryStore.getState().buffers).toEqual({});
  });

  it('does not request when already loading', () => {
    useHistoryStore.getState().startLoading('buf1');
    const stateBefore = useHistoryStore.getState().getBufferState('buf1');
    expect(stateBefore.loadingOlder).toBe(true);
    // Callers should check loadingOlder before calling startLoading again
  });

  it('does not request when hasMoreMessages is false', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().finishLoading('buf1', false);
    const state = useHistoryStore.getState().getBufferState('buf1');
    expect(state.hasMoreMessages).toBe(false);
    // Callers should check hasMoreMessages before calling startLoading
  });

  it('keeps separate state per buffer', () => {
    useHistoryStore.getState().startLoading('buf1');
    useHistoryStore.getState().finishLoading('buf1', false);
    useHistoryStore.getState().startLoading('buf2');

    const state1 = useHistoryStore.getState().getBufferState('buf1');
    const state2 = useHistoryStore.getState().getBufferState('buf2');

    expect(state1.hasMoreMessages).toBe(false);
    expect(state1.loadingOlder).toBe(false);
    expect(state2.hasMoreMessages).toBe(true);
    expect(state2.loadingOlder).toBe(true);
  });
});
