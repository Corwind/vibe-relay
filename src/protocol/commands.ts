export function handshake(params: {
  password_hash_algo?: string;
  compression?: string;
  totp?: boolean;
}): string {
  const parts: string[] = [];
  if (params.password_hash_algo) parts.push(`password_hash_algo=${params.password_hash_algo}`);
  if (params.compression) parts.push(`compression=${params.compression}`);
  if (params.totp !== undefined) parts.push(`totp=${params.totp ? 'on' : 'off'}`);
  return `(handshake) handshake ${parts.join(',')}\n`;
}

export function init(authString: string, totp?: string): string {
  let cmd = `init ${authString}`;
  if (totp) cmd += `,totp=${totp}`;
  return cmd + '\n';
}

export function hdata(path: string, keys?: string[]): string {
  const id = `hdata_${path.replace(/[/:]/g, '_')}`;
  let cmd = `(${id}) hdata ${path}`;
  if (keys?.length) cmd += ` ${keys.join(',')}`;
  return cmd + '\n';
}

export function info(name: string): string {
  return `(info_${name}) info ${name}\n`;
}

export function input(buffer: string, text: string): string {
  return `input ${buffer} ${text}\n`;
}

export function sync(buffers?: string, options?: string): string {
  let cmd = 'sync';
  if (buffers) cmd += ` ${buffers}`;
  if (options) cmd += ` ${options}`;
  return cmd + '\n';
}

export function desync(buffers?: string, options?: string): string {
  let cmd = 'desync';
  if (buffers) cmd += ` ${buffers}`;
  if (options) cmd += ` ${options}`;
  return cmd + '\n';
}

export function nicklist(buffer?: string): string {
  const id = buffer ? `nicklist_${buffer}` : 'nicklist';
  let cmd = `(${id}) nicklist`;
  if (buffer) cmd += ` ${buffer}`;
  return cmd + '\n';
}

export function ping(data?: string): string {
  return `ping${data ? ` ${data}` : ''}\n`;
}

export function completion(buffer: string, position: number, data?: string): string {
  return `(completion) completion ${buffer} ${position}${data ? ` ${data}` : ''}\n`;
}

export function quit(): string {
  return 'quit\n';
}
