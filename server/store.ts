import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import type { Organization, Output, Timeline } from '../src/core/types';
mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.BLACKSTAR_DB ?? 'data/blackstar.db');
db.exec(
  `PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS organizations(id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS outputs(org_id TEXT PRIMARY KEY, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, org_id TEXT NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS evidence(org_id TEXT NOT NULL, source TEXT NOT NULL, at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(org_id,source));`,
);
export function organizations() {
  return (db.prepare('SELECT payload FROM organizations').all() as { payload: string }[]).map(
    (row) => JSON.parse(row.payload) as Organization,
  );
}
export function getOrg(id: string): Organization {
  const row = db.prepare('SELECT payload FROM organizations WHERE id=?').get(id) as
    | { payload: string }
    | undefined;
  if (!row) throw new Error('Organization not found');
  return JSON.parse(row.payload);
}
export function getOutput(id: string): Output {
  const row = db.prepare('SELECT payload FROM outputs WHERE org_id=?').get(id) as {
    payload: string;
  };
  return JSON.parse(row.payload);
}
export function timeline(id: string): Timeline[] {
  return (
    db.prepare('SELECT payload FROM events WHERE org_id=? ORDER BY id DESC LIMIT 60').all(id) as {
      payload: string;
    }[]
  )
    .map((r) => JSON.parse(r.payload))
    .reverse();
}
export function save(org: Organization, output: Output, event: Timeline) {
  db.exec('BEGIN');
  try {
    db.prepare('INSERT OR REPLACE INTO organizations VALUES (?,?)').run(
      org.id,
      JSON.stringify(org),
    );
    db.prepare('INSERT OR REPLACE INTO outputs VALUES (?,?)').run(org.id, JSON.stringify(output));
    db.prepare('INSERT INTO events(org_id,payload) VALUES (?,?)').run(
      org.id,
      JSON.stringify(event),
    );
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
export function cache(orgId: string, source: string, payload: unknown) {
  db.prepare('INSERT OR REPLACE INTO evidence VALUES (?,?,?,?)').run(
    orgId,
    source,
    new Date().toISOString(),
    JSON.stringify(payload),
  );
}
export function cached(orgId: string, source: string) {
  const row = db
    .prepare('SELECT at,payload FROM evidence WHERE org_id=? AND source=?')
    .get(orgId, source) as { at: string; payload: string } | undefined;
  return row ? { at: row.at, data: JSON.parse(row.payload) } : undefined;
}
