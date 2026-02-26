import { useState, useCallback, useEffect, useRef } from 'react';
import { BufferList } from '@/components/buffers/BufferList';
import { MessageList } from '@/components/messages/MessageList';
import { NickList } from '@/components/nicklist/NickList';
import { MessageInput } from '@/components/input/MessageInput';
import { ConnectionStatus } from '@/components/connection/ConnectionStatus';
import { ConnectDialog } from '@/components/connection/ConnectDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Menu, Settings, Users } from 'lucide-react';
import { useConnectionStore } from '@/store/connection-store';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useRelay } from '@/hooks/use-relay';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useDocumentTitle } from '@/hooks/use-document-title';
import type { ConnectionSettings } from '@/store/types';

export function AppLayout() {
  const [connectOpen, setConnectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setSearchFocused] = useState(false);
  const [nicklistOpen, setNicklistOpen] = useState(false);

  const connectionState = useConnectionStore((s) => s.state);
  const connectionError = useConnectionStore((s) => s.error);
  const activeBufferId = useBufferStore((s) => s.activeBufferId);
  const activeBuffer = useBufferStore((s) =>
    s.activeBufferId ? s.buffers[s.activeBufferId] : null,
  );

  const { connect, disconnect, sendInput, fetchLines, fetchNicklist } = useRelay();

  useDocumentTitle();

  // Dialog is open when manually triggered OR when there's a connection error
  const connectDialogOpen =
    connectOpen || (connectionState === 'disconnected' && !!connectionError);

  const handleToggleSearch = useCallback(() => {
    setSearchFocused((prev) => !prev);
  }, []);

  const handleEscape = useCallback(() => {
    setSettingsOpen(false);
    setConnectOpen(false);
    setSidebarOpen(false);
    setNicklistOpen(false);
    setSearchFocused(false);
  }, []);

  useKeyboardShortcuts({
    onToggleSearch: handleToggleSearch,
    onEscape: handleEscape,
  });

  const handleConnect = useCallback(
    (settings: ConnectionSettings) => {
      connect(settings);
      setConnectOpen(false);
    },
    [connect],
  );

  const handleSend = useCallback(
    (text: string) => {
      if (!activeBufferId) return;
      sendInput(activeBufferId, text);
    },
    [activeBufferId, sendInput],
  );

  // Load older messages when user scrolls to top
  const handleStartReached = useCallback(() => {
    if (!activeBufferId || connectionState !== 'connected') return;
    fetchLines(activeBufferId, 200);
  }, [activeBufferId, connectionState, fetchLines]);

  // Fetch backlog + nicklist when switching buffers
  const prevBufferRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !activeBufferId ||
      connectionState !== 'connected' ||
      activeBufferId === prevBufferRef.current
    ) {
      prevBufferRef.current = activeBufferId;
      return;
    }
    prevBufferRef.current = activeBufferId;

    // Only fetch lines if we don't already have messages for this buffer
    const existing = useMessageStore.getState().messages[activeBufferId];
    if (!existing || existing.length === 0) {
      fetchLines(activeBufferId);
    }
    fetchNicklist(activeBufferId);

    // Clear unread count for the newly active buffer
    useBufferStore.getState().clearUnread(activeBufferId);
  }, [activeBufferId, connectionState, fetchLines, fetchNicklist]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3">
        <h1 className="text-sm font-bold">relay-client</h1>
        <Button size="icon" variant="ghost" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between px-3 py-2">
        <ConnectionStatus />
        {connectionState === 'disconnected' ? (
          <Button size="sm" variant="outline" onClick={() => setConnectOpen(true)}>
            Connect
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={disconnect}>
            Disconnect
          </Button>
        )}
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden">
        <BufferList />
      </div>
    </div>
  );

  return (
    <div className="h-screen" data-testid="app-layout">
      {/* Desktop layout: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-[250px_1fr_200px] h-full">
        {/* Sidebar */}
        <div className="border-r border-border overflow-hidden">{sidebarContent}</div>

        {/* Main content */}
        <div className="flex flex-col overflow-hidden">
          {activeBuffer && (
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <h2 className="font-medium text-sm">{activeBuffer.shortName}</h2>
              {activeBuffer.title && (
                <span className="text-xs text-muted-foreground truncate">{activeBuffer.title}</span>
              )}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <MessageList onStartReached={handleStartReached} />
          </div>
          <MessageInput
            onSend={handleSend}
            disabled={connectionState !== 'connected' || !activeBufferId}
          />
        </div>

        {/* Nicklist */}
        <div className="border-l border-border overflow-hidden">
          <NickList />
        </div>
      </div>

      {/* Mobile layout: single column with Sheet sidebar */}
      <div className="flex flex-col h-full md:hidden">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <h2 className="font-medium text-sm flex-1 truncate">
            {activeBuffer?.shortName ?? 'relay-client'}
          </h2>
          <ConnectionStatus />
          <Sheet open={nicklistOpen} onOpenChange={setNicklistOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Show users">
                <Users className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SheetTitle className="sr-only">Users</SheetTitle>
              <NickList />
            </SheetContent>
          </Sheet>
        </div>
        <div className="flex-1 overflow-hidden">
          <MessageList onStartReached={handleStartReached} />
        </div>
        <MessageInput
          onSend={handleSend}
          disabled={connectionState !== 'connected' || !activeBufferId}
        />
      </div>

      {/* Dialogs */}
      <ConnectDialog
        open={connectDialogOpen}
        onOpenChange={(open) => {
          setConnectOpen(open);
          if (!open) useConnectionStore.getState().setError(null);
        }}
        onConnect={handleConnect}
        connectionError={connectionError}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
