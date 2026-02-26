import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RelayConnection } from '../connection';

// Mock WebSocket
class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  binaryType: BinaryType = 'blob';
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  sentData: (string | ArrayBuffer)[] = [];

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string | ArrayBuffer) {
    this.sentData.push(data);
  }

  close(_code?: number, _reason?: string) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code: _code ?? 1000, reason: _reason }));
  }

  simulateOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }
}

describe('RelayConnection', () => {
  let connection: RelayConnection;
  let originalWebSocket: typeof globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    originalWebSocket = globalThis.WebSocket;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.WebSocket = FakeWebSocket as any;
    connection = new RelayConnection();
  });

  afterEach(() => {
    connection.disconnect();
    globalThis.WebSocket = originalWebSocket;
  });

  it('creates WebSocket with correct URL for SSL', () => {
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toBe('wss://example.com:9001/weechat');
    expect(FakeWebSocket.instances[0].binaryType).toBe('arraybuffer');
  });

  it('creates WebSocket with ws:// for non-SSL', () => {
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: false,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    expect(FakeWebSocket.instances[0].url).toBe('ws://example.com:9001/weechat');
  });

  it('calls onOpen when WebSocket opens', () => {
    const onOpen = vi.fn();
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen,
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    FakeWebSocket.instances[0].simulateOpen();
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('calls onClose when WebSocket closes', () => {
    const onClose = vi.fn();
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose,
      onError: vi.fn(),
    });

    FakeWebSocket.instances[0].simulateOpen();
    FakeWebSocket.instances[0].simulateClose(1000, 'normal');
    expect(onClose).toHaveBeenCalledWith(1000, 'normal');
  });

  it('calls onError on WebSocket error', () => {
    const onError = vi.fn();
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError,
    });

    FakeWebSocket.instances[0].simulateError();
    expect(onError).toHaveBeenCalledWith('WebSocket connection error');
  });

  it('sends data when connected', () => {
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    FakeWebSocket.instances[0].simulateOpen();
    connection.send('test data');
    expect(FakeWebSocket.instances[0].sentData).toContain('test data');
  });

  it('does not send when disconnected', () => {
    connection.send('test');
    // No WebSocket created, no error thrown
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('reports isConnected correctly', () => {
    expect(connection.isConnected()).toBe(false);

    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    expect(connection.isConnected()).toBe(false);
    FakeWebSocket.instances[0].simulateOpen();
    expect(connection.isConnected()).toBe(true);
  });

  it('disconnects cleanly', () => {
    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    FakeWebSocket.instances[0].simulateOpen();
    connection.disconnect();
    expect(connection.isConnected()).toBe(false);
  });

  it('schedules reconnect on abnormal close', () => {
    vi.useFakeTimers();

    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    FakeWebSocket.instances[0].simulateOpen();
    // Simulate abnormal close
    FakeWebSocket.instances[0].simulateClose(1006, 'abnormal');

    expect(FakeWebSocket.instances).toHaveLength(1);

    // Advance past reconnect delay
    vi.advanceTimersByTime(1500);
    expect(FakeWebSocket.instances).toHaveLength(2);

    vi.useRealTimers();
  });

  it('does not reconnect on normal close (1000)', () => {
    vi.useFakeTimers();

    connection.connect({
      host: 'example.com',
      port: 9001,
      ssl: true,
      onMessage: vi.fn(),
      onOpen: vi.fn(),
      onClose: vi.fn(),
      onError: vi.fn(),
    });

    FakeWebSocket.instances[0].simulateOpen();
    FakeWebSocket.instances[0].simulateClose(1000, 'normal');

    vi.advanceTimersByTime(5000);
    expect(FakeWebSocket.instances).toHaveLength(1);

    vi.useRealTimers();
  });
});
