import type { BufferType } from '@/lib/constants';

export function inferBufferType(
  localVariables: Record<string, string>,
): BufferType {
  const type = localVariables['type'];
  if (type === 'channel') return 'channel';
  if (type === 'private') return 'private';
  if (type === 'server') return 'server';

  const plugin = localVariables['plugin'];
  if (plugin === 'core') return 'server';

  return 'channel';
}
