import { DurableObjectNamespace } from 'cloudflare:workers';

export interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  ROOM_DO: DurableObjectNamespace<RoomDO>;
  DB: D1Database;
  AI: any;
}

export type RPCMethod = "createTask" | "listTasks" | "runAnalysis";

export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done';
  createdAt: string;
}
