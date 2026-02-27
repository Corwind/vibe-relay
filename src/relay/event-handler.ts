import type {
  WeechatMessage as ProtocolMessage,
  WeechatHdata,
  WeechatHashtable,
  WeechatArray,
  FormattedSegment,
} from '@/protocol/types';
import { parseColors } from '@/protocol/color-parser';
import { useBufferStore } from '@/store/buffer-store';
import { useMessageStore } from '@/store/message-store';
import { useNicklistStore } from '@/store/nicklist-store';
import type { WeechatBuffer, WeechatMessage, NickEntry, TextSpan } from '@/store/types';
import { inferBufferType } from './helpers';

export function handleEvent(message: ProtocolMessage): void {
  const { id, objects } = message;

  switch (id) {
    case 'listbuffers':
      handleBufferList(objects);
      break;
    case 'listlines':
      handleLineList(objects);
      break;
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
    case 'listhotlist':
      handleHotlist(objects);
      break;
    default:
      if (id.startsWith('nicklist')) {
        handleNicklist(objects);
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

function handleLineList(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const msgStore = useMessageStore.getState();

    // Group messages by buffer pointer
    const byBuffer = new Map<string, WeechatMessage[]>();
    for (const entry of hdata.entries) {
      const bufferPointer = entry.values['buffer'] as string;
      const msg = hdataEntryToMessage(entry, bufferPointer);
      const list = byBuffer.get(bufferPointer) ?? [];
      list.push(msg);
      byBuffer.set(bufferPointer, list);
    }

    for (const [bufferId, messages] of byBuffer) {
      // WeeChat returns lines newest-first; reverse to chronological order
      messages.reverse();
      msgStore.prependMessages(bufferId, messages);
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

function handleHotlist(objects: ProtocolMessage['objects']): void {
  for (const obj of objects) {
    if (obj.type !== 'hda') continue;
    const hdata = obj.value as WeechatHdata;
    const bufStore = useBufferStore.getState();

    for (const entry of hdata.entries) {
      const bufferPointer = entry.values['buffer'] as string;
      const countArray = entry.values['count'] as WeechatArray | undefined;

      if (!countArray || !bufStore.buffers[bufferPointer]) continue;

      const counts = countArray.values as number[];
      // counts: [low_messages, messages, private_messages, highlights]
      const unreadCount = (counts[1] ?? 0) + (counts[2] ?? 0);
      const highlightCount = counts[3] ?? 0;

      bufStore.updateBuffer(bufferPointer, { unreadCount, highlightCount });
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

function segmentsToSpans(segments: FormattedSegment[]): TextSpan[] {
  return segments.map((seg) => {
    const span: TextSpan = { text: seg.text };
    if (seg.fgColor) span.fgColor = seg.fgColor;
    if (seg.bgColor) span.bgColor = seg.bgColor;
    if (seg.bold) span.bold = true;
    if (seg.italic) span.italic = true;
    if (seg.underline) span.underline = true;
    if (seg.strikethrough) span.strikethrough = true;
    if (seg.reverse) span.reverse = true;
    return span;
  });
}

/** Simple string hash (djb2) for generating stable message IDs. */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function hdataEntryToMessage(
  entry: WeechatHdata['entries'][0],
  bufferPointer: string,
): WeechatMessage {
  const tagsArray = entry.values['tags_array'] as WeechatArray | undefined;
  const tags: string[] = tagsArray ? (tagsArray.values as string[]) : [];

  const rawPrefix = (entry.values['prefix'] as string) ?? '';
  const rawMessage = (entry.values['message'] as string) ?? '';

  const prefixSegments = parseColors(rawPrefix);
  const messageSegments = parseColors(rawMessage);

  const plainPrefix = prefixSegments.map((s) => s.text).join('');
  const plainMessage = messageSegments.map((s) => s.text).join('');

  const dateVal = entry.values['date'];
  const dateMs =
    dateVal instanceof Date ? dateVal.getTime() : (dateVal as number) * 1000;
  const msgHash = simpleHash(plainMessage);
  const stableId = `${bufferPointer}-${dateMs}-${plainPrefix}-${msgHash}`;

  return {
    id: stableId,
    bufferId: bufferPointer,
    date:
      entry.values['date'] instanceof Date
        ? (entry.values['date'] as Date)
        : new Date((entry.values['date'] as number) * 1000),
    prefix: plainPrefix,
    message: plainMessage,
    tags,
    highlight: (entry.values['highlight'] as number) !== 0,
    displayed: (entry.values['displayed'] as number) !== 0,
    prefixSpans: segmentsToSpans(prefixSegments),
    spans: segmentsToSpans(messageSegments),
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
