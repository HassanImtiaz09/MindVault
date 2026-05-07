import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { events, InsertEvent } from "../../drizzle/schema/events";
import { featureFlags, InsertFeatureFlag } from "../../drizzle/schema/feature_flags";
import { auditLog, InsertAuditLog } from "../../drizzle/schema/audit_log";
import { modelRoutingLog, InsertModelRoutingLog } from "../../drizzle/schema/model_routing_log";

const DATABASE_URL = process.env.DATABASE_URL;

// Skip entire suite if no DATABASE_URL (CI without secrets, local dev without DB)
const describeDb = DATABASE_URL ? describe : describe.skip;

let db: ReturnType<typeof drizzle>;

describeDb("Schema smoke tests (live TiDB)", () => {
  beforeAll(() => {
    db = drizzle(DATABASE_URL!);
  });

  afterAll(async () => {
    // Cleanup is done inline per test
  });

  describe("events table", () => {
    it("inserts an event with JSON payload, selects by user_id, verifies round-trip, then deletes", async () => {
      const payload = { action: "memory_created", memoryId: 42, tags: ["test", "smoke"] };
      const insertData: InsertEvent = {
        userId: 999,
        eventName: "test.smoke",
        payload,
      };

      // Insert
      const [inserted] = await db.insert(events).values(insertData).$returningId();
      expect(inserted.id).toBeGreaterThan(0);

      // Select
      const rows = await db.select().from(events).where(eq(events.id, inserted.id));
      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.userId).toBe(999);
      expect(row.eventName).toBe("test.smoke");
      // JSON round-trip
      expect(row.payload).toEqual(payload);
      expect(row.occurredAt).toBeInstanceOf(Date);

      // Cleanup
      await db.delete(events).where(eq(events.id, inserted.id));
      const afterDelete = await db.select().from(events).where(eq(events.id, inserted.id));
      expect(afterDelete).toHaveLength(0);
    });
  });

  describe("feature_flags table", () => {
    it("inserts a flag, toggles enabled, verifies updated_at fires, then deletes", async () => {
      const flagKey = `test_flag_${Date.now()}`;
      const insertData: InsertFeatureFlag = {
        key: flagKey,
        enabled: false,
        rolloutPct: 25,
        description: "Smoke test flag",
      };

      // Insert
      const [inserted] = await db.insert(featureFlags).values(insertData).$returningId();
      expect(inserted.id).toBeGreaterThan(0);

      // Select and verify initial state
      const [initial] = await db.select().from(featureFlags).where(eq(featureFlags.id, inserted.id));
      expect(initial.key).toBe(flagKey);
      expect(initial.enabled).toBe(false);
      expect(initial.rolloutPct).toBe(25);
      const initialUpdatedAt = initial.updatedAt;

      // Small delay to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 1100));

      // Toggle enabled
      await db.update(featureFlags).set({ enabled: true }).where(eq(featureFlags.id, inserted.id));

      // Verify updated_at changed
      const [updated] = await db.select().from(featureFlags).where(eq(featureFlags.id, inserted.id));
      expect(updated.enabled).toBe(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());

      // Cleanup
      await db.delete(featureFlags).where(eq(featureFlags.id, inserted.id));
    });
  });

  describe("audit_log table", () => {
    it("inserts with ip + user agent, selects, then deletes", async () => {
      const insertData: InsertAuditLog = {
        userId: 1,
        action: "memory.delete",
        payload: { memoryId: 7, reason: "user_request" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      };

      // Insert
      const [inserted] = await db.insert(auditLog).values(insertData).$returningId();
      expect(inserted.id).toBeGreaterThan(0);

      // Select
      const [row] = await db.select().from(auditLog).where(eq(auditLog.id, inserted.id));
      expect(row.userId).toBe(1);
      expect(row.action).toBe("memory.delete");
      expect(row.payload).toEqual({ memoryId: 7, reason: "user_request" });
      expect(row.ipAddress).toBe("192.168.1.100");
      expect(row.userAgent).toContain("Mozilla/5.0");
      expect(row.occurredAt).toBeInstanceOf(Date);

      // Cleanup
      await db.delete(auditLog).where(eq(auditLog.id, inserted.id));
    });
  });

  describe("model_routing_log table", () => {
    it("inserts a sample log entry, selects, verifies Decimal cost round-trips, then deletes", async () => {
      const insertData: InsertModelRoutingLog = {
        jobName: "summarise_memory",
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        promptTokens: 1500,
        completionTokens: 300,
        latencyMs: 2340,
        costEstimatePence: "0.0042",
      };

      // Insert
      const [inserted] = await db.insert(modelRoutingLog).values(insertData).$returningId();
      expect(inserted.id).toBeGreaterThan(0);

      // Select
      const [row] = await db.select().from(modelRoutingLog).where(eq(modelRoutingLog.id, inserted.id));
      expect(row.jobName).toBe("summarise_memory");
      expect(row.provider).toBe("anthropic");
      expect(row.model).toBe("claude-sonnet-4-20250514");
      expect(row.promptTokens).toBe(1500);
      expect(row.completionTokens).toBe(300);
      expect(row.latencyMs).toBe(2340);
      // Decimal round-trip: TiDB returns string for decimal
      expect(row.costEstimatePence).toBe("0.0042");
      expect(row.occurredAt).toBeInstanceOf(Date);

      // Cleanup
      await db.delete(modelRoutingLog).where(eq(modelRoutingLog.id, inserted.id));
    });
  });
});
