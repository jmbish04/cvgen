import { z } from "zod";
import * as S from "./schemas/apiSchemas";
import { dispatchRPC, rpcRegistry } from "./rpc";
import type { Env } from "./types";
import { Hono } from "hono";

const ExecuteBody = z.object({ tool: z.string(), params: z.any() });

export function mcpRoutes() {
  const app = new Hono<{ Bindings: Env }>();

  app.get("/tools", async (c) => {
    const tools = Object.keys(rpcRegistry).map((name) => ({
      name,
      description: `Tool for ${name}`,
      // In a real implementation, you'd generate a more detailed schema from Zod
      schema: {},
    }));
    return c.json({ tools });
  });

  app.post("/execute", async (c) => {
    try {
      const body = await c.req.json();
      const { tool, params } = ExecuteBody.parse(body);
      const result = await dispatchRPC(tool, params, c.env, c.executionCtx);
      return c.json({ success: true, result });
    } catch (e: any) {
      return c.json({ success: false, error: e?.message ?? "MCP error" }, 400);
    }
  });

  return app;
}