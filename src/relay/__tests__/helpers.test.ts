import { describe, it, expect } from 'vitest';
import { inferBufferType } from '../helpers';

describe('inferBufferType', () => {
  it('returns channel for type=channel', () => {
    expect(inferBufferType({ type: 'channel', plugin: 'irc' })).toBe('channel');
  });

  it('returns private for type=private', () => {
    expect(inferBufferType({ type: 'private', plugin: 'irc' })).toBe('private');
  });

  it('returns server for type=server', () => {
    expect(inferBufferType({ type: 'server', plugin: 'irc' })).toBe('server');
  });

  it('returns server for core plugin', () => {
    expect(inferBufferType({ plugin: 'core', name: 'weechat' })).toBe('server');
  });

  it('defaults to channel for unknown type', () => {
    expect(inferBufferType({ plugin: 'irc' })).toBe('channel');
  });

  it('defaults to channel for empty variables', () => {
    expect(inferBufferType({})).toBe('channel');
  });
});
