import { useCallback, useRef, useEffect } from 'react';
import { useConnectionStore } from '@/store/connection-store';
import { useMessageStore } from '@/store/message-store';
import { useBufferStore } from '@/store/buffer-store';
import { useNicklistStore } from '@/store/nicklist-store';
import type { ConnectionSettings } from '@/store/types';

const MAX_RECONNECT_DELAY = 30000;
const BASE_RECONNECT_DELAY = 1000;

export function useRelay() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(false);

  const connectionState = useConnectionStore((s) => s.state);
  const setConnectionState = useConnectionStore((s) => s.setState);
  const setConnectionError = useConnectionStore((s) => s.setError);
  const resetConnection = useConnectionStore((s) => s.reset);

  const clearAllMessages = useMessageStore((s) => s.clearAll);
  const clearAllNicklists = useNicklistStore((s) => s.clearAll);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectInternalRef = useRef<((settings: ConnectionSettings) => void) | null>(null);

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current) return;
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptRef.current),
      MAX_RECONNECT_DELAY,
    );
    reconnectAttemptRef.current += 1;
    reconnectTimerRef.current = setTimeout(() => {
      const settings = useConnectionStore.getState().settings;
      if (shouldReconnectRef.current) {
        connectInternalRef.current?.(settings);
      }
    }, delay);
  }, []);

  const connectInternal = useCallback(
    (settings: ConnectionSettings) => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      setConnectionState('connecting');
      const protocol = settings.ssl ? 'wss' : 'ws';
      const url = `${protocol}://${settings.host}:${settings.port}/weechat`;

      try {
        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptRef.current = 0;
          setConnectionState('authenticating');
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (shouldReconnectRef.current) {
            setConnectionState('disconnected');
            scheduleReconnect();
          }
        };

        ws.onerror = () => {
          setConnectionError('Connection failed');
        };
      } catch {
        setConnectionError('Failed to create WebSocket connection');
      }
    },
    [setConnectionState, setConnectionError, scheduleReconnect],
  );

  useEffect(() => {
    connectInternalRef.current = connectInternal;
  }, [connectInternal]);

  const connect = useCallback(
    (settings: ConnectionSettings) => {
      shouldReconnectRef.current = true;
      reconnectAttemptRef.current = 0;
      useConnectionStore.getState().setSettings(settings);
      connectInternal(settings);
    },
    [connectInternal],
  );

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimer();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    resetConnection();
    clearAllMessages();
    clearAllNicklists();
    useBufferStore.getState().setBuffers({});
    useBufferStore.getState().setActiveBuffer('');
  }, [clearReconnectTimer, resetConnection, clearAllMessages, clearAllNicklists]);

  const sendCommand = useCallback((command: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(command + '\n');
    }
  }, []);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearReconnectTimer]);

  return {
    connectionState,
    connect,
    disconnect,
    sendCommand,
  };
}
