import { Hono } from "hono";
import { cors } from "hono/cors";
import { dispatchRPC } from "./rpc";
import type { Env } from "./types";
import { runAllTests } from "./tests/runner";
import { getLatestSession, listActiveTests, getSessionById } from "./utils/db";

export function buildRouter() {
const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

app.get("/", (c) => c.json({ ok: true, ts: new Date().toISOString(), version: "1.0.0" }));

app.post("/api/tasks", async (c) => {
const body = await c.req.json();
const res = await dispatchRPC("createTask", body, c.env, c.executionCtx);
return c.json(res);
});

app.get("/api/tasks", async (c) => {
const res = await dispatchRPC("listTasks", null, c.env, c.executionCtx);
return c.json(res);
});

app.post("/api/analyze", async (c) => {
const body = await c.req.json();
const res = await dispatchRPC("runAnalysis", body, c.env, c.executionCtx);
return c.json(res);
});

app.post("/rpc", async (c) => {
try {
const { method, params } = await c.req.json();
const result = await dispatchRPC(method, params, c.env, c.executionCtx);
return c.json({ success: true, result });
} catch (e: any) {
return c.json({ success: false, error: e?.message ?? "RPC error" }, 400);
}
});

app.post("/api/tests/run", async (c) => {
    const session_uuid = crypto.randomUUID();
    c.executionCtx.waitUntil(runAllTests(c.env, session_uuid));
    return c.json({ session_uuid });
});

app.get("/api/tests/session/:id", async (c) => {
    const { id } = c.req.param();
    const results = await getSessionById(c.env, id);
    return c.json(results);
});

app.get("/api/tests/defs", async (c) => {
    const defs = await listActiveTests(c.env);
    return c.json(defs);
});

app.get("/api/health", async (c) => {
    const latestSession = await getLatestSession(c.env);
    const status = latestSession?.every(r => r.status === 'pass') ? 'healthy' : 'unhealthy';
    return c.json({ status, lastCheck: new Date().toISOString() });
});


return app;
}