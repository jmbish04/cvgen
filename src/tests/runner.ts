import { Env } from '../types';
import { getDefaultTestDefs } from './defs';
import { insertTestResult, listActiveTests } from '../utils/db';
import { analyzeFailure } from '../utils/ai';
import { buildRouter } from '../router';
import { initDb } from '../db/client';
import * as schema from '../db/schema';

async function seedTests(env: Env) {
    const { drizzle } = initDb(env);
    const defs = getDefaultTestDefs();
    await drizzle.insert(schema.testDefs).values(defs).run();
}

// Mock test implementations
async function runHealthCheckTest(app: ReturnType<typeof buildRouter>, env: Env) {
    const req = new Request('http://localhost/api/health');
    const res = await app.fetch(req, env, { waitUntil: async () => {} } as any);
    const json: { status: string } = await res.json();
    if (json.status !== 'healthy') {
        throw new Error('unhealthy');
    }
}

async function runOpenApiTest(app: ReturnType<typeof buildRouter>, env: Env) {
    const req = new Request('http://localhost/openapi.json');
    const res = await app.fetch(req, env, { waitUntil: async () => {} } as any);
    const json: { openapi: string } = await res.json();
    if (!json.openapi || json.openapi !== '3.1.0') {
        throw new Error('invalid_spec');
    }
}

async function runWebSocketTest(app: ReturnType<typeof buildRouter>, env: Env) {
    const req = new Request('http://localhost/ws', { headers: { Upgrade: 'websocket' } });
    const res = await app.fetch(req, env, { waitUntil: async () => {} } as any);
    if (res.status !== 101) {
        throw new Error('handshake_failed');
    }
}

const testRunners: Record<string, (app: ReturnType<typeof buildRouter>, env: Env) => Promise<void>> = {
    'Health Endpoint Check': runHealthCheckTest,
    'OpenAPI JSON Check': runOpenApiTest,
    'WebSocket Handshake': runWebSocketTest,
};

export async function runAllTests(env: Env, session_uuid: string) {
    let activeTests = await listActiveTests(env);

    if (activeTests.length === 0) {
        await seedTests(env);
        activeTests = await listActiveTests(env);
    }

    const app = buildRouter();

    const testPromises = activeTests.map(async (testDef) => {
        const started_at = new Date().toISOString();
        let status: 'pass' | 'fail' = 'pass';
        let error_code: string | null = null;
        let raw: string = '{}';
        let ai_human_readable_error_description: string | null = null;
        let ai_prompt_to_fix_error: string | null = null;

        try {
            const runner = testRunners[testDef.name];
            if (!runner) throw new Error(`No runner for test: ${testDef.name}`);
            await runner(app, env);
        } catch (e: any) {
            status = 'fail';
            error_code = e.message || 'unknown_error';
            raw = JSON.stringify({ error: e.message, stack: e.stack });
            const { readableError, fixPrompt } = await analyzeFailure(env, e.message);
            ai_human_readable_error_description = readableError;
            ai_prompt_to_fix_error = fixPrompt;
        }

        const finished_at = new Date().toISOString();
        const duration_ms = new Date(finished_at).getTime() - new Date(started_at).getTime();

        await insertTestResult(env, {
            sessionUuid: session_uuid,
            testFk: testDef.id,
            startedAt: started_at,
            finishedAt: finished_at,
            durationMs: duration_ms,
            status: status,
            errorCode: error_code,
            raw: raw,
            aiHumanReadableErrorDescription: ai_human_readable_error_description,
            aiPromptToFixError: ai_prompt_to_fix_error,
        });
    });

    await Promise.all(testPromises);
}