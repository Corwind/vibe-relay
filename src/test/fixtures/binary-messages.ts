import { BinaryBuilder } from '../helpers/binary-builder';

/**
 * Handshake response with supported hash algorithms.
 * Simulates: password_hash_algo, compression, and nonce fields.
 */
export function createHandshakeResponse(): ArrayBuffer {
  const nonce = Array.from({ length: 16 }, (_, i) =>
    ((i * 17 + 5) % 256).toString(16).padStart(2, '0'),
  ).join('');

  const builder = new BinaryBuilder();
  builder.writeObject('htb', {
    keyType: 'str',
    valueType: 'str',
    entries: [
      ['password_hash_algo', 'pbkdf2+sha512:sha512:sha256:plain'],
      ['compression', 'zstd:zlib:off'],
      ['nonce', nonce],
    ] as [unknown, unknown][],
  });
  return builder.buildMessage('handshake', 0);
}

/**
 * Buffer list hdata response with 3 typical buffers:
 * - core.weechat (core buffer)
 * - irc.server.libera (server buffer)
 * - irc.libera.#weechat (channel buffer)
 */
export function createBufferListResponse(): ArrayBuffer {
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
        pointers: ['0x1a2b3c'],
        values: [
          1,
          'core.weechat',
          'weechat',
          'WeeChat 4.1.0',
          0,
          0,
          {
            keyType: 'str',
            valueType: 'str',
            entries: [
              ['name', 'weechat'],
              ['plugin', 'core'],
            ] as [unknown, unknown][],
          },
        ],
      },
      {
        pointers: ['0x4d5e6f'],
        values: [
          2,
          'irc.server.libera',
          'libera',
          'IRC: irc.libera.chat/6697 (connected)',
          1,
          0,
          {
            keyType: 'str',
            valueType: 'str',
            entries: [
              ['name', 'server.libera'],
              ['plugin', 'irc'],
              ['type', 'server'],
            ] as [unknown, unknown][],
          },
        ],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [
          3,
          'irc.libera.#weechat',
          '#weechat',
          'Welcome to the WeeChat channel',
          0,
          0,
          {
            keyType: 'str',
            valueType: 'str',
            entries: [
              ['name', '#weechat'],
              ['plugin', 'irc'],
              ['type', 'channel'],
              ['server', 'libera'],
            ] as [unknown, unknown][],
          },
        ],
      },
    ],
  });
  return builder.buildMessage('listbuffers', 0);
}

/**
 * A _buffer_line_added event containing a single new message.
 * Pass a unique `seq` number to generate distinct messages (for deduplication).
 */
export function createLineAddedEvent(seq = 0): ArrayBuffer {
  const now = Math.floor(Date.now() / 1000) + seq;
  const builder = new BinaryBuilder();
  builder.writeObject('hda', {
    path: 'line_data',
    keys: [
      { name: 'buffer', type: 'ptr' },
      { name: 'date', type: 'tim' },
      { name: 'prefix', type: 'str' },
      { name: 'message', type: 'str' },
      { name: 'highlight', type: 'chr' },
      { name: 'tags_array', type: 'arr' },
      { name: 'displayed', type: 'chr' },
      { name: 'notify_level', type: 'int' },
    ],
    entries: [
      {
        pointers: ['0x7a8b9c'],
        values: [
          '0x7a8b9c',
          now,
          '\x19F12testuser',
          `Hello, \x1B[01mworld\x1B[0m! This is test message ${seq}.`,
          0,
          { type: 'str', values: ['irc_privmsg', 'nick_testuser', 'log1'] },
          1,
          1,
        ],
      },
    ],
  });
  return builder.buildMessage('_buffer_line_added', 0);
}

/**
 * Nicklist hdata response with groups and nicks.
 */
export function createNicklistResponse(): ArrayBuffer {
  const builder = new BinaryBuilder();
  builder.writeObject('hda', {
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
        pointers: ['0x7a8b9c'],
        values: [1, 0, 'root', '', '', '', 0],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [1, 1, '000|o', '', '', '', 1],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [0, 0, 'admin_nick', 'weechat.color.nicklist_nick', '@', 'lightgreen', 1],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [1, 1, '001|v', '', '', '', 1],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [0, 0, 'voiced_nick', 'weechat.color.nicklist_nick', '+', 'yellow', 1],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [1, 1, '999|...', '', '', '', 1],
      },
      {
        pointers: ['0x7a8b9c'],
        values: [0, 0, 'regular_nick', 'weechat.color.nicklist_nick', ' ', 'default', 1],
      },
    ],
  });
  return builder.buildMessage('nicklist', 0);
}

/**
 * A _nicklist_diff event with add, remove, and update operations.
 */
export function createNicklistDiffEvent(): ArrayBuffer {
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
        // '+' = 43 (add)
        pointers: ['0x7a8b9c'],
        values: [43, 0, 'new_user', 'weechat.color.nicklist_nick', ' ', 'default', 1],
      },
      {
        // '-' = 45 (remove)
        pointers: ['0x7a8b9c'],
        values: [45, 0, 'leaving_user', '', '', '', 0],
      },
      {
        // '*' = 42 (update)
        pointers: ['0x7a8b9c'],
        values: [42, 0, 'promoted_user', 'weechat.color.nicklist_nick', '@', 'lightgreen', 1],
      },
    ],
  });
  return builder.buildMessage('_nicklist_diff', 0);
}
