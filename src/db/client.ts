import { drizzle } from 'drizzle-orm/d1';
import { Kysely } from 'kysely';
import { D1Dialect } from 'kysely-d1';
import * as schema from './schema';
import { TestDef, TestResult } from './schema';
import { Env } from '../types';

export interface Database {
    test_defs: TestDef;
    test_results: TestResult;
}

export const initDb = (env: Env) => ({
    drizzle: drizzle(env.DB, { schema }),
    kysely: new Kysely<Database>({
        dialect: new D1Dialect({ database: env.DB }),
    }),
});