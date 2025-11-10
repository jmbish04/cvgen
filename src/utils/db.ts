import { initDb } from '../db/client';
import { NewTestResult, TestResult } from '../db/schema';
import { Env } from '../types';

export async function listActiveTests(env: Env) {
    const { kysely } = initDb(env);
    return await kysely.selectFrom('test_defs').where('isActive', '=', true).selectAll().execute();
}

export async function getLatestSession(env: Env) {
    const { kysely } = initDb(env);
    const latestResult = await kysely
        .selectFrom('test_results')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .select('sessionUuid')
        .executeTakeFirst();

    if (!latestResult) {
        return null;
    }

    return await kysely
        .selectFrom('test_results')
        .where('sessionUuid', '=', latestResult.sessionUuid)
        .selectAll()
        .execute();
}

export async function getSessionById(env: Env, sessionId: string) {
    const { kysely } = initDb(env);
    return await kysely
        .selectFrom('test_results')
        .where('sessionUuid', '=', sessionId)
        .selectAll()
        .execute();
}

export async function insertTestResult(env: Env, result: NewTestResult): Promise<TestResult> {
    const { drizzle } = initDb(env);
    const finalResult = {
        ...result,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
    };
    await drizzle.insert(schema.testResults).values(finalResult).run();
    return finalResult;
}
