import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, memories, InsertMemory, Memory, chatMessages, InsertChatMessage } from "../drizzle/schema";
import { modelRoutingLog, InsertModelRoutingLog } from "../drizzle/schema/model_routing_log";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// --- Memory CRUD ---

export async function createMemory(data: InsertMemory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(memories).values(data).$returningId();
  return result.id;
}

export async function getMemoryById(id: number): Promise<Memory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(memories).where(eq(memories.id, id)).limit(1);
  return result[0];
}

export async function getUserMemories(userId: number, opts?: {
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Memory[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(memories.userId, userId)];
  if (opts?.type && opts.type !== "all") {
    conditions.push(eq(memories.type, opts.type as any));
  }
  if (opts?.search) {
    const searchTerm = `%${opts.search}%`;
    conditions.push(
      or(
        like(memories.title, searchTerm),
        like(memories.content, searchTerm),
        like(memories.aiSummary, searchTerm),
        like(memories.aiExtractedText, searchTerm),
        like(memories.aiTranscription, searchTerm),
      )!
    );
  }
  return db
    .select()
    .from(memories)
    .where(and(...conditions))
    .orderBy(desc(memories.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
}

export async function updateMemory(id: number, data: Partial<InsertMemory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(memories).set(data).where(eq(memories.id, id));
}

export async function deleteMemory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(memories).where(eq(memories.id, id));
}

export async function getMemoryStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, byType: {}, topTopics: [] };
  const allMemories = await db.select().from(memories).where(eq(memories.userId, userId));
  const byType: Record<string, number> = {};
  const topicCount: Record<string, number> = {};
  for (const m of allMemories) {
    byType[m.type] = (byType[m.type] || 0) + 1;
    if (m.aiTopics) {
      for (const t of m.aiTopics) {
        topicCount[t] = (topicCount[t] || 0) + 1;
      }
    }
  }
  const topTopics = Object.entries(topicCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([topic, count]) => ({ topic, count }));
  return { total: allMemories.length, byType, topTopics };
}

export async function getRecentMemories(userId: number, limit = 5): Promise<Memory[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(memories)
    .where(eq(memories.userId, userId))
    .orderBy(desc(memories.createdAt))
    .limit(limit);
}

// --- Chat Messages ---

export async function saveChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(chatMessages).values(data);
}

export async function getChatHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

// --- Knowledge Graph Data ---

export async function getKnowledgeGraphData(userId: number) {
  const db = await getDb();
  if (!db) return { nodes: [], edges: [] };
  const allMemories = await db.select().from(memories).where(
    and(eq(memories.userId, userId), eq(memories.processed, true))
  );
  const topicMemories: Record<string, number[]> = {};
  const topicCount: Record<string, number> = {};
  for (const m of allMemories) {
    if (m.aiTopics) {
      for (const t of m.aiTopics) {
        if (!topicMemories[t]) topicMemories[t] = [];
        topicMemories[t].push(m.id);
        topicCount[t] = (topicCount[t] || 0) + 1;
      }
    }
  }
  const topics = Object.keys(topicCount);
  const nodes = topics.map((topic) => ({
    id: topic,
    label: topic,
    size: topicCount[topic],
  }));
  const edgeMap: Record<string, number> = {};
  for (const m of allMemories) {
    if (m.aiTopics && m.aiTopics.length > 1) {
      for (let i = 0; i < m.aiTopics.length; i++) {
        for (let j = i + 1; j < m.aiTopics.length; j++) {
          const key = [m.aiTopics[i], m.aiTopics[j]].sort().join("|||");
          edgeMap[key] = (edgeMap[key] || 0) + 1;
        }
      }
    }
  }
  const edges = Object.entries(edgeMap).map(([key, weight]) => {
    const [source, target] = key.split("|||");
    return { source, target, weight };
  });
  return { nodes, edges };
}

// --- Model routing telemetry ---

export async function logModelRouting(data: InsertModelRoutingLog): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(modelRoutingLog).values(data);
}
