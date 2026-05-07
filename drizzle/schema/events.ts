import { bigint, index, int, json, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const events = mysqlTable(
  "events",
  {
    id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
    userId: int("user_id"),
    eventName: varchar("event_name", { length: 64 }).notNull(),
    payload: json("payload").notNull(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    syncedAt: timestamp("synced_at").defaultNow(),
  },
  (table) => [
    index("events_user_occurred_idx").on(table.userId, table.occurredAt),
    index("events_name_idx").on(table.eventName),
  ]
);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
