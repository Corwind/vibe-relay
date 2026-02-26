import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RelaySession } from '../session';
import { useConnectionStore } from '@/store/connection-store';

// Mock the connection so we can control message flow
const mockSend = vi.fn();
const mockDisconnect = vi.fn();
const mockIsConnected = vi.fn(() => true);

vi.mock('../connection', () => ({
  RelayConnection: class MockRelayConnection {
    send = mockSend;
    disconnect = mockDisconnect;
    isConnected = mockIsConnected;
    private onMessageCb: ((msg: unknown) => void) | null = null;
    private onOpenCb: (() => void) | null = null;

    connect(opts: {
      onOpen: () => void;
      onMessage: (msg: unknown) => void;
      onClose: (code: number, reason: string) => void;
      onError: (error: string) => void;
    }) {
      this.onOpenCb = opts.onOpen;
      this.onMessageCb = opts.onMessage;
      // Simulate immediate open
      setTimeout(() => this.onOpenCb?.(), 0);
    }

    // Expose for test to inject messages
    _injectMessage(msg: unknown) {
      this.onMessageCb?.(msg);
    }
    _triggerOpen() {
      this.onOpenCb?.();
    }
  },
}));

// Mock auth module
vi.mock('@/protocol/auth', () => ({
  computeHash: vi.fn().mockResolvedValue('hashed_password_value'),
  generateClientNonce: vi.fn().mockReturnValue('client_nonce_hex'),
}));

describe('RelaySession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConnectionStore.getState().reset();
  });

  it('clears password from memory after successful authentication', async () => {
    const session = new RelaySession();
    session.connect('localhost', 9001, false, 'my_secret_password');

    // Access the private password field via type assertion
    const sessionAny = session as unknown as { password: string };
    expect(sessionAny.password).toBe('my_secret_password');

    // Wait for the connection open callback
    await vi.waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
    });

    // The first send should be the handshake command
    const handshakeCall = mockSend.mock.calls[0][0] as string;
    expect(handshakeCall).toContain('handshake');

    // Now simulate the handshake response
    // We need to get the connection instance and inject a message
    // The session's onMessage will process it
    const connectionAny = (
      session as unknown as { connection: { _injectMessage: (msg: unknown) => void } }
    ).connection;

    connectionAny._injectMessage({
      id: 'handshake',
      objects: [
        {
          type: 'htb',
          value: {
            entries: new Map([
              ['password_hash_algo', 'sha256'],
              ['nonce', 'deadbeef'],
            ]),
          },
        },
      ],
    });

    // Wait for the async handleHandshake to complete
    await vi.waitFor(() => {
      // After auth, init command should have been sent
      const initCalls = mockSend.mock.calls.filter((c: unknown[]) =>
        (c[0] as string).startsWith('init'),
      );
      expect(initCalls.length).toBe(1);
    });

    // Password should be cleared
    expect(sessionAny.password).toBe('');
  });

  it('clears password from memory even when authentication fails', async () => {
    // Override computeHash to reject
    const { computeHash } = await import('@/protocol/auth');
    (computeHash as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Hash failed'));

    const session = new RelaySession();
    session.connect('localhost', 9001, false, 'my_secret_password');

    const sessionAny = session as unknown as { password: string };
    expect(sessionAny.password).toBe('my_secret_password');

    await vi.waitFor(() => {
      expect(mockSend).toHaveBeenCalled();
    });

    const connectionAny = (
      session as unknown as { connection: { _injectMessage: (msg: unknown) => void } }
    ).connection;

    connectionAny._injectMessage({
      id: 'handshake',
      objects: [
        {
          type: 'htb',
          value: {
            entries: new Map([
              ['password_hash_algo', 'sha256'],
              ['nonce', 'deadbeef'],
            ]),
          },
        },
      ],
    });

    // Wait for the error to be set
    await vi.waitFor(() => {
      expect(useConnectionStore.getState().error).toBe('Hash failed');
    });

    // Password should still be cleared
    expect(sessionAny.password).toBe('');
  });

  it('sends quit command on disconnect when connected', () => {
    const session = new RelaySession();
    session.connect('localhost', 9001, false, 'password');

    session.disconnect();

    const quitCalls = mockSend.mock.calls.filter((c: unknown[]) =>
      (c[0] as string).includes('quit'),
    );
    expect(quitCalls.length).toBe(1);
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
