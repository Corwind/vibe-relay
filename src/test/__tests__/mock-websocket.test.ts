import { describe, it, expect, vi } from 'vitest';
import { MockWebSocket } from '../helpers/mock-websocket';

describe('MockWebSocket', () => {
  describe('constructor', () => {
    it('sets url and initial state', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(ws.url).toBe('ws://localhost:9001');
      expect(ws.readyState).toBe(MockWebSocket.CONNECTING);
      expect(ws.binaryType).toBe('blob');
      expect(ws.sentData).toEqual([]);
    });

    it('has correct static constants', () => {
      expect(MockWebSocket.CONNECTING).toBe(0);
      expect(MockWebSocket.OPEN).toBe(1);
      expect(MockWebSocket.CLOSING).toBe(2);
      expect(MockWebSocket.CLOSED).toBe(3);
    });
  });

  describe('send', () => {
    it('captures string data when open', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();
      ws.send('hello');
      ws.send('world');

      expect(ws.sentData).toEqual(['hello', 'world']);
    });

    it('captures ArrayBuffer data when open', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();
      const buf = new ArrayBuffer(4);
      ws.send(buf);

      expect(ws.sentData).toHaveLength(1);
      expect(ws.sentData[0]).toBe(buf);
    });

    it('throws when not open', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(() => ws.send('test')).toThrow('WebSocket not open');
    });

    it('throws when closed', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();
      ws.simulateClose();
      expect(() => ws.send('test')).toThrow('WebSocket not open');
    });
  });

  describe('close', () => {
    it('transitions through CLOSING to CLOSED', async () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();

      const onclose = vi.fn();
      ws.onclose = onclose;

      ws.close(1000, 'done');
      expect(ws.readyState).toBe(MockWebSocket.CLOSING);

      // Wait for async close callback
      await vi.waitFor(() => {
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      });
      expect(onclose).toHaveBeenCalledOnce();
      expect(onclose.mock.calls[0][0].code).toBe(1000);
      expect(onclose.mock.calls[0][0].reason).toBe('done');
    });

    it('defaults to code 1000', async () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();

      const onclose = vi.fn();
      ws.onclose = onclose;

      ws.close();

      await vi.waitFor(() => {
        expect(onclose).toHaveBeenCalled();
      });
      expect(onclose.mock.calls[0][0].code).toBe(1000);
    });
  });

  describe('simulateOpen', () => {
    it('sets readyState to OPEN and fires onopen', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      const onopen = vi.fn();
      ws.onopen = onopen;

      ws.simulateOpen();

      expect(ws.readyState).toBe(MockWebSocket.OPEN);
      expect(onopen).toHaveBeenCalledOnce();
      expect(onopen.mock.calls[0][0]).toBeInstanceOf(Event);
    });

    it('works without onopen handler', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(() => ws.simulateOpen()).not.toThrow();
      expect(ws.readyState).toBe(MockWebSocket.OPEN);
    });
  });

  describe('simulateMessage', () => {
    it('fires onmessage with string data', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      const onmessage = vi.fn();
      ws.onmessage = onmessage;

      ws.simulateMessage('hello');

      expect(onmessage).toHaveBeenCalledOnce();
      expect(onmessage.mock.calls[0][0].data).toBe('hello');
    });

    it('fires onmessage with ArrayBuffer data', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      const onmessage = vi.fn();
      ws.onmessage = onmessage;

      const buf = new ArrayBuffer(8);
      ws.simulateMessage(buf);

      expect(onmessage).toHaveBeenCalledOnce();
      expect(onmessage.mock.calls[0][0].data).toBe(buf);
    });

    it('works without onmessage handler', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(() => ws.simulateMessage('test')).not.toThrow();
    });
  });

  describe('simulateError', () => {
    it('fires onerror', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      const onerror = vi.fn();
      ws.onerror = onerror;

      ws.simulateError(new Error('connection failed'));

      expect(onerror).toHaveBeenCalledOnce();
      expect(onerror.mock.calls[0][0]).toBeInstanceOf(ErrorEvent);
    });

    it('works without error argument', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      const onerror = vi.fn();
      ws.onerror = onerror;

      ws.simulateError();
      expect(onerror).toHaveBeenCalledOnce();
    });

    it('works without onerror handler', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(() => ws.simulateError()).not.toThrow();
    });
  });

  describe('simulateClose', () => {
    it('sets readyState to CLOSED and fires onclose', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();

      const onclose = vi.fn();
      ws.onclose = onclose;

      ws.simulateClose(1006, 'abnormal');

      expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      expect(onclose).toHaveBeenCalledOnce();
      expect(onclose.mock.calls[0][0].code).toBe(1006);
      expect(onclose.mock.calls[0][0].reason).toBe('abnormal');
    });

    it('defaults to code 1000 and empty reason', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      const onclose = vi.fn();
      ws.onclose = onclose;

      ws.simulateClose();

      expect(onclose.mock.calls[0][0].code).toBe(1000);
      expect(onclose.mock.calls[0][0].reason).toBe('');
    });

    it('works without onclose handler', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(() => ws.simulateClose()).not.toThrow();
    });
  });

  describe('getLastSentString', () => {
    it('returns undefined when nothing sent', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(ws.getLastSentString()).toBeUndefined();
    });

    it('returns string data as-is', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();
      ws.send('init password=test');
      expect(ws.getLastSentString()).toBe('init password=test');
    });

    it('decodes ArrayBuffer to string', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();
      const encoder = new TextEncoder();
      ws.send(encoder.encode('binary data').buffer);
      expect(ws.getLastSentString()).toBe('binary data');
    });

    it('returns last sent item', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      ws.simulateOpen();
      ws.send('first');
      ws.send('second');
      ws.send('third');
      expect(ws.getLastSentString()).toBe('third');
    });
  });

  describe('readyState transitions', () => {
    it('follows CONNECTING -> OPEN -> CLOSED lifecycle', () => {
      const ws = new MockWebSocket('ws://localhost:9001');
      expect(ws.readyState).toBe(MockWebSocket.CONNECTING);

      ws.simulateOpen();
      expect(ws.readyState).toBe(MockWebSocket.OPEN);

      ws.simulateClose();
      expect(ws.readyState).toBe(MockWebSocket.CLOSED);
    });
  });
});
