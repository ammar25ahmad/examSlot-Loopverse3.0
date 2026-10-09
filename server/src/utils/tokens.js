import crypto from 'node:crypto';

/** Generates a cryptographically secure opaque token (returned to the user). */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Hashes a token for storage. Only the hash is ever persisted. */
export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

/** Constant-time comparison of two token strings/hashes. */
export function safeCompare(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Builds a frontend link for a tokenised action (never logged). */
export function buildFrontendLink(path, token) {
  const base = (process.env.CLIENT_URL || '').replace(/\/$/, '');
  return `${base}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
}

export default { generateToken, hashToken, safeCompare, buildFrontendLink };
