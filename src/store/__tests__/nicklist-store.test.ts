import { describe, it, expect, beforeEach } from 'vitest';
import { useNicklistStore } from '../nicklist-store';
import type { NickEntry } from '../types';

function makeNick(name: string): NickEntry {
  return {
    name,
    prefix: '',
    color: '',
    visible: true,
    group: '',
    level: 0,
  };
}

describe('nicklist-store', () => {
  beforeEach(() => {
    useNicklistStore.getState().clearAll();
  });

  it('starts with empty nicklists', () => {
    expect(useNicklistStore.getState().nicklists).toEqual({});
  });

  it('sets nicklist for a buffer', () => {
    const nicks = [makeNick('alice'), makeNick('bob')];
    useNicklistStore.getState().setNicklist('buf1', nicks);
    expect(useNicklistStore.getState().nicklists['buf1']).toHaveLength(2);
  });

  it('applies add diff', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice')]);
    useNicklistStore.getState().applyDiff('buf1', [{ op: '+', nick: makeNick('bob') }]);
    const nicks = useNicklistStore.getState().nicklists['buf1'];
    expect(nicks).toHaveLength(2);
    expect(nicks[1].name).toBe('bob');
  });

  it('applies remove diff', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice'), makeNick('bob')]);
    useNicklistStore.getState().applyDiff('buf1', [{ op: '-', nick: makeNick('alice') }]);
    const nicks = useNicklistStore.getState().nicklists['buf1'];
    expect(nicks).toHaveLength(1);
    expect(nicks[0].name).toBe('bob');
  });

  it('applies update diff', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice')]);
    useNicklistStore
      .getState()
      .applyDiff('buf1', [{ op: '*', nick: { ...makeNick('alice'), prefix: '@' } }]);
    const nicks = useNicklistStore.getState().nicklists['buf1'];
    expect(nicks[0].prefix).toBe('@');
  });

  it('applies multiple diffs in order', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice')]);
    useNicklistStore.getState().applyDiff('buf1', [
      { op: '+', nick: makeNick('bob') },
      { op: '-', nick: makeNick('alice') },
      { op: '+', nick: makeNick('charlie') },
    ]);
    const nicks = useNicklistStore.getState().nicklists['buf1'];
    expect(nicks).toHaveLength(2);
    expect(nicks.map((n) => n.name)).toEqual(['bob', 'charlie']);
  });

  it('handles remove of non-existent nick gracefully', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice')]);
    useNicklistStore.getState().applyDiff('buf1', [{ op: '-', nick: makeNick('ghost') }]);
    expect(useNicklistStore.getState().nicklists['buf1']).toHaveLength(1);
  });

  it('handles diff on empty buffer', () => {
    useNicklistStore.getState().applyDiff('buf1', [{ op: '+', nick: makeNick('alice') }]);
    expect(useNicklistStore.getState().nicklists['buf1']).toHaveLength(1);
  });

  it('clears nicklist for a buffer', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice')]);
    useNicklistStore.getState().clearNicklist('buf1');
    expect(useNicklistStore.getState().nicklists['buf1']).toEqual([]);
  });

  it('clears all nicklists', () => {
    useNicklistStore.getState().setNicklist('buf1', [makeNick('alice')]);
    useNicklistStore.getState().setNicklist('buf2', [makeNick('bob')]);
    useNicklistStore.getState().clearAll();
    expect(useNicklistStore.getState().nicklists).toEqual({});
  });
});
