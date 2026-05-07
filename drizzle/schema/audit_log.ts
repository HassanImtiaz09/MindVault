import { bigint, index, int, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const auditLog = mysqlTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: int("user_id"),
    action: varchar("action", { length: 64 }).notNull(),
    payload: json("payload"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_user_occurred_idx").on(table.userId, table.occurredAt),
    index("audit_log_action_idx").on(table.action),
  ]
);

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
