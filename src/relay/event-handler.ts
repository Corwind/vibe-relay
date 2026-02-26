import type {
  WeechatMessage as ProtocolMessage,
  WeechatHdata,
  WeechatHashtable,
  WeechatArray,
} from '@/protocol/types';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useNicklistStore } from '@/store/nicklist-store';
import type { WeechatBuffer, WeechatMessage, NickEntry } from '@/store/types';
import { inferBufferType } from './helpers';

export function handleEvent(message: ProtocolMessage): void {
  const { id, objects } = message;

  switch (id) {
    case '_buffer_opened':
      handleBufferOpened(objects);
      break;
    case '_buffer_closed':
      handleBufferClosed(objects);
      break;
    case '_buffer_renamed':
    case '_buffer_title_changed':
    case '_buffer_merged':
    case '_buffer_unmerged':
    case '_buffer_hidden':
    case '_buffer_unhidden':
      handleBufferUpdate(objects);
      break;
    case '_buffer_line_added':
      handleLineAdded(objects);
      break;
    case '_nicklist':
      handleNicklist(objects);
      break;
    case '_nicklist_diff':
      handleNicklistDiff(objects);
      break;
    default:
      // Handle hdata responses from initial fetch
      if (id.startsWith('hdata_buffer')) {
        handleBufferList(objects);
      }
      break;
  }
}

function handleBufferList(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const store = useBufferStore.getState();

    for (const entry of hdata.entries) {
      const buffer = hdataEntryToBuffer(entry);
      store.addBuffer(buffer);
    }

    // Auto-select first buffer if none selected
    if (!store.activeBufferId && hdata.entries.length > 0) {
      store.setActiveBuffer(hdata.entries[0].pointers[0]);
    }
  }
}

function handleBufferOpened(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const store = useBufferStore.getState();

    for (const entry of hdata.entries) {
      const buffer = hdataEntryToBuffer(entry);
      store.addBuffer(buffer);
    }
  }
}

function handleBufferClosed(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const store = useBufferStore.getState();

    for (const entry of hdata.entries) {
      store.removeBuffer(entry.pointers[0]);
    }
  }
}

function handleBufferUpdate(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const store = useBufferStore.getState();

    for (const entry of hdata.entries) {
      const pointer = entry.pointers[0];
      const partial: Partial<WeechatBuffer> = {};

      if ('full_name' in entry.values) partial.fullName = entry.values['full_name'] as string;
      if ('short_name' in entry.values)
        partial.shortName = (entry.values['short_name'] as string) ?? '';
      if ('title' in entry.values) partial.title = (entry.values['title'] as string) ?? '';
      if ('hidden' in entry.values) {
        // hidden is a chr type (number), but we update visibility via it
        // buffers don't have a hidden field in the store -- we can skip or map
      }
      if ('number' in entry.values) partial.number = entry.values['number'] as number;

      store.updateBuffer(pointer, partial);
    }
  }
}

function handleLineAdded(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const msgStore = useMessageStore.getState();
    const bufStore = useBufferStore.getState();

    for (const entry of hdata.entries) {
      const bufferPointer = entry.values['buffer'] as string;
      const msg = hdataEntryToMessage(entry, bufferPointer);
      msgStore.addMessage(bufferPointer, msg);

      // Update unread counts if not the active buffer
      if (bufferPointer !== bufStore.activeBufferId) {
        const existing = bufStore.buffers[bufferPointer];
        if (existing) {
          const update: Partial<WeechatBuffer> = {
            unreadCount: existing.unreadCount + 1,
          };
          if (msg.highlight) {
            update.highlightCount = existing.highlightCount + 1;
          }
          bufStore.updateBuffer(bufferPointer, update);
        }
      }
    }
  }
}

function handleNicklist(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;

    // Group nicks by buffer pointer
    const byBuffer = new Map<string, NickEntry[]>();
    for (const entry of hdata.entries) {
      const pointer = entry.pointers[0];
      const nick = hdataEntryToNick(entry);
      // Skip group entries, only include actual nicks
      if (nick.group !== '') continue;
      const list = byBuffer.get(pointer) ?? [];
      list.push(nick);
      byBuffer.set(pointer, list);
    }

    const store = useNicklistStore.getState();
    for (const [bufferId, nicks] of byBuffer) {
      store.setNicklist(bufferId, nicks);
    }
  }
}

function handleNicklistDiff(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;

    // Group diffs by buffer pointer
    const byBuffer = new Map<string, Array<{ op: '+' | '-' | '*'; nick: NickEntry }>>();

    for (const entry of hdata.entries) {
      const pointer = entry.pointers[0];
      const diffChar = entry.values['_diff'] as number;
      const isGroup = (entry.values['group'] as number) !== 0;

      // Skip group diffs
      if (isGroup) continue;

      const op = diffChar === 43 ? '+' : diffChar === 45 ? '-' : '*';

      const nick = hdataEntryToNick(entry);
      const list = byBuffer.get(pointer) ?? [];
      list.push({ op: op as '+' | '-' | '*', nick });
      byBuffer.set(pointer, list);
    }

    const store = useNicklistStore.getState();
    for (const [bufferId, diffs] of byBuffer) {
      store.applyDiff(bufferId, diffs);
    }
  }
}

function hdataEntryToBuffer(entry: WeechatHdata['entries'][0]): WeechatBuffer {
  const localVarsRaw = entry.values['local_variables'] as WeechatHashtable | undefined;
  const localVariables: Record<string, string> = {};
  if (localVarsRaw) {
    for (const [k, v] of localVarsRaw.entries) {
      localVariables[k as string] = v as string;
    }
  }

  const pointer = entry.pointers[0];
  const fullName = (entry.values['full_name'] as string) ?? '';
  const shortName = (entry.values['short_name'] as string) ?? '';

  return {
    id: pointer,
    fullName,
    shortName: shortName || fullName.split('.').pop() || '',
    title: (entry.values['title'] as string) ?? '',
    type: inferBufferType(localVariables),
    number: (entry.values['number'] as number) ?? 0,
    hidden: false,
    unreadCount: 0,
    highlightCount: 0,
    isActive: false,
    nicklistVisible: true,
    localVariables,
  };
}

function hdataEntryToMessage(
  entry: WeechatHdata['entries'][0],
  bufferPointer: string,
): WeechatMessage {
  const tagsArray = entry.values['tags_array'] as WeechatArray | undefined;
  const tags: string[] = tagsArray ? (tagsArray.values as string[]) : [];

  return {
    id: `${bufferPointer}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bufferId: bufferPointer,
    date:
      entry.values['date'] instanceof Date
        ? (entry.values['date'] as Date)
        : new Date((entry.values['date'] as number) * 1000),
    prefix: (entry.values['prefix'] as string) ?? '',
    message: (entry.values['message'] as string) ?? '',
    tags,
    highlight: (entry.values['highlight'] as number) !== 0,
    displayed: (entry.values['displayed'] as number) !== 0,
  };
}

function hdataEntryToNick(entry: WeechatHdata['entries'][0]): NickEntry {
  const isGroup = (entry.values['group'] as number) !== 0;
  return {
    name: (entry.values['name'] as string) ?? '',
    prefix: (entry.values['prefix'] as string) ?? '',
    color: (entry.values['color'] as string) ?? '',
    visible: (entry.values['visible'] as number) !== 0,
    group: isGroup ? ((entry.values['name'] as string) ?? '') : '',
    level: (entry.values['level'] as number) ?? 0,
  };
}
