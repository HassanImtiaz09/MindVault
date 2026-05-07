import { decimal, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const modelRoutingLog = mysqlTable("model_routing_log", {
  id: int("id").autoincrement().primaryKey(),
  jobName: varchar("job_name", { length: 64 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  model: varchar("model", { length: 128 }).notNull(),
  promptTokens: int("prompt_tokens").default(0).notNull(),
  completionTokens: int("completion_tokens").default(0).notNull(),
  latencyMs: int("latency_ms").notNull(),
  costEstimatePence: decimal("cost_estimate_pence", { precision: 10, scale: 4 })
    .default("0")
    .notNull(),
  errorMessage: text("error_message"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export type ModelRoutingLog = typeof modelRoutingLog.$inferSelect;
export type InsertModelRoutingLog = typeof modelRoutingLog.$inferInsert;
