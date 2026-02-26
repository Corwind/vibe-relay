import { create } from 'zustand';
import type { WeechatMessage } from './types';

interface MessageStore {
  messages: Record<string, WeechatMessage[]>;
  addMessage: (bufferId: string, message: WeechatMessage) => void;
  addMessages: (bufferId: string, messages: WeechatMessage[]) => void;
  prependMessages: (bufferId: string, messages: WeechatMessage[]) => void;
  clearMessages: (bufferId: string) => void;
  clearAll: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: {},
  addMessage: (bufferId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [bufferId]: [...(s.messages[bufferId] ?? []), message],
      },
    })),
  addMessages: (bufferId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [bufferId]: [...(s.messages[bufferId] ?? []), ...messages],
      },
    })),
  prependMessages: (bufferId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [bufferId]: [...messages, ...(s.messages[bufferId] ?? [])],
      },
    })),
  clearMessages: (bufferId) =>
    set((s) => ({
      messages: { ...s.messages, [bufferId]: [] },
    })),
  clearAll: () => set({ messages: {} }),
}));
