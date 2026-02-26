import { useMemo } from 'react';
import { useNicklistStore } from '@/store/nicklist-store';
import { useBufferStore } from '@/store/buffer-store';
import type { NickEntry } from '@/store/types';
import { NICK_PREFIXES } from '@/lib/constants';

export interface GroupedNicklist {
  prefix: string;
  label: string;
  nicks: NickEntry[];
}

function prefixOrder(prefix: string): number {
  const idx = NICK_PREFIXES.indexOf(prefix as (typeof NICK_PREFIXES)[number]);
  return idx >= 0 ? idx : NICK_PREFIXES.length;
}

const EMPTY: NickEntry[] = [];

export function useNicklist(): GroupedNicklist[] {
  const activeBufferId = useBufferStore((s) => s.activeBufferId);
  const nicks = useNicklistStore((s) => {
    if (!activeBufferId) return EMPTY;
    return s.nicklists[activeBufferId] ?? EMPTY;
  });

  return useMemo(() => {
    if (nicks.length === 0) return [];

    const groups = new Map<string, NickEntry[]>();
    for (const nick of nicks) {
      if (!nick.visible) continue;
      const key = nick.prefix || '';
      const existing = groups.get(key) ?? [];
      existing.push(nick);
      groups.set(key, existing);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => prefixOrder(a) - prefixOrder(b))
      .map(([prefix, groupNicks]) => ({
        prefix,
        label: prefix ? `${prefix} (${groupNicks.length})` : `Users (${groupNicks.length})`,
        nicks: groupNicks.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [nicks]);
}
