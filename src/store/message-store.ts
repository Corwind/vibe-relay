import { create } from 'zustand';
import type { WeechatMessage } from './types';

const MAX_MESSAGES_PER_BUFFER = 5000;

interface MessageStore {
  messages: Record<string, WeechatMessage[]>;
  addMessage: (bufferId: string, message: WeechatMessage) => void;
  addMessages: (bufferId: string, messages: WeechatMessage[]) => void;
  prependMessages: (bufferId: string, messages: WeechatMessage[]) => void;
  clearMessages: (bufferId: string) => void;
  clearAll: () => void;
}

function trimToLimit(messages: WeechatMessage[]): WeechatMessage[] {
  if (messages.length > MAX_MESSAGES_PER_BUFFER) {
    return messages.slice(messages.length - MAX_MESSAGES_PER_BUFFER);
  }
  return messages;
}

function deduplicate(existing: WeechatMessage[], incoming: WeechatMessage[]): WeechatMessage[] {
  const seen = new Set(existing.map((m) => m.id));
  return incoming.filter((m) => !seen.has(m.id));
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: {},
  addMessage: (bufferId, message) =>
    set((s) => {
      const existing = s.messages[bufferId] ?? [];
      if (existing.some((m) => m.id === message.id)) return s;
      return {
        messages: {
          ...s.messages,
          [bufferId]: trimToLimit([...existing, message]),
        },
      };
    }),
  addMessages: (bufferId, messages) =>
    set((s) => {
      const existing = s.messages[bufferId] ?? [];
      const newMsgs = deduplicate(existing, messages);
      if (newMsgs.length === 0) return s;
      return {
        messages: {
          ...s.messages,
          [bufferId]: trimToLimit([...existing, ...newMsgs]),
        },
      };
    }),
  prependMessages: (bufferId, messages) =>
    set((s) => {
      const existing = s.messages[bufferId] ?? [];
      const newMsgs = deduplicate(existing, messages);
      if (newMsgs.length === 0 && messages.length > 0) return s;
      return {
        messages: {
          ...s.messages,
          [bufferId]: trimToLimit([...newMsgs, ...existing]),
        },
      };
    }),
  clearMessages: (bufferId) =>
    set((s) => ({
      messages: { ...s.messages, [bufferId]: [] },
    })),
  clearAll: () => set({ messages: {} }),
}));

export { MAX_MESSAGES_PER_BUFFER };
