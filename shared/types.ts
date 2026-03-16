/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type MemoryType = "text" | "image" | "voice" | "document" | "link";

export interface WeeklySummary {
  summary: string;
  newInsights: string[];
  recurringThemes: string[];
  knowledgeGaps: string[];
  memoryCount: number;
}

export interface Idea {
  title: string;
  description: string;
  relatedTopics: string[];
}

export interface KnowledgeNode {
  id: string;
  label: string;
  size: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  weight: number;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  topTopics: { topic: string; count: number }[];
}
