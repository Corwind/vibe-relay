import { describe, it, expect, beforeEach } from 'vitest';
import { BinaryBuilder } from './helpers/binary-builder';
import { handleEvent } from '@/relay/event-handler';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useNicklistStore } from '@/store/nicklist-store';
import { useConnectionStore } from '@/store/connection-store';
import { parseMessage } from '@/protocol/message';
import {
  createBufferListResponse,
  createLineAddedEvent,
  createNicklistResponse,
  createNicklistDiffEvent,
} from './fixtures/binary-messages';

function resetAllStores(): void {
  useBufferStore.setState({
    buffers: {},
    activeBufferId: null,
  });
  useMessageStore.setState({ messages: {} });
  useNicklistStore.setState({ nicklists: {} });
  useConnectionStore.getState().reset();
}

describe('store integration', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('buffer list population via event handler', () => {
    it('populates buffer store from buffer list hdata response', () => {
      const msg = parseMessage(createBufferListResponse());
      handleEvent({ ...msg, id: 'listbuffers' });

      const buffers = useBufferStore.getState().buffers;
      const bufferList = Object.values(buffers);

      expect(bufferList).toHaveLength(3);

      const core = bufferList.find((b) => b.fullName === 'core.weechat');
      expect(core).toBeDefined();
      expect(core!.shortName).toBe('weechat');
      expect(core!.number).toBe(1);
      expect(core!.type).toBe('server'); // core plugin -> server type

      const server = bufferList.find((b) => b.fullName === 'irc.server.libera');
      expect(server).toBeDefined();
      expect(server!.localVariables['type']).toBe('server');

      const channel = bufferList.find((b) => b.fullName === 'irc.libera.#weechat');
      expect(channel).toBeDefined();
      expect(channel!.type).toBe('channel');
      expect(channel!.localVariables['server']).toBe('libera');
    });

    it('auto-selects first buffer when none is active', () => {
      const msg = parseMessage(createBufferListResponse());
      handleEvent({ ...msg, id: 'listbuffers' });

      const activeId = useBufferStore.getState().activeBufferId;
      expect(activeId).not.toBeNull();

      // The first buffer pointer in the fixture is 0x1a2b3c
      expect(activeId).toBe('0x1a2b3c');
    });
  });

  describe('line added event -> message store + unread count', () => {
    it('adds message to message store for the correct buffer', () => {
      // First populate buffers so unread counting works
      const bufMsg = parseMessage(createBufferListResponse());
      handleEvent({ ...bufMsg, id: 'listbuffers' });

      // Set active to a different buffer so unread increments
      useBufferStore.getState().setActiveBuffer('0x1a2b3c');

      // Now fire a line added event (targets buffer 0x7a8b9c)
      const lineMsg = parseMessage(createLineAddedEvent());
      handleEvent(lineMsg);

      const messages = useMessageStore.getState().messages['0x7a8b9c'];
      expect(messages).toBeDefined();
      expect(messages).toHaveLength(1);
      expect(messages[0].bufferId).toBe('0x7a8b9c');
      expect(typeof messages[0].message).toBe('string');
      expect(messages[0].tags).toContain('irc_privmsg');
    });

    it('increments unread count when message arrives for non-active buffer', () => {
      // Populate buffers
      const bufMsg = parseMessage(createBufferListResponse());
      handleEvent({ ...bufMsg, id: 'listbuffers' });

      // Set active to core buffer, not the channel
      useBufferStore.getState().setActiveBuffer('0x1a2b3c');

      // Fire line added for channel buffer (0x7a8b9c)
      const lineMsg = parseMessage(createLineAddedEvent());
      handleEvent(lineMsg);

      const channelBuffer = useBufferStore.getState().buffers['0x7a8b9c'];
      expect(channelBuffer.unreadCount).toBe(1);
    });

    it('does NOT increment unread count when message arrives for active buffer', () => {
      // Populate buffers
      const bufMsg = parseMessage(createBufferListResponse());
      handleEvent({ ...bufMsg, id: 'listbuffers' });

      // Set active to the channel buffer that will receive the message
      useBufferStore.getState().setActiveBuffer('0x7a8b9c');

      const lineMsg = parseMessage(createLineAddedEvent());
      handleEvent(lineMsg);

      const channelBuffer = useBufferStore.getState().buffers['0x7a8b9c'];
      expect(channelBuffer.unreadCount).toBe(0);
    });

    it('accumulates unread count across multiple messages', () => {
      const bufMsg = parseMessage(createBufferListResponse());
      handleEvent({ ...bufMsg, id: 'listbuffers' });
      useBufferStore.getState().setActiveBuffer('0x1a2b3c');

      // Send 3 messages to the channel buffer
      for (let i = 0; i < 3; i++) {
        const lineMsg = parseMessage(createLineAddedEvent());
        handleEvent(lineMsg);
      }

      const channelBuffer = useBufferStore.getState().buffers['0x7a8b9c'];
      expect(channelBuffer.unreadCount).toBe(3);
    });
  });

  describe('nicklist handling', () => {
    it('populates nicklist store from nicklist response', () => {
      const msg = parseMessage(createNicklistResponse());
      handleEvent({ ...msg, id: '_nicklist' });

      // Nicklist groups nicks by buffer pointer (0x7a8b9c in fixture)
      const nicks = useNicklistStore.getState().nicklists['0x7a8b9c'];
      expect(nicks).toBeDefined();
      // Should contain actual nicks (not group entries)
      expect(nicks.length).toBeGreaterThan(0);

      const nickNames = nicks.map((n) => n.name);
      expect(nickNames).toContain('admin_nick');
      expect(nickNames).toContain('voiced_nick');
      expect(nickNames).toContain('regular_nick');
    });

    it('applies nicklist diff to add a nick', () => {
      // First set initial nicklist that includes nicks the diff will operate on
      const nickMsg = parseMessage(createNicklistResponse());
      handleEvent({ ...nickMsg, id: '_nicklist' });

      // Manually add leaving_user and promoted_user so the diff operations apply
      const initial = useNicklistStore.getState().nicklists['0x7a8b9c'];
      useNicklistStore.getState().setNicklist('0x7a8b9c', [
        ...initial,
        { name: 'leaving_user', prefix: ' ', color: '', visible: true, group: '', level: 0 },
        {
          name: 'promoted_user',
          prefix: ' ',
          color: 'default',
          visible: true,
          group: '',
          level: 0,
        },
      ]);

      const before = useNicklistStore.getState().nicklists['0x7a8b9c'];
      const beforeCount = before.length; // 3 nicks + 2 added = 5

      // Apply diff that adds new_user, removes leaving_user, updates promoted_user
      const diffMsg = parseMessage(createNicklistDiffEvent());
      handleEvent(diffMsg);

      const after = useNicklistStore.getState().nicklists['0x7a8b9c'];
      const afterNames = after.map((n) => n.name);
      expect(afterNames).toContain('new_user');
      expect(afterNames).not.toContain('leaving_user');
      // Net change: +1 (add new_user) -1 (remove leaving_user) = 0 size change
      // promoted_user update is in-place
      expect(after.length).toBe(beforeCount);
    });

    it('applies nicklist diff to remove a nick', () => {
      // Setup: add a nicklist with the nick that will be removed
      useNicklistStore.getState().setNicklist('0x7a8b9c', [
        { name: 'leaving_user', prefix: ' ', color: '', visible: true, group: '', level: 0 },
        { name: 'staying_user', prefix: ' ', color: '', visible: true, group: '', level: 0 },
      ]);

      // Build a diff event that only removes leaving_user
      const builder = new BinaryBuilder();
      builder.writeObject('hda', {
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
            pointers: ['0x7a8b9c'],
            values: [45, 0, 'leaving_user', '', '', '', 0], // '-' = 45
          },
        ],
      });
      const msg = parseMessage(builder.buildMessage('_nicklist_diff', 0));
      handleEvent(msg);

      const nicks = useNicklistStore.getState().nicklists['0x7a8b9c'];
      expect(nicks).toHaveLength(1);
      expect(nicks[0].name).toBe('staying_user');
    });

    it('applies nicklist diff to update a nick', () => {
      useNicklistStore
        .getState()
        .setNicklist('0x7a8b9c', [
          { name: 'some_user', prefix: ' ', color: 'default', visible: true, group: '', level: 0 },
        ]);

      const builder = new BinaryBuilder();
      builder.writeObject('hda', {
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
            pointers: ['0x7a8b9c'],
            values: [42, 0, 'some_user', 'weechat.color.nicklist_nick', '@', 'lightgreen', 1], // '*' = 42
          },
        ],
      });
      const msg = parseMessage(builder.buildMessage('_nicklist_diff', 0));
      handleEvent(msg);

      const nicks = useNicklistStore.getState().nicklists['0x7a8b9c'];
      expect(nicks).toHaveLength(1);
      expect(nicks[0].name).toBe('some_user');
      expect(nicks[0].prefix).toBe('@');
    });
  });

  describe('buffer selection and unread clearing', () => {
    it('clears unread count when buffer is selected', () => {
      // Populate buffers
      const bufMsg = parseMessage(createBufferListResponse());
      handleEvent({ ...bufMsg, id: 'listbuffers' });

      // Set active to core buffer
      useBufferStore.getState().setActiveBuffer('0x1a2b3c');

      // Send message to channel buffer -> unread increments
      const lineMsg = parseMessage(createLineAddedEvent());
      handleEvent(lineMsg);
      expect(useBufferStore.getState().buffers['0x7a8b9c'].unreadCount).toBe(1);

      // Now select the channel buffer and clear unreads
      useBufferStore.getState().setActiveBuffer('0x7a8b9c');
      useBufferStore.getState().clearUnread('0x7a8b9c');

      expect(useBufferStore.getState().buffers['0x7a8b9c'].unreadCount).toBe(0);
      expect(useBufferStore.getState().buffers['0x7a8b9c'].highlightCount).toBe(0);
    });
  });

  describe('buffer open and close events', () => {
    it('adds a new buffer on _buffer_opened event', () => {
      const builder = new BinaryBuilder();
      builder.writeObject('hda', {
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
            pointers: ['0xnewbuf'],
            values: [
              4,
              'irc.libera.#newtopic',
              '#newtopic',
              'New channel',
              0,
              0,
              {
                keyType: 'str',
                valueType: 'str',
                entries: [
                  ['type', 'channel'],
                  ['plugin', 'irc'],
                ] as [unknown, unknown][],
              },
            ],
          },
        ],
      });

      const msg = parseMessage(builder.buildMessage('_buffer_opened', 0));
      handleEvent(msg);

      const buffers = useBufferStore.getState().buffers;
      expect(buffers['0xnewbuf']).toBeDefined();
      expect(buffers['0xnewbuf'].fullName).toBe('irc.libera.#newtopic');
      expect(buffers['0xnewbuf'].type).toBe('channel');
    });

    it('removes a buffer on _buffer_closed event', () => {
      // First add a buffer
      useBufferStore.getState().addBuffer({
        id: '0xtarget',
        fullName: 'irc.libera.#removeme',
        shortName: '#removeme',
        title: '',
        type: 'channel',
        number: 5,
        unreadCount: 0,
        highlightCount: 0,
        isActive: false,
        nicklistVisible: true,
        localVariables: {},
      });

      expect(useBufferStore.getState().buffers['0xtarget']).toBeDefined();

      const builder = new BinaryBuilder();
      builder.writeObject('hda', {
        path: 'buffer',
        keys: [],
        entries: [
          {
            pointers: ['0xtarget'],
            values: [],
          },
        ],
      });
      const msg = parseMessage(builder.buildMessage('_buffer_closed', 0));
      handleEvent(msg);

      expect(useBufferStore.getState().buffers['0xtarget']).toBeUndefined();
    });
  });

  describe('disconnect resets stores', () => {
    it('connection store resets on clean disconnect', () => {
      useConnectionStore.getState().setState('connected');
      expect(useConnectionStore.getState().state).toBe('connected');

      useConnectionStore.getState().reset();
      expect(useConnectionStore.getState().state).toBe('disconnected');
      expect(useConnectionStore.getState().error).toBeNull();
      expect(useConnectionStore.getState().latency).toBeNull();
    });

    it('connection store sets error on abnormal close', () => {
      useConnectionStore.getState().setState('connected');
      useConnectionStore.getState().setError('Connection lost: code 1006');

      expect(useConnectionStore.getState().state).toBe('disconnected');
      expect(useConnectionStore.getState().error).toBe('Connection lost: code 1006');
    });
  });

  describe('full flow simulation', () => {
    it('simulates connect -> buffers -> messages -> nicklist lifecycle', () => {
      // 1. Connection state changes
      useConnectionStore.getState().setState('connecting');
      expect(useConnectionStore.getState().state).toBe('connecting');

      useConnectionStore.getState().setState('authenticating');
      expect(useConnectionStore.getState().state).toBe('authenticating');

      useConnectionStore.getState().setState('connected');
      expect(useConnectionStore.getState().state).toBe('connected');

      // 2. Buffer list arrives
      const bufMsg = parseMessage(createBufferListResponse());
      handleEvent({ ...bufMsg, id: 'listbuffers' });

      const buffers = useBufferStore.getState().buffers;
      expect(Object.keys(buffers)).toHaveLength(3);
      expect(useBufferStore.getState().activeBufferId).toBe('0x1a2b3c');

      // 3. Switch to channel buffer
      useBufferStore.getState().setActiveBuffer('0x7a8b9c');
      expect(useBufferStore.getState().activeBufferId).toBe('0x7a8b9c');

      // 4. Nicklist arrives for channel
      const nickMsg = parseMessage(createNicklistResponse());
      handleEvent({ ...nickMsg, id: '_nicklist' });
      const nicks = useNicklistStore.getState().nicklists['0x7a8b9c'];
      expect(nicks.length).toBeGreaterThan(0);

      // 5. New message arrives for active buffer -> no unread increment
      const lineMsg = parseMessage(createLineAddedEvent());
      handleEvent(lineMsg);
      const msgs = useMessageStore.getState().messages['0x7a8b9c'];
      expect(msgs).toHaveLength(1);
      expect(useBufferStore.getState().buffers['0x7a8b9c'].unreadCount).toBe(0);

      // 6. Switch to core buffer
      useBufferStore.getState().setActiveBuffer('0x1a2b3c');

      // 7. Another message arrives for channel -> unread increments
      const lineMsg2 = parseMessage(createLineAddedEvent());
      handleEvent(lineMsg2);
      expect(useBufferStore.getState().buffers['0x7a8b9c'].unreadCount).toBe(1);
      expect(useMessageStore.getState().messages['0x7a8b9c']).toHaveLength(2);

      // 8. Nicklist diff arrives
      const diffMsg = parseMessage(createNicklistDiffEvent());
      handleEvent(diffMsg);
      const updatedNicks = useNicklistStore.getState().nicklists['0x7a8b9c'];
      expect(updatedNicks.map((n) => n.name)).toContain('new_user');

      // 9. Disconnect
      useConnectionStore.getState().reset();
      expect(useConnectionStore.getState().state).toBe('disconnected');
    });
  });
});
