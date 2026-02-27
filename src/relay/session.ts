import { RelayConnection } from './connection';
import { handleEvent } from './event-handler';
import { computeHash, generateClientNonce } from '@/protocol/auth';
import * as commands from '@/protocol/commands';
import type { WeechatMessage, WeechatHashtable, HashAlgorithm } from '@/protocol/types';
import { useConnectionStore } from '@/store/connection-store';

const PING_INTERVAL = 30000;
const ALGO_PREFERENCE = ['pbkdf2+sha512', 'pbkdf2+sha256', 'sha512', 'sha256', 'plain'] as const;

export class RelaySession {
  private connection: RelayConnection;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastPingTime: number | null = null;
  private password = '';

  constructor() {
    this.connection = new RelayConnection();
  }

  connect(host: string, port: number, ssl: boolean, password: string): void {
    this.password = password;
    useConnectionStore.getState().setState('connecting');

    this.connection.connect({
      host,
      port,
      ssl,
      onOpen: () => this.onOpen(),
      onMessage: (msg) => this.onMessage(msg),
      onClose: (code, reason) => this.onClose(code, reason),
      onError: (error) => this.onError(error),
    });
  }

  disconnect(): void {
    this.stopPing();
    if (this.connection.isConnected()) {
      this.connection.send(commands.quit());
    }
    this.connection.disconnect();
    useConnectionStore.getState().reset();
  }

  sendInput(buffer: string, text: string): void {
    this.connection.send(commands.input(buffer, text));
  }

  fetchLines(bufferPointer: string, count = 100): void {
    this.connection.send(
      commands.hdata(
        `buffer:${bufferPointer}/own_lines/last_line(-${count})/data`,
        ['buffer', 'date', 'prefix', 'message', 'highlight', 'tags_array', 'displayed', 'notify'],
        'listlines',
      ),
    );
  }

  fetchNicklist(bufferPointer?: string): void {
    this.connection.send(commands.nicklist(bufferPointer));
  }

  private onOpen(): void {
    useConnectionStore.getState().setState('authenticating');
    this.connection.send(
      commands.handshake({
        password_hash_algo: ALGO_PREFERENCE.join(':'),
        compression: 'zstd:zlib:off',
      }),
    );
  }

  private async onMessage(message: WeechatMessage): Promise<void> {
    if (message.id === 'handshake') {
      await this.handleHandshake(message);
      return;
    }

    if (message.id === '_pong') {
      if (this.lastPingTime !== null) {
        const latency = Date.now() - this.lastPingTime;
        useConnectionStore.getState().setLatency(latency);
        this.lastPingTime = null;
      }
      return;
    }

    handleEvent(message);
  }

  private async handleHandshake(message: WeechatMessage): Promise<void> {
    if (message.objects.length === 0) {
      this.onError('Empty handshake response');
      return;
    }

    const obj = message.objects[0];
    if (obj.type !== 'htb') {
      this.onError('Unexpected handshake response type');
      return;
    }

    const htb = obj.value as WeechatHashtable;
    const serverAlgo = htb.entries.get('password_hash_algo') as string | undefined;
    const serverNonce = htb.entries.get('nonce') as string | undefined;
    const serverIterations = htb.entries.get('password_hash_iterations') as string | undefined;

    if (!serverNonce) {
      this.onError('No nonce in handshake response');
      return;
    }

    const selectedAlgo = this.selectAlgorithm(serverAlgo ?? 'plain');
    if (!selectedAlgo) {
      this.onError('No compatible hash algorithm');
      return;
    }

    try {
      const clientNonce = generateClientNonce();
      const iterations = selectedAlgo.startsWith('pbkdf2')
        ? (serverIterations ? parseInt(serverIterations, 10) : 100000)
        : undefined;
      const hash = await computeHash(
        selectedAlgo,
        this.password,
        serverNonce,
        clientNonce,
        iterations,
      );

      // Clear password from memory after hashing
      this.password = '';

      this.connection.send(commands.init(hash));
      this.onAuthenticated();
    } catch (err) {
      // Clear password from memory even on failure
      this.password = '';
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      this.onError(errorMessage);
    }
  }

  private selectAlgorithm(serverAlgos: string): HashAlgorithm | null {
    const available = serverAlgos.split(':');
    for (const preferred of ALGO_PREFERENCE) {
      if (available.includes(preferred)) {
        return preferred as HashAlgorithm;
      }
    }
    return null;
  }

  private onAuthenticated(): void {
    useConnectionStore.getState().setState('connected');

    // Fetch initial data
    this.connection.send(
      commands.hdata(
        'buffer:gui_buffers(*)',
        ['number', 'full_name', 'short_name', 'title', 'type', 'hidden', 'local_variables'],
        'listbuffers',
      ),
    );

    // Fetch lines for all buffers (initial load)
    this.connection.send(
      commands.hdata(
        'buffer:gui_buffers(*)/own_lines/last_line(-100)/data',
        ['buffer', 'date', 'prefix', 'message', 'highlight', 'tags_array', 'displayed', 'notify'],
        'listlines',
      ),
    );

    // Fetch hotlist for unread counts
    this.connection.send(
      commands.hdata(
        'hotlist:gui_hotlist(*)',
        ['buffer', 'count'],
        'listhotlist',
      ),
    );

    // Sync all events
    this.connection.send(commands.sync());

    // Start keepalive pings
    this.startPing();
  }

  private onClose(code: number, reason: string): void {
    this.stopPing();
    const connState = useConnectionStore.getState().state;

    // Don't auto-reconnect if we were still authenticating (auth failure)
    // or if we never fully connected — prevents spamming the server
    if (connState === 'authenticating' || connState === 'connecting') {
      this.connection.disableReconnect();
    }

    if (code !== 1000) {
      useConnectionStore.getState().setError(`Connection closed: ${reason || `code ${code}`}`);
    } else {
      useConnectionStore.getState().reset();
    }
  }

  private onError(error: string): void {
    // Disable reconnect on explicit errors during auth to avoid spamming
    const connState = useConnectionStore.getState().state;
    if (connState === 'authenticating' || connState === 'connecting') {
      this.connection.disableReconnect();
    }
    useConnectionStore.getState().setError(error);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.lastPingTime = Date.now();
      this.connection.send(commands.ping(String(this.lastPingTime)));
    }, PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.lastPingTime = null;
  }
}
