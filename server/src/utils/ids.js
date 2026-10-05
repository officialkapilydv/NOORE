import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function uid(prefix = '') {
  return `${prefix}${crypto.randomUUID()}`;
}

export function orderNumber() {
  const year = new Date().getFullYear();
  const bytes = crypto.randomBytes(6);
  let code = '';
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return `NR-${year}-${code}`;
}
