import { Kysely } from 'kysely';
import { DrizzleD1Database, drizzle } from 'drizzle-orm/d1';
import { D1Dialect } from 'kysely-d1';

export interface TestDef {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  is_active: number;
  error_map: string;
  created_at: string;
}

export interface TestResult {
  id: string;
  session_uuid: string;
  test_fk: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  status: 'pass' | 'fail';
  error_code: string | null;
  raw: string;
  ai_human_readable_error_description: string | null;
  ai_prompt_to_fix_error: string | null;
  created_at: string;
}

interface Database {
  test_defs: TestDef;
  test_results: TestResult;
}

export function getKysely(db: D1Database) {
  return new Kysely<Database>({
    dialect: new D1Dialect({ database: db }),
  });
}

export function getDrizzle(db: D1Database) {
  return drizzle(db);
}

export async function listActiveTests(db: D1Database) {
  const kysely = getKysely(db);
  return await kysely.selectFrom('test_defs').where('is_active', '=', 1).selectAll().execute();
}

export async function getLatestSession(db: D1Database) {
  const kysely = getKysely(db);
  const latestResult = await kysely
    .selectFrom('test_results')
    .orderBy('created_at', 'desc')
    .limit(1)
    .select('session_uuid')
    .executeTakeFirst();

  if (!latestResult) {
    return null;
  }

  return await kysely
    .selectFrom('test_results')
    .where('session_uuid', '=', latestResult.session_uuid)
    .selectAll()
    .execute();
}

export async function getSessionById(db: D1Database, sessionId: string) {
    const kysely = getKysely(db);
    return await kysely
        .selectFrom('test_results')
        .where('session_uuid', '=', sessionId)
        .selectAll()
        .execute();
}

export async function insertTestResult(db: D1Database, result: Omit<TestResult, 'id' | 'created_at'>) {
    const drizzleDb = getDrizzle(db);
    const finalResult = {
        ...result,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
    };
    // This is a placeholder as drizzle-orm d1 support for returning values is limited
    // a full implementation would require a schema definition
    await db.prepare('INSERT INTO test_results (id, session_uuid, test_fk, started_at, finished_at, duration_ms, status, error_code, raw, ai_human_readable_error_description, ai_prompt_to_fix_error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(finalResult.id, finalResult.session_uuid, finalResult.test_fk, finalResult.started_at, finalResult.finished_at, finalResult.duration_ms, finalResult.status, finalResult.error_code, finalResult.raw, finalResult.ai_human_readable_error_description, finalResult.ai_prompt_to_fix_error, finalResult.created_at)
        .run();
    return finalResult;
}