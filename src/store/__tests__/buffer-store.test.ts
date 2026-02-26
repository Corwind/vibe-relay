import { describe, it, expect, beforeEach } from 'vitest';
import { useBufferStore } from '../buffer-store';
import type { WeechatBuffer } from '../types';

function makeBuffer(overrides: Partial<WeechatBuffer> = {}): WeechatBuffer {
  return {
    id: 'ptr1',
    fullName: 'core.weechat',
    shortName: 'weechat',
    title: 'WeeChat',
    type: 'server',
    number: 1,
    unreadCount: 0,
    highlightCount: 0,
    isActive: false,
    nicklistVisible: true,
    localVariables: {},
    ...overrides,
  };
}

describe('buffer-store', () => {
  beforeEach(() => {
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
  });

  it('starts with empty buffers', () => {
    expect(useBufferStore.getState().buffers).toEqual({});
    expect(useBufferStore.getState().activeBufferId).toBeNull();
  });

  it('adds a buffer', () => {
    const buf = makeBuffer();
    useBufferStore.getState().addBuffer(buf);
    expect(useBufferStore.getState().buffers['ptr1']).toEqual(buf);
  });

  it('removes a buffer', () => {
    useBufferStore.getState().addBuffer(makeBuffer());
    useBufferStore.getState().removeBuffer('ptr1');
    expect(useBufferStore.getState().buffers['ptr1']).toBeUndefined();
  });

  it('clears active buffer when removing the active buffer', () => {
    useBufferStore.getState().addBuffer(makeBuffer());
    useBufferStore.getState().setActiveBuffer('ptr1');
    useBufferStore.getState().removeBuffer('ptr1');
    expect(useBufferStore.getState().activeBufferId).toBeNull();
  });

  it('updates a buffer partially', () => {
    useBufferStore.getState().addBuffer(makeBuffer());
    useBufferStore.getState().updateBuffer('ptr1', { title: 'New Title' });
    expect(useBufferStore.getState().buffers['ptr1'].title).toBe('New Title');
  });

  it('does nothing when updating a non-existent buffer', () => {
    const before = useBufferStore.getState().buffers;
    useBufferStore.getState().updateBuffer('nonexistent', { title: 'x' });
    expect(useBufferStore.getState().buffers).toBe(before);
  });

  it('sets active buffer', () => {
    useBufferStore.getState().addBuffer(makeBuffer());
    useBufferStore.getState().setActiveBuffer('ptr1');
    expect(useBufferStore.getState().activeBufferId).toBe('ptr1');
  });

  it('clears unread counts', () => {
    useBufferStore
      .getState()
      .addBuffer(makeBuffer({ unreadCount: 5, highlightCount: 2 }));
    useBufferStore.getState().clearUnread('ptr1');
    expect(useBufferStore.getState().buffers['ptr1'].unreadCount).toBe(0);
    expect(useBufferStore.getState().buffers['ptr1'].highlightCount).toBe(0);
  });

  it('sets multiple buffers at once', () => {
    const buf1 = makeBuffer({ id: 'ptr1', number: 1 });
    const buf2 = makeBuffer({ id: 'ptr2', number: 2, fullName: 'irc.libera.#test' });
    useBufferStore.getState().setBuffers({ ptr1: buf1, ptr2: buf2 });
    expect(Object.keys(useBufferStore.getState().buffers)).toHaveLength(2);
  });
});
