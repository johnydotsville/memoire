import { createHash } from 'crypto';


export function idFromPath(path: string) {
  return createHash('sha256').update(path).digest('hex').slice(0, 16);
}