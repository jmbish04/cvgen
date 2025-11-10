import { Env } from '../types';
import { getDefaultTestDefs } from './defs';
import { getKysely, insertTestResult, listActiveTests } from '../utils/db';
import { analyzeFailure } from '../utils/ai';
import { buildRouter } from '../router';

async function seedTests(env: Env) {
    const db = env.DB;
    const inserts = getDefaultTestDefs().map(def =>
        db.prepare('INSERT INTO test_defs (id, name, description, category, severity, is_active, error_map) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(def.id, def.name, def.description, def.category, def.severity, def.is_active, def.error_map)
    );
    await db.batch(inserts);
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
    let activeTests = await listActiveTests(env.DB);

    if (activeTests.length === 0) {
        await seedTests(env);
        activeTests = await listActiveTests(env.DB);
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

        await insertTestResult(env.DB, {
            session_uuid,
            test_fk: testDef.id,
            started_at,
            finished_at,
            duration_ms,
            status,
            error_code,
            raw,
            ai_human_readable_error_description,
            ai_prompt_to_fix_error,
        });
    });

    await Promise.all(testPromises);
}