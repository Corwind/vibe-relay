import { describe, it, expect, beforeEach } from 'vitest';
import { useMessageStore, MAX_MESSAGES_PER_BUFFER } from '../message-store';
import type { WeechatMessage } from '../types';

function makeMessage(id: string, bufferId = 'buf1'): WeechatMessage {
  return {
    id,
    bufferId,
    date: new Date(),
    prefix: 'user',
    message: `Message ${id}`,
    tags: [],
    highlight: false,
    displayed: true,
  };
}

describe('message-store', () => {
  beforeEach(() => {
    useMessageStore.getState().clearAll();
  });

  it('starts with empty messages', () => {
    expect(useMessageStore.getState().messages).toEqual({});
  });

  it('adds a single message', () => {
    const msg = makeMessage('1');
    useMessageStore.getState().addMessage('buf1', msg);
    expect(useMessageStore.getState().messages['buf1']).toHaveLength(1);
    expect(useMessageStore.getState().messages['buf1'][0].id).toBe('1');
  });

  it('adds multiple messages', () => {
    const msgs = [makeMessage('1'), makeMessage('2')];
    useMessageStore.getState().addMessages('buf1', msgs);
    expect(useMessageStore.getState().messages['buf1']).toHaveLength(2);
  });

  it('prepends messages', () => {
    useMessageStore.getState().addMessage('buf1', makeMessage('2'));
    useMessageStore.getState().prependMessages('buf1', [makeMessage('1')]);
    expect(useMessageStore.getState().messages['buf1'][0].id).toBe('1');
    expect(useMessageStore.getState().messages['buf1'][1].id).toBe('2');
  });

  it('clears messages for a buffer', () => {
    useMessageStore.getState().addMessage('buf1', makeMessage('1'));
    useMessageStore.getState().clearMessages('buf1');
    expect(useMessageStore.getState().messages['buf1']).toEqual([]);
  });

  it('clears all messages', () => {
    useMessageStore.getState().addMessage('buf1', makeMessage('1'));
    useMessageStore.getState().addMessage('buf2', makeMessage('2', 'buf2'));
    useMessageStore.getState().clearAll();
    expect(useMessageStore.getState().messages).toEqual({});
  });

  it('enforces MAX_MESSAGES_PER_BUFFER limit on addMessage', () => {
    const msgs: WeechatMessage[] = [];
    for (let i = 0; i < MAX_MESSAGES_PER_BUFFER; i++) {
      msgs.push(makeMessage(String(i)));
    }
    useMessageStore.getState().addMessages('buf1', msgs);
    expect(useMessageStore.getState().messages['buf1']).toHaveLength(
      MAX_MESSAGES_PER_BUFFER,
    );

    // Adding one more should still be at the limit
    useMessageStore
      .getState()
      .addMessage('buf1', makeMessage('overflow'));
    const result = useMessageStore.getState().messages['buf1'];
    expect(result).toHaveLength(MAX_MESSAGES_PER_BUFFER);
    // The first message should have been trimmed
    expect(result[0].id).toBe('1');
    expect(result[result.length - 1].id).toBe('overflow');
  });

  it('enforces limit on prependMessages', () => {
    const msgs: WeechatMessage[] = [];
    for (let i = 0; i < MAX_MESSAGES_PER_BUFFER; i++) {
      msgs.push(makeMessage(String(i)));
    }
    useMessageStore.getState().addMessages('buf1', msgs);

    // Prepend should trim from the start (keeping end) after combining
    useMessageStore
      .getState()
      .prependMessages('buf1', [makeMessage('prepend')]);
    const result = useMessageStore.getState().messages['buf1'];
    expect(result).toHaveLength(MAX_MESSAGES_PER_BUFFER);
  });
});
