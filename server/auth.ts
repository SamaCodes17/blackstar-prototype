import './config';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { secureCookies } from './config';

export function passwordHash(password: string, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function configured() {
  return Boolean(
    process.env.ADMIN_PASSWORD_HASH && (process.env.SESSION_SECRET?.length ?? 0) >= 32,
  );
}
export function checkPassword(password: unknown) {
  if (!configured() || typeof password !== 'string' || password.length > 256) return false;
  const [salt, expected] = process.env.ADMIN_PASSWORD_HASH!.split(':');
  if (!salt || !/^[a-f0-9]{128}$/.test(expected ?? '')) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), scryptSync(password, salt, 64));
}
function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET!).update(value).digest('hex');
}
export function sessionCookie(now = Date.now()) {
  const value = `${now + 4 * 60 * 60 * 1000}.${randomBytes(24).toString('hex')}`;
  return `blackstar_admin=${value}.${sign(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=14400${secureCookies ? '; Secure' : ''}`;
}
export function isAdmin(cookie = '', now = Date.now()) {
  if (!configured()) return false;
  const token = cookie
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('blackstar_admin='))
    ?.slice(16);
  if (!token) return false;
  const [expires, nonce, signature] = token.split('.');
  if (!/^[a-f0-9]{64}$/.test(signature ?? '') || !/^[a-f0-9]{48}$/.test(nonce ?? '')) return false;
  if (Number(expires) <= now || Number(expires) > now + 14400000) return false;
  const expected = sign(`${expires}.${nonce}`);
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}
export const logoutCookie = `blackstar_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookies ? '; Secure' : ''}`;

// A bounded, instance-local limiter. Deploy with a provider/WAF limit as well.
const buckets = new Map<string, { until: number; count: number }>();
export function allowed(key: string, limit: number, windowMs = 60000) {
  const now = Date.now();
  for (const [id, value] of buckets) if (value.until <= now) buckets.delete(id);
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= 10000) return false;
    buckets.set(key, (bucket = { until: now + windowMs, count: 0 }));
  }
  return ++bucket.count <= limit;
}
