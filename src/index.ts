import { buildRouter } from "./router";
import { RoomDO } from "./do/RoomDO";
import { buildOpenAPIDocument } from "./utils/openapi";
import type { Env } from "./types";
import { Hono } from "hono";
import { mcpRoutes } from "./mcp";
import YAML from 'yaml';

const app = new Hono<{ Bindings: Env }>();

app.get("/openapi.json", (c) => {
  const doc = buildOpenAPIDocument(new URL(c.req.url).origin);
  return c.json(doc);
});

app.get("/openapi.yaml", (c) => {
  const doc = buildOpenAPIDocument(new URL(c.req.url).origin);
  const yaml = YAML.stringify(doc);
  return new Response(yaml, { headers: { "content-type": "application/yaml" } });
});

app.get("/ws", async (c) => {
  const projectId = new URL(c.req.url).searchParams.get("projectId") ?? "default";
  const id = c.env.ROOM_DO.idFromName(projectId);
  const stub = c.env.ROOM_DO.get(id);
  return stub.fetch(c.req.raw);
});

app.route('/mcp', mcpRoutes());
app.route('/api', buildRouter());

app.get('*', (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
});


export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;

export { RoomDO };