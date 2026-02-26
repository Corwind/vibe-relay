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

export const useMessageStore = create<MessageStore>((set) => ({
  messages: {},
  addMessage: (bufferId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [bufferId]: trimToLimit([...(s.messages[bufferId] ?? []), message]),
      },
    })),
  addMessages: (bufferId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [bufferId]: trimToLimit([...(s.messages[bufferId] ?? []), ...messages]),
      },
    })),
  prependMessages: (bufferId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [bufferId]: trimToLimit([...messages, ...(s.messages[bufferId] ?? [])]),
      },
    })),
  clearMessages: (bufferId) =>
    set((s) => ({
      messages: { ...s.messages, [bufferId]: [] },
    })),
  clearAll: () => set({ messages: {} }),
}));

export { MAX_MESSAGES_PER_BUFFER };
