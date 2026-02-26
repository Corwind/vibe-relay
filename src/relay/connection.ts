import { parseMessage } from '@/protocol/message';
import type { WeechatMessage } from '@/protocol/types';

export type MessageHandler = (message: WeechatMessage) => void;

export interface ConnectionOptions {
  host: string;
  port: number;
  ssl: boolean;
  onMessage: MessageHandler;
  onOpen: () => void;
  onClose: (code: number, reason: string) => void;
  onError: (error: string) => void;
}

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;

export class RelayConnection {
  private ws: WebSocket | null = null;
  private options: ConnectionOptions | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  connect(options: ConnectionOptions): void {
    this.options = options;
    this.shouldReconnect = true;
    this.reconnectAttempt = 0;
    this.openSocket();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }
  }

  send(data: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /** Disable auto-reconnect without closing the socket (e.g., after auth failure). */
  disableReconnect(): void {
    this.shouldReconnect = false;
    this.clearReconnectTimer();
  }

  private openSocket(): void {
    if (!this.options) return;

    const { host, port, ssl } = this.options;
    const protocol = ssl ? 'wss' : 'ws';
    const url = `${protocol}://${host}:${port}/weechat`;

    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.options?.onOpen();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          try {
            const message = parseMessage(event.data);
            this.options?.onMessage(message);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to parse message';
            this.options?.onError(errorMessage);
          }
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.options?.onClose(event.code, event.reason);
        this.ws = null;
        if (this.shouldReconnect && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.options?.onError('WebSocket connection error');
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create WebSocket';
      this.options.onError(errorMessage);
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempt),
      MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
