import { describe, it, expect, beforeEach } from 'vitest';
import { handleEvent } from '../event-handler';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useNicklistStore } from '@/store/nicklist-store';
import type {
  WeechatMessage as ProtocolMessage,
  WeechatHdata,
  WeechatHashtable,
  WeechatArray,
} from '@/protocol/types';

function makeHdataMessage(id: string, hdata: WeechatHdata): ProtocolMessage {
  return {
    id,
    objects: [{ type: 'hda', value: hdata }],
  };
}

function makeLocalVarsHtb(vars: Record<string, string>): WeechatHashtable {
  const entries = new Map<unknown, unknown>();
  for (const [k, v] of Object.entries(vars)) {
    entries.set(k, v);
  }
  return { keyType: 'str', valueType: 'str', entries };
}

describe('event-handler', () => {
  beforeEach(() => {
    useBufferStore.setState({ buffers: {}, activeBufferId: null });
    useMessageStore.getState().clearAll();
    useNicklistStore.getState().clearAll();
  });

  describe('buffer list (listbuffers)', () => {
    it('populates buffers from initial hdata response', () => {
      const hdata: WeechatHdata = {
        path: 'buffer',
        keys: [
          { name: 'number', type: 'int' },
          { name: 'full_name', type: 'str' },
          { name: 'short_name', type: 'str' },
          { name: 'title', type: 'str' },
          { name: 'type', type: 'int' },
          { name: 'hidden', type: 'chr' },
          { name: 'local_variables', type: 'htb' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              number: 1,
              full_name: 'core.weechat',
              short_name: 'weechat',
              title: 'WeeChat',
              type: 0,
              hidden: 0,
              local_variables: makeLocalVarsHtb({
                name: 'weechat',
                plugin: 'core',
              }),
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('listbuffers', hdata));

      const buffers = useBufferStore.getState().buffers;
      expect(buffers['0xabc']).toBeDefined();
      expect(buffers['0xabc'].fullName).toBe('core.weechat');
      expect(buffers['0xabc'].type).toBe('server');
    });

    it('auto-selects first buffer', () => {
      const hdata: WeechatHdata = {
        path: 'buffer',
        keys: [
          { name: 'number', type: 'int' },
          { name: 'full_name', type: 'str' },
          { name: 'short_name', type: 'str' },
          { name: 'title', type: 'str' },
          { name: 'local_variables', type: 'htb' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              number: 1,
              full_name: 'core.weechat',
              short_name: null,
              title: '',
              local_variables: makeLocalVarsHtb({ plugin: 'core' }),
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('listbuffers', hdata));
      expect(useBufferStore.getState().activeBufferId).toBe('0xabc');
    });
  });

  describe('line list (listlines)', () => {
    it('populates messages from hdata line response', () => {
      const tagsArray: WeechatArray = {
        type: 'str',
        values: ['irc_privmsg', 'nick_alice'],
      };

      const hdata: WeechatHdata = {
        path: 'buffer/own_lines/last_line/data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'tags_array', type: 'arr' },
          { name: 'displayed', type: 'chr' },
          { name: 'notify', type: 'int' },
        ],
        entries: [
          {
            pointers: ['0xbuf', '0xlines', '0xline1', '0xdata1'],
            values: {
              buffer: '0xbuf',
              date: new Date('2024-01-15T10:00:00Z'),
              prefix: 'alice',
              message: 'Hello',
              highlight: 0,
              tags_array: tagsArray,
              displayed: 1,
              notify: 1,
            },
          },
          {
            pointers: ['0xbuf', '0xlines', '0xline2', '0xdata2'],
            values: {
              buffer: '0xbuf',
              date: new Date('2024-01-15T10:01:00Z'),
              prefix: 'bob',
              message: 'World',
              highlight: 0,
              tags_array: { type: 'str', values: ['irc_privmsg'] } as WeechatArray,
              displayed: 1,
              notify: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('listlines', hdata));
      const msgs = useMessageStore.getState().messages['0xbuf'];
      expect(msgs).toHaveLength(2);
      expect(msgs[0].message).toBe('Hello');
      expect(msgs[1].message).toBe('World');
    });

    it('prepends lines to existing messages', () => {
      // Add an existing message first
      useMessageStore.getState().addMessage('0xbuf', {
        id: 'existing',
        bufferId: '0xbuf',
        date: new Date('2024-01-15T11:00:00Z'),
        prefix: 'charlie',
        message: 'Existing message',
        tags: [],
        highlight: false,
        displayed: true,
      });

      const hdata: WeechatHdata = {
        path: 'buffer/own_lines/last_line/data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'displayed', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xbuf', '0xlines', '0xline1', '0xdata1'],
            values: {
              buffer: '0xbuf',
              date: new Date('2024-01-15T09:00:00Z'),
              prefix: 'alice',
              message: 'Older message',
              highlight: 0,
              displayed: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('listlines', hdata));
      const msgs = useMessageStore.getState().messages['0xbuf'];
      expect(msgs).toHaveLength(2);
      // Older message should be first (prepended)
      expect(msgs[0].message).toBe('Older message');
      expect(msgs[1].message).toBe('Existing message');
    });
  });

  describe('_buffer_opened', () => {
    it('adds a new buffer', () => {
      const hdata: WeechatHdata = {
        path: 'buffer',
        keys: [
          { name: 'number', type: 'int' },
          { name: 'full_name', type: 'str' },
          { name: 'short_name', type: 'str' },
          { name: 'title', type: 'str' },
          { name: 'local_variables', type: 'htb' },
        ],
        entries: [
          {
            pointers: ['0xdef'],
            values: {
              number: 2,
              full_name: 'irc.libera.#test',
              short_name: '#test',
              title: 'Test channel',
              local_variables: makeLocalVarsHtb({
                type: 'channel',
                plugin: 'irc',
              }),
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_buffer_opened', hdata));
      expect(useBufferStore.getState().buffers['0xdef']).toBeDefined();
      expect(useBufferStore.getState().buffers['0xdef'].type).toBe('channel');
    });
  });

  describe('_buffer_closed', () => {
    it('removes a buffer', () => {
      useBufferStore.getState().addBuffer({
        id: '0xabc',
        fullName: 'core.weechat',
        shortName: 'weechat',
        title: '',
        type: 'server',
        number: 1,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      const hdata: WeechatHdata = {
        path: 'buffer',
        keys: [],
        entries: [{ pointers: ['0xabc'], values: {} }],
      };

      handleEvent(makeHdataMessage('_buffer_closed', hdata));
      expect(useBufferStore.getState().buffers['0xabc']).toBeUndefined();
    });
  });

  describe('_buffer_line_added', () => {
    it('adds a message to the message store', () => {
      // Set up a buffer first
      useBufferStore.getState().addBuffer({
        id: '0xabc',
        fullName: 'core.weechat',
        shortName: 'weechat',
        title: '',
        type: 'server',
        number: 1,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      const tagsArray: WeechatArray = {
        type: 'str',
        values: ['irc_privmsg', 'nick_testuser'],
      };

      const hdata: WeechatHdata = {
        path: 'line_data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'tags_array', type: 'arr' },
          { name: 'displayed', type: 'chr' },
          { name: 'notify', type: 'int' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              buffer: '0xabc',
              date: new Date('2024-01-15T10:30:00Z'),
              prefix: 'testuser',
              message: 'Hello world',
              highlight: 0,
              tags_array: tagsArray,
              displayed: 1,
              notify: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_buffer_line_added', hdata));
      const msgs = useMessageStore.getState().messages['0xabc'];
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toBe('Hello world');
      expect(msgs[0].prefix).toBe('testuser');
    });

    it('parses WeeChat color codes from prefix and message', () => {
      useBufferStore.getState().addBuffer({
        id: '0xabc',
        fullName: 'core.weechat',
        shortName: 'weechat',
        title: '',
        type: 'server',
        number: 1,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      const hdata: WeechatHdata = {
        path: 'line_data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'displayed', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              buffer: '0xabc',
              date: new Date('2024-01-15T10:30:00Z'),
              // Prefix with WeeChat color codes: \x19F06@ \x19F@00006Bruce
              prefix: '\x19F06@\x19F@00006Bruce',
              message: '\x19F05Hello \x02bold\x02 world',
              highlight: 0,
              displayed: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_buffer_line_added', hdata));
      const msgs = useMessageStore.getState().messages['0xabc'];
      expect(msgs).toHaveLength(1);
      // prefix should be stripped of color codes
      expect(msgs[0].prefix).toBe('@Bruce');
      // message should be stripped of color codes
      expect(msgs[0].message).toBe('Hello bold world');
      // prefixSpans and spans should be populated
      expect(msgs[0].prefixSpans).toBeDefined();
      expect(msgs[0].prefixSpans!.length).toBeGreaterThan(0);
      expect(msgs[0].spans).toBeDefined();
      expect(msgs[0].spans!.length).toBeGreaterThan(0);
    });

    it('increments unread count for non-active buffer', () => {
      useBufferStore.getState().addBuffer({
        id: '0xabc',
        fullName: 'core.weechat',
        shortName: 'weechat',
        title: '',
        type: 'server',
        number: 1,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });
      // Active buffer is null, so 0xabc is not active
      const hdata: WeechatHdata = {
        path: 'line_data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'displayed', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              buffer: '0xabc',
              date: new Date(),
              prefix: 'user',
              message: 'msg',
              highlight: 0,
              displayed: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_buffer_line_added', hdata));
      expect(useBufferStore.getState().buffers['0xabc'].unreadCount).toBe(1);
    });

    it('increments highlight count on highlight', () => {
      useBufferStore.getState().addBuffer({
        id: '0xabc',
        fullName: 'core.weechat',
        shortName: 'weechat',
        title: '',
        type: 'server',
        number: 1,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      const hdata: WeechatHdata = {
        path: 'line_data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'displayed', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              buffer: '0xabc',
              date: new Date(),
              prefix: 'user',
              message: 'hey @me!',
              highlight: 1,
              displayed: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_buffer_line_added', hdata));
      expect(useBufferStore.getState().buffers['0xabc'].highlightCount).toBe(1);
      expect(useBufferStore.getState().buffers['0xabc'].unreadCount).toBe(1);
    });
  });

  describe('_nicklist', () => {
    it('populates nicklist for a buffer', () => {
      const hdata: WeechatHdata = {
        path: 'nicklist_item',
        keys: [
          { name: 'group', type: 'chr' },
          { name: 'level', type: 'int' },
          { name: 'name', type: 'str' },
          { name: 'color', type: 'str' },
          { name: 'prefix', type: 'str' },
          { name: 'prefix_color', type: 'str' },
          { name: 'visible', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              group: 1,
              level: 0,
              name: 'root',
              color: '',
              prefix: '',
              prefix_color: '',
              visible: 0,
            },
          },
          {
            pointers: ['0xabc'],
            values: {
              group: 0,
              level: 0,
              name: 'alice',
              color: '',
              prefix: '@',
              prefix_color: 'green',
              visible: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_nicklist', hdata));
      const nicks = useNicklistStore.getState().nicklists['0xabc'];
      // Groups are filtered out
      expect(nicks).toHaveLength(1);
      expect(nicks[0].name).toBe('alice');
    });
  });

  describe('_nicklist_diff', () => {
    it('applies nick additions', () => {
      useNicklistStore.getState().setNicklist('0xabc', []);

      const hdata: WeechatHdata = {
        path: 'nicklist_item',
        keys: [
          { name: '_diff', type: 'chr' },
          { name: 'group', type: 'chr' },
          { name: 'name', type: 'str' },
          { name: 'color', type: 'str' },
          { name: 'prefix', type: 'str' },
          { name: 'prefix_color', type: 'str' },
          { name: 'visible', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              _diff: 43, // '+'
              group: 0,
              name: 'newuser',
              color: '',
              prefix: '',
              prefix_color: '',
              visible: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_nicklist_diff', hdata));
      const nicks = useNicklistStore.getState().nicklists['0xabc'];
      expect(nicks).toHaveLength(1);
      expect(nicks[0].name).toBe('newuser');
    });
  });

  describe('nicklist with custom id (nicklist_{pointer})', () => {
    it('routes nicklist_0xabc to handleNicklist', () => {
      const hdata: WeechatHdata = {
        path: 'nicklist_item',
        keys: [
          { name: 'group', type: 'chr' },
          { name: 'level', type: 'int' },
          { name: 'name', type: 'str' },
          { name: 'color', type: 'str' },
          { name: 'prefix', type: 'str' },
          { name: 'prefix_color', type: 'str' },
          { name: 'visible', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              group: 0,
              level: 0,
              name: 'alice',
              color: '',
              prefix: '@',
              prefix_color: 'green',
              visible: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('nicklist_0xabc', hdata));
      const nicks = useNicklistStore.getState().nicklists['0xabc'];
      expect(nicks).toHaveLength(1);
      expect(nicks[0].name).toBe('alice');
    });

    it('routes nicklist_irc.libera.#test to handleNicklist', () => {
      const hdata: WeechatHdata = {
        path: 'nicklist_item',
        keys: [
          { name: 'group', type: 'chr' },
          { name: 'level', type: 'int' },
          { name: 'name', type: 'str' },
          { name: 'color', type: 'str' },
          { name: 'prefix', type: 'str' },
          { name: 'prefix_color', type: 'str' },
          { name: 'visible', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xdef'],
            values: {
              group: 0,
              level: 0,
              name: 'bob',
              color: '',
              prefix: '',
              prefix_color: '',
              visible: 1,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('nicklist_irc.libera.#test', hdata));
      const nicks = useNicklistStore.getState().nicklists['0xdef'];
      expect(nicks).toHaveLength(1);
      expect(nicks[0].name).toBe('bob');
    });
  });

  describe('hotlist (listhotlist)', () => {
    it('updates unread and highlight counts from hotlist data', () => {
      // Set up buffers first
      useBufferStore.getState().addBuffer({
        id: '0xbuf1',
        fullName: 'irc.libera.#channel1',
        shortName: '#channel1',
        title: '',
        type: 'channel',
        number: 2,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });
      useBufferStore.getState().addBuffer({
        id: '0xbuf2',
        fullName: 'irc.libera.#channel2',
        shortName: '#channel2',
        title: '',
        type: 'channel',
        number: 3,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      const hdata: WeechatHdata = {
        path: 'hotlist',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'count', type: 'arr' },
        ],
        entries: [
          {
            pointers: ['0xhotlist1'],
            values: {
              buffer: '0xbuf1',
              count: { type: 'int', values: [0, 5, 2, 1] } as WeechatArray,
            },
          },
          {
            pointers: ['0xhotlist2'],
            values: {
              buffer: '0xbuf2',
              count: { type: 'int', values: [3, 10, 0, 0] } as WeechatArray,
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('listhotlist', hdata));

      const bufs = useBufferStore.getState().buffers;
      // buf1: messages(5) + private(2) = 7 unread, 1 highlight
      expect(bufs['0xbuf1'].unreadCount).toBe(7);
      expect(bufs['0xbuf1'].highlightCount).toBe(1);
      // buf2: messages(10) + private(0) = 10 unread, 0 highlight
      expect(bufs['0xbuf2'].unreadCount).toBe(10);
      expect(bufs['0xbuf2'].highlightCount).toBe(0);
    });

    it('ignores hotlist entries for unknown buffers', () => {
      const hdata: WeechatHdata = {
        path: 'hotlist',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'count', type: 'arr' },
        ],
        entries: [
          {
            pointers: ['0xhotlist1'],
            values: {
              buffer: '0xunknown',
              count: { type: 'int', values: [0, 5, 2, 1] } as WeechatArray,
            },
          },
        ],
      };

      // Should not throw
      handleEvent(makeHdataMessage('listhotlist', hdata));
      expect(useBufferStore.getState().buffers['0xunknown']).toBeUndefined();
    });
  });

  describe('message ID stability', () => {
    it('generates stable message IDs based on content', () => {
      const tagsArray: WeechatArray = {
        type: 'str',
        values: ['irc_privmsg'],
      };

      const hdata: WeechatHdata = {
        path: 'buffer/own_lines/last_line/data',
        keys: [
          { name: 'buffer', type: 'ptr' },
          { name: 'date', type: 'tim' },
          { name: 'prefix', type: 'str' },
          { name: 'message', type: 'str' },
          { name: 'highlight', type: 'chr' },
          { name: 'tags_array', type: 'arr' },
          { name: 'displayed', type: 'chr' },
        ],
        entries: [
          {
            pointers: ['0xbuf', '0xlines', '0xline1', '0xdata1'],
            values: {
              buffer: '0xbuf',
              date: new Date('2024-01-15T10:00:00Z'),
              prefix: 'alice',
              message: 'Hello world',
              highlight: 0,
              tags_array: tagsArray,
              displayed: 1,
            },
          },
        ],
      };

      // Process same message twice
      handleEvent(makeHdataMessage('listlines', hdata));
      handleEvent(makeHdataMessage('listlines', hdata));

      const msgs = useMessageStore.getState().messages['0xbuf'];
      // Should be deduplicated to 1 message
      expect(msgs).toHaveLength(1);
    });
  });

  describe('_buffer_renamed', () => {
    it('updates buffer name', () => {
      useBufferStore.getState().addBuffer({
        id: '0xabc',
        fullName: 'irc.libera.#old',
        shortName: '#old',
        title: '',
        type: 'channel',
        number: 2,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      const hdata: WeechatHdata = {
        path: 'buffer',
        keys: [
          { name: 'full_name', type: 'str' },
          { name: 'short_name', type: 'str' },
        ],
        entries: [
          {
            pointers: ['0xabc'],
            values: {
              full_name: 'irc.libera.#new',
              short_name: '#new',
            },
          },
        ],
      };

      handleEvent(makeHdataMessage('_buffer_renamed', hdata));
      expect(useBufferStore.getState().buffers['0xabc'].fullName).toBe('irc.libera.#new');
      expect(useBufferStore.getState().buffers['0xabc'].shortName).toBe('#new');
    });
  });
});
