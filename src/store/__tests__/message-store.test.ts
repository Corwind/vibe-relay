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
    expect(useMessageStore.getState().messages['buf1']).toHaveLength(MAX_MESSAGES_PER_BUFFER);

    // Adding one more should still be at the limit
    useMessageStore.getState().addMessage('buf1', makeMessage('overflow'));
    const result = useMessageStore.getState().messages['buf1'];
    expect(result).toHaveLength(MAX_MESSAGES_PER_BUFFER);
    // The first message should have been trimmed
    expect(result[0].id).toBe('1');
    expect(result[result.length - 1].id).toBe('overflow');
  });

  it('deduplicates on addMessage with same ID', () => {
    const msg = makeMessage('dup-1');
    useMessageStore.getState().addMessage('buf1', msg);
    useMessageStore.getState().addMessage('buf1', { ...msg, message: 'updated' });
    const result = useMessageStore.getState().messages['buf1'];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dup-1');
  });

  it('deduplicates on prependMessages with same ID', () => {
    useMessageStore.getState().addMessage('buf1', makeMessage('1'));
    useMessageStore.getState().addMessage('buf1', makeMessage('2'));
    // Prepend a message that already exists (id='2')
    useMessageStore.getState().prependMessages('buf1', [makeMessage('2'), makeMessage('3')]);
    const result = useMessageStore.getState().messages['buf1'];
    // Should have 3 unique messages: '3' (prepended new), '1' (existing), '2' (existing)
    expect(result).toHaveLength(3);
    const ids = result.map((m) => m.id);
    expect(ids).toContain('1');
    expect(ids).toContain('2');
    expect(ids).toContain('3');
  });

  it('deduplicates on addMessages with same IDs', () => {
    useMessageStore.getState().addMessage('buf1', makeMessage('1'));
    useMessageStore.getState().addMessages('buf1', [makeMessage('1'), makeMessage('2')]);
    const result = useMessageStore.getState().messages['buf1'];
    expect(result).toHaveLength(2);
  });

  it('enforces limit on prependMessages', () => {
    const msgs: WeechatMessage[] = [];
    for (let i = 0; i < MAX_MESSAGES_PER_BUFFER; i++) {
      msgs.push(makeMessage(String(i)));
    }
    useMessageStore.getState().addMessages('buf1', msgs);

    // Prepend should trim from the start (keeping end) after combining
    useMessageStore.getState().prependMessages('buf1', [makeMessage('prepend')]);
    const result = useMessageStore.getState().messages['buf1'];
    expect(result).toHaveLength(MAX_MESSAGES_PER_BUFFER);
  });
});
