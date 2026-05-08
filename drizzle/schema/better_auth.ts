import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Better-Auth sessions table.
 * Stores active sessions for magic-link authenticated users.
 */
export const betterAuthSessions = mysqlTable("better_auth_sessions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  userId: int("userId").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BetterAuthSession = typeof betterAuthSessions.$inferSelect;
export type InsertBetterAuthSession = typeof betterAuthSessions.$inferInsert;

/**
 * Better-Auth verification tokens table.
 * Stores magic-link tokens for email verification.
 */
export const verificationTokens = mysqlTable("verification_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 256 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type InsertVerificationToken = typeof verificationTokens.$inferInsert;
