import './config';
import pg from 'pg';
import type { Organization, Output, Timeline } from '../src/core/types';

// The public demo never enters this store. Private assessments require PostgreSQL.
const testMemory = process.env.BLACKSTAR_DB === ':memory:';
const pool =
  process.env.DATABASE_URL && !testMemory
    ? new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
    : undefined;
const memory = new Map<string, { org: Organization; output: Output; events: Timeline[] }>();
const evidence = new Map<string, { at: string; data: unknown }>();
export const persistentStorage = Boolean(pool);
export async function initializeStore() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS blackstar_assessments (id TEXT PRIMARY KEY, org JSONB NOT NULL, output JSONB NOT NULL, events JSONB NOT NULL DEFAULT '[]');
    CREATE TABLE IF NOT EXISTS blackstar_evidence (org_id TEXT NOT NULL, source TEXT NOT NULL, at TIMESTAMPTZ NOT NULL, payload JSONB NOT NULL, PRIMARY KEY(org_id,source));`);
}
export async function organizations(): Promise<Organization[]> {
  if (!pool) return testMemory ? [...memory.values()].map((v) => structuredClone(v.org)) : [];
  return (await pool.query('SELECT org FROM blackstar_assessments ORDER BY id')).rows.map(
    (r) => r.org,
  );
}
async function row(id: string) {
  const result = pool
    ? (await pool.query('SELECT * FROM blackstar_assessments WHERE id=$1', [id])).rows[0]
    : memory.get(id);
  if (!result) throw new Error('Organization not found');
  return structuredClone(result);
}
export async function getOrg(id: string): Promise<Organization> {
  return (await row(id)).org;
}
export async function getOutput(id: string): Promise<Output> {
  return (await row(id)).output;
}
export async function timeline(id: string): Promise<Timeline[]> {
  return (await row(id)).events;
}
export async function save(org: Organization, output: Output, event: Timeline) {
  if (!pool) {
    if (!testMemory)
      throw new Error('Managed PostgreSQL must be configured before saving private organizations');
    memory.set(
      org.id,
      structuredClone({
        org,
        output,
        events: [...(memory.get(org.id)?.events ?? []), event].slice(-60),
      }),
    );
    return;
  }
  await pool.query(
    `INSERT INTO blackstar_assessments (id,org,output,events) VALUES ($1,$2,$3,$4)
    ON CONFLICT (id) DO UPDATE SET org=EXCLUDED.org, output=EXCLUDED.output,
    events=(SELECT COALESCE(jsonb_agg(item ORDER BY ord), '[]'::jsonb) FROM jsonb_array_elements(blackstar_assessments.events || EXCLUDED.events) WITH ORDINALITY AS e(item,ord)
    WHERE ord > jsonb_array_length(blackstar_assessments.events || EXCLUDED.events)-60)`,
    [org.id, JSON.stringify(org), JSON.stringify(output), JSON.stringify([event])],
  );
}
export async function cache(orgId: string, source: string, data: unknown) {
  if (!pool) {
    if (testMemory) evidence.set(orgId + ':' + source, { at: new Date().toISOString(), data });
    return;
  }
  await pool.query(
    'INSERT INTO blackstar_evidence VALUES ($1,$2,NOW(),$3) ON CONFLICT(org_id,source) DO UPDATE SET at=EXCLUDED.at,payload=EXCLUDED.payload',
    [orgId, source, JSON.stringify(data)],
  );
}
export async function cached(
  orgId: string,
  source: string,
): Promise<{ at: string; data: any } | undefined> {
  if (!pool) return evidence.get(orgId + ':' + source);
  const result = (
    await pool.query('SELECT at,payload FROM blackstar_evidence WHERE org_id=$1 AND source=$2', [
      orgId,
      source,
    ])
  ).rows[0];
  return result ? { at: new Date(result.at).toISOString(), data: result.payload } : undefined;
}
export async function closeStore() {
  await pool?.end();
}
