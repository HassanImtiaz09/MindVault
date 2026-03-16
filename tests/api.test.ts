import { describe, it, expect, vi } from "vitest";

// Test the helper function logic
describe("getContentString helper", () => {
  function getContentString(content: string | Array<any> | undefined | null): string {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
    }
    return String(content);
  }

  it("returns empty string for null/undefined", () => {
    expect(getContentString(null)).toBe("");
    expect(getContentString(undefined)).toBe("");
  });

  it("returns string content directly", () => {
    expect(getContentString("hello world")).toBe("hello world");
  });

  it("extracts text from content array", () => {
    const content = [
      { type: "text", text: "First part" },
      { type: "image_url", image_url: { url: "http://example.com" } },
      { type: "text", text: "Second part" },
    ];
    expect(getContentString(content)).toBe("First part\nSecond part");
  });

  it("returns empty string for empty array", () => {
    expect(getContentString([])).toBe("");
  });
});

// Test knowledge graph data structure logic
describe("Knowledge Graph Logic", () => {
  it("builds nodes from topic counts", () => {
    const memories = [
      { id: 1, aiTopics: ["marketing", "sales"], processed: true },
      { id: 2, aiTopics: ["marketing", "analytics"], processed: true },
      { id: 3, aiTopics: ["sales", "analytics"], processed: true },
    ];

    const topicCount: Record<string, number> = {};
    for (const m of memories) {
      if (m.aiTopics) {
        for (const t of m.aiTopics) {
          topicCount[t] = (topicCount[t] || 0) + 1;
        }
      }
    }

    const nodes = Object.entries(topicCount).map(([topic, count]) => ({
      id: topic,
      label: topic,
      size: count,
    }));

    expect(nodes).toHaveLength(3);
    expect(nodes.find((n) => n.id === "marketing")?.size).toBe(2);
    expect(nodes.find((n) => n.id === "sales")?.size).toBe(2);
    expect(nodes.find((n) => n.id === "analytics")?.size).toBe(2);
  });

  it("builds edges from co-occurring topics", () => {
    const memories = [
      { id: 1, aiTopics: ["marketing", "sales"] },
      { id: 2, aiTopics: ["marketing", "analytics"] },
    ];

    const edgeMap: Record<string, number> = {};
    for (const m of memories) {
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

    expect(edges).toHaveLength(2);
    expect(edges.find((e) => e.source === "marketing" && e.target === "sales")).toBeTruthy();
  });
});

// Test stats aggregation logic
describe("Memory Stats Logic", () => {
  it("calculates type breakdown correctly", () => {
    const memories = [
      { type: "text" },
      { type: "text" },
      { type: "image" },
      { type: "voice" },
      { type: "link" },
      { type: "link" },
    ];

    const byType: Record<string, number> = {};
    for (const m of memories) {
      byType[m.type] = (byType[m.type] || 0) + 1;
    }

    expect(byType.text).toBe(2);
    expect(byType.image).toBe(1);
    expect(byType.voice).toBe(1);
    expect(byType.link).toBe(2);
  });

  it("ranks topics by frequency", () => {
    const memories = [
      { aiTopics: ["marketing", "sales"] },
      { aiTopics: ["marketing", "analytics"] },
      { aiTopics: ["marketing"] },
      { aiTopics: ["sales"] },
    ];

    const topicCount: Record<string, number> = {};
    for (const m of memories) {
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

    expect(topTopics[0].topic).toBe("marketing");
    expect(topTopics[0].count).toBe(3);
    expect(topTopics[1].count).toBe(2);
  });
});

// Test weekly summary filtering logic
describe("Weekly Summary Filtering", () => {
  it("filters memories from the past week", () => {
    const now = Date.now();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const memories = [
      { id: 1, createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000), processed: true },
      { id: 2, createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000), processed: true },
      { id: 3, createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000), processed: true },
      { id: 4, createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000), processed: false },
    ];

    const recentMemories = memories.filter(
      (m) => m.processed && new Date(m.createdAt) >= oneWeekAgo
    );

    expect(recentMemories).toHaveLength(2);
    expect(recentMemories.map((m) => m.id)).toEqual([1, 2]);
  });
});

// Test JSON parsing safety
describe("JSON Parsing Safety", () => {
  it("handles valid JSON response", () => {
    const content = '{"summary": "Test summary", "topics": ["a", "b"], "keyInsights": ["insight1"]}';
    const parsed = JSON.parse(content);
    expect(parsed.summary).toBe("Test summary");
    expect(parsed.topics).toHaveLength(2);
    expect(parsed.keyInsights).toHaveLength(1);
  });

  it("handles invalid JSON gracefully", () => {
    const content = "This is not JSON";
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { summary: content, topics: [], keyInsights: [] };
    }
    expect(result.summary).toBe(content);
    expect(result.topics).toEqual([]);
  });

  it("handles empty content", () => {
    const content = "{}";
    const parsed = JSON.parse(content);
    expect(parsed.summary || "Processed").toBe("Processed");
    expect(parsed.topics || []).toEqual([]);
  });
});
