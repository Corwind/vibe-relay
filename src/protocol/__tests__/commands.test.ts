import { describe, it, expect } from 'vitest';
import {
  handshake,
  init,
  hdata,
  info,
  input,
  sync,
  desync,
  nicklist,
  ping,
  completion,
  quit,
} from '../commands';

describe('commands', () => {
  describe('handshake', () => {
    it('builds handshake with all params', () => {
      const result = handshake({
        password_hash_algo: 'pbkdf2+sha512:sha512:sha256:plain',
        compression: 'zstd:zlib:off',
        totp: true,
      });
      expect(result).toBe(
        '(handshake) handshake password_hash_algo=pbkdf2+sha512:sha512:sha256:plain,compression=zstd:zlib:off,totp=on\n',
      );
    });

    it('builds handshake with totp off', () => {
      const result = handshake({ totp: false });
      expect(result).toBe('(handshake) handshake totp=off\n');
    });

    it('builds handshake with only algo', () => {
      const result = handshake({ password_hash_algo: 'sha256' });
      expect(result).toBe(
        '(handshake) handshake password_hash_algo=sha256\n',
      );
    });
  });

  describe('init', () => {
    it('builds init without totp', () => {
      expect(init('mypassword')).toBe('init password=mypassword\n');
    });

    it('builds init with totp', () => {
      expect(init('mypassword', '123456')).toBe(
        'init password=mypassword,totp=123456\n',
      );
    });
  });

  describe('hdata', () => {
    it('builds hdata without keys', () => {
      expect(hdata('buffer:gui_buffers(*)')).toBe(
        '(hdata_buffer_gui_buffers(*)) hdata buffer:gui_buffers(*)\n',
      );
    });

    it('builds hdata with keys', () => {
      expect(hdata('buffer:gui_buffers(*)', ['number', 'name'])).toBe(
        '(hdata_buffer_gui_buffers(*)) hdata buffer:gui_buffers(*) number,name\n',
      );
    });
  });

  describe('info', () => {
    it('builds info command', () => {
      expect(info('version')).toBe('(info_version) info version\n');
    });
  });

  describe('input', () => {
    it('builds input command', () => {
      expect(input('core.weechat', '/help')).toBe(
        'input core.weechat /help\n',
      );
    });
  });

  describe('sync', () => {
    it('builds sync without args', () => {
      expect(sync()).toBe('sync\n');
    });

    it('builds sync with buffer', () => {
      expect(sync('*')).toBe('sync *\n');
    });

    it('builds sync with buffer and options', () => {
      expect(sync('*', 'buffer,nicklist')).toBe('sync * buffer,nicklist\n');
    });
  });

  describe('desync', () => {
    it('builds desync without args', () => {
      expect(desync()).toBe('desync\n');
    });

    it('builds desync with args', () => {
      expect(desync('*', 'nicklist')).toBe('desync * nicklist\n');
    });
  });

  describe('nicklist', () => {
    it('builds nicklist without buffer', () => {
      expect(nicklist()).toBe('(nicklist) nicklist\n');
    });

    it('builds nicklist with buffer', () => {
      expect(nicklist('irc.libera.#test')).toBe(
        '(nicklist_irc.libera.#test) nicklist irc.libera.#test\n',
      );
    });
  });

  describe('ping', () => {
    it('builds ping without data', () => {
      expect(ping()).toBe('ping\n');
    });

    it('builds ping with data', () => {
      expect(ping('test123')).toBe('ping test123\n');
    });
  });

  describe('completion', () => {
    it('builds completion without data', () => {
      expect(completion('core.weechat', 5)).toBe(
        '(completion) completion core.weechat 5\n',
      );
    });

    it('builds completion with data', () => {
      expect(completion('core.weechat', 3, '/hel')).toBe(
        '(completion) completion core.weechat 3 /hel\n',
      );
    });
  });

  describe('quit', () => {
    it('builds quit command', () => {
      expect(quit()).toBe('quit\n');
    });
  });
});
