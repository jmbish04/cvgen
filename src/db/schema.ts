import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';
import { InferSelectModel, relations, sql } from 'drizzle-orm';

export const testDefs = sqliteTable('test_defs', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category'),
    severity: text('severity'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    errorMap: text('error_map'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const testResults = sqliteTable('test_results', {
    id: text('id').primaryKey(),
    sessionUuid: text('session_uuid').notNull(),
    testFk: text('test_fk').notNull().references(() => testDefs.id),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    durationMs: integer('duration_ms'),
    status: text('status', { enum: ['pass', 'fail'] }).notNull(),
    errorCode: text('error_code'),
    raw: text('raw'),
    aiHumanReadableErrorDescription: text('ai_human_readable_error_description'),
    aiPromptToFixError: text('ai_prompt_to_fix_error'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
    return {
        sessionUuidIdx: index('idx_results_session').on(table.sessionUuid),
        testFkIdx: index('idx_results_testfk').on(table.testFk),
        finishedAtIdx: index('idx_results_finished').on(table.finishedAt),
    };
});

export const testDefsRelations = relations(testDefs, ({ many }) => ({
    results: many(testResults),
}));

export const testResultsRelations = relations(testResults, ({ one }) => ({
    definition: one(testDefs, {
        fields: [testResults.testFk],
        references: [testDefs.id],
    }),
}));

export type TestDef = InferSelectModel<typeof testDefs>;
export type NewTestDef = Omit<TestDef, 'id' | 'createdAt'>;

export type TestResult = InferSelectModel<typeof testResults>;
export type NewTestResult = Omit<TestResult, 'id' | 'createdAt'>;
