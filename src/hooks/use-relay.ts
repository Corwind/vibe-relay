import { useCallback, useRef, useEffect } from 'react';
import { RelaySession } from '@/relay/session';
import { useConnectionStore } from '@/store/connection-store';
import { useMessageStore } from '@/store/message-store';
import { useBufferStore } from '@/store/buffer-store';
import { useNicklistStore } from '@/store/nicklist-store';
import type { ConnectionSettings } from '@/store/types';

export function useRelay() {
  const sessionRef = useRef<RelaySession | null>(null);

  const clearAllMessages = useMessageStore((s) => s.clearAll);
  const clearAllNicklists = useNicklistStore((s) => s.clearAll);

  const connect = useCallback((settings: ConnectionSettings) => {
    // Disconnect any existing session
    if (sessionRef.current) {
      sessionRef.current.disconnect();
    }

    useConnectionStore.getState().setSettings(settings);

    const session = new RelaySession();
    sessionRef.current = session;
    session.connect(settings.host, settings.port, settings.ssl, settings.password);
  }, []);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    clearAllMessages();
    clearAllNicklists();
    useBufferStore.getState().setBuffers({});
    useBufferStore.getState().setActiveBuffer('');
  }, [clearAllMessages, clearAllNicklists]);

  const sendInput = useCallback((buffer: string, text: string) => {
    sessionRef.current?.sendInput(buffer, text);
  }, []);

  const fetchLines = useCallback((bufferPointer: string, count?: number) => {
    sessionRef.current?.fetchLines(bufferPointer, count);
  }, []);

  const fetchNicklist = useCallback((bufferPointer?: string) => {
    sessionRef.current?.fetchNicklist(bufferPointer);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.disconnect();
        sessionRef.current = null;
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendInput,
    fetchLines,
    fetchNicklist,
  };
}
