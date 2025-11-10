import { z } from "zod";
import * as S from "./schemas/apiSchemas";
import type { Env } from "./types";
import { TTask } from "./schemas/apiSchemas";

const tasks: TTask[] = [];

const createTask = async (params: unknown) => {
  const input = S.CreateTaskRequest.parse(params);
  const task: TTask = {
    id: crypto.randomUUID(),
    title: input.title,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  return { success: true as const, task };
};

const listTasks = async () => {
  return { success: true as const, tasks: tasks };
};

const runAnalysis = async (params: unknown) => {
  const input = S.AnalysisRequest.parse(params);
  return { success: true as const, report: { taskId: input.taskId, score: 0.82, notes: "ok" } };
};

export const rpcRegistry = {
  createTask,
  listTasks,
  runAnalysis,
};

export async function dispatchRPC(method: string, params: unknown, env: Env, ctx: ExecutionContext) {
  if (!(method in rpcRegistry)) {
    throw new Error(`Unknown method: ${method}`);
  }
  // @ts-expect-error runtime check above
  return await rpcRegistry[method](params, env, ctx);
}