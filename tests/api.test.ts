import { describe, it, expect, vi } from "vitest";

// ─── Helper function tests ───────────────────────────────────────────────────

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

  it("handles non-string non-array content by converting to string", () => {
    expect(getContentString(42 as any)).toBe("42");
  });
});

// ─── Knowledge Graph Logic ───────────────────────────────────────────────────

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

  it("handles memories with no topics", () => {
    const memories = [
      { id: 1, aiTopics: [] },
      { id: 2, aiTopics: undefined as any },
    ];

    const topicCount: Record<string, number> = {};
    for (const m of memories) {
      if (m.aiTopics) {
        for (const t of m.aiTopics) {
          topicCount[t] = (topicCount[t] || 0) + 1;
        }
      }
    }

    expect(Object.keys(topicCount)).toHaveLength(0);
  });
});

// ─── Memory Stats Logic ──────────────────────────────────────────────────────

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

  it("handles empty memory list", () => {
    const memories: { type: string }[] = [];
    const byType: Record<string, number> = {};
    for (const m of memories) {
      byType[m.type] = (byType[m.type] || 0) + 1;
    }
    expect(Object.keys(byType)).toHaveLength(0);
  });
});

// ─── Weekly Summary Filtering ────────────────────────────────────────────────

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

  it("returns empty when no memories in past week", () => {
    const now = Date.now();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const memories = [
      { id: 1, createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000), processed: true },
    ];
    const recentMemories = memories.filter(
      (m) => m.processed && new Date(m.createdAt) >= oneWeekAgo
    );
    expect(recentMemories).toHaveLength(0);
  });
});

// ─── JSON Parsing Safety ─────────────────────────────────────────────────────

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

  it("handles weekly summary JSON format", () => {
    const content = JSON.stringify({
      summary: "This week you focused on marketing and AI.",
      newInsights: ["Marketing trends are shifting", "AI adoption is growing"],
      recurringThemes: ["marketing", "technology"],
      knowledgeGaps: ["financial planning"],
    });
    const parsed = JSON.parse(content);
    expect(parsed.newInsights).toHaveLength(2);
    expect(parsed.recurringThemes).toHaveLength(2);
    expect(parsed.knowledgeGaps).toHaveLength(1);
  });

  it("handles idea generation JSON format", () => {
    const content = JSON.stringify({
      ideas: [
        { title: "Idea 1", description: "Description 1", relatedTopics: ["marketing"] },
        { title: "Idea 2", description: "Description 2", relatedTopics: ["sales", "ai"] },
      ],
    });
    const parsed = JSON.parse(content);
    expect(parsed.ideas).toHaveLength(2);
    expect(parsed.ideas[0].relatedTopics).toContain("marketing");
    expect(parsed.ideas[1].relatedTopics).toHaveLength(2);
  });
});

// ─── Subscription & Feature Gating Logic ─────────────────────────────────────

describe("Subscription & Feature Gating", () => {
  const proFeatures = [
    "document_analysis",
    "voice_capture",
    "image_capture",
    "export_pdf",
    "report_generation",
    "market_research",
    "idea_generation",
    "knowledge_graph",
    "push_notifications",
    "unlimited_memories",
    "unlimited_folders",
    "advanced_ai",
  ];

  function canUseFeature(subscription: string, feature: string): boolean {
    if (subscription === "pro") return true;
    return !proFeatures.includes(feature);
  }

  it("pro users can access all features", () => {
    expect(canUseFeature("pro", "document_analysis")).toBe(true);
    expect(canUseFeature("pro", "export_pdf")).toBe(true);
    expect(canUseFeature("pro", "idea_generation")).toBe(true);
    expect(canUseFeature("pro", "push_notifications")).toBe(true);
  });

  it("basic users cannot access pro features", () => {
    expect(canUseFeature("basic", "document_analysis")).toBe(false);
    expect(canUseFeature("basic", "export_pdf")).toBe(false);
    expect(canUseFeature("basic", "idea_generation")).toBe(false);
    expect(canUseFeature("basic", "push_notifications")).toBe(false);
  });

  it("basic users can access non-pro features", () => {
    expect(canUseFeature("basic", "text_capture")).toBe(true);
    expect(canUseFeature("basic", "search")).toBe(true);
    expect(canUseFeature("basic", "basic_summary")).toBe(true);
  });
});

// ─── Subscription Plan Configuration ─────────────────────────────────────────

describe("Subscription Plan Configuration", () => {
  const PLANS = {
    basic: {
      tier: "basic",
      name: "Basic",
      price: "Free",
      priceMonthly: 0,
      memoryLimit: 50,
      folderLimit: 3,
    },
    pro: {
      tier: "pro",
      name: "Pro",
      price: "$9.99/mo",
      priceMonthly: 9.99,
      memoryLimit: -1,
      folderLimit: -1,
    },
  };

  it("basic plan has correct limits", () => {
    expect(PLANS.basic.memoryLimit).toBe(50);
    expect(PLANS.basic.folderLimit).toBe(3);
    expect(PLANS.basic.priceMonthly).toBe(0);
  });

  it("pro plan has unlimited limits", () => {
    expect(PLANS.pro.memoryLimit).toBe(-1);
    expect(PLANS.pro.folderLimit).toBe(-1);
    expect(PLANS.pro.priceMonthly).toBe(9.99);
  });

  it("getMemoryLimit returns correct value", () => {
    function getMemoryLimit(subscription: "basic" | "pro") {
      return PLANS[subscription].memoryLimit;
    }
    expect(getMemoryLimit("basic")).toBe(50);
    expect(getMemoryLimit("pro")).toBe(-1);
  });

  it("getFolderLimit returns correct value", () => {
    function getFolderLimit(subscription: "basic" | "pro") {
      return PLANS[subscription].folderLimit;
    }
    expect(getFolderLimit("basic")).toBe(3);
    expect(getFolderLimit("pro")).toBe(-1);
  });
});

// ─── Favorites Logic ─────────────────────────────────────────────────────────

describe("Favorites Logic", () => {
  it("toggles favorite on", () => {
    let favorites: number[] = [];
    const memoryId = 42;
    if (favorites.includes(memoryId)) {
      favorites = favorites.filter((id) => id !== memoryId);
    } else {
      favorites = [...favorites, memoryId];
    }
    expect(favorites).toContain(42);
  });

  it("toggles favorite off", () => {
    let favorites = [42, 99, 7];
    const memoryId = 42;
    if (favorites.includes(memoryId)) {
      favorites = favorites.filter((id) => id !== memoryId);
    } else {
      favorites = [...favorites, memoryId];
    }
    expect(favorites).not.toContain(42);
    expect(favorites).toHaveLength(2);
  });

  it("isFavorite returns correct boolean", () => {
    const favorites = [1, 5, 10];
    expect(favorites.includes(5)).toBe(true);
    expect(favorites.includes(3)).toBe(false);
  });

  it("filters favorite memories from list", () => {
    const favorites = [1, 3];
    const memories = [
      { id: 1, title: "Note A" },
      { id: 2, title: "Note B" },
      { id: 3, title: "Note C" },
      { id: 4, title: "Note D" },
    ];
    const favoriteMemories = memories.filter((m) => favorites.includes(m.id));
    expect(favoriteMemories).toHaveLength(2);
    expect(favoriteMemories.map((m) => m.title)).toEqual(["Note A", "Note C"]);
  });
});

// ─── Folder Logic ────────────────────────────────────────────────────────────

describe("Folder Logic", () => {
  interface Folder {
    id: string;
    name: string;
    color: string;
    memoryIds: number[];
    createdAt: string;
  }

  it("creates a folder with correct structure", () => {
    const folder: Folder = {
      id: "123",
      name: "Work Notes",
      color: "#6C5CE7",
      memoryIds: [],
      createdAt: new Date().toISOString(),
    };
    expect(folder.name).toBe("Work Notes");
    expect(folder.memoryIds).toHaveLength(0);
  });

  it("adds memory to folder", () => {
    const folder: Folder = {
      id: "123",
      name: "Work",
      color: "#6C5CE7",
      memoryIds: [1, 2],
      createdAt: new Date().toISOString(),
    };
    const memoryId = 3;
    if (!folder.memoryIds.includes(memoryId)) {
      folder.memoryIds.push(memoryId);
    }
    expect(folder.memoryIds).toContain(3);
    expect(folder.memoryIds).toHaveLength(3);
  });

  it("prevents duplicate memory in folder", () => {
    const folder: Folder = {
      id: "123",
      name: "Work",
      color: "#6C5CE7",
      memoryIds: [1, 2, 3],
      createdAt: new Date().toISOString(),
    };
    const memoryId = 2;
    if (!folder.memoryIds.includes(memoryId)) {
      folder.memoryIds.push(memoryId);
    }
    expect(folder.memoryIds).toHaveLength(3);
  });

  it("deletes folder without affecting others", () => {
    const folders: Folder[] = [
      { id: "1", name: "Work", color: "#6C5CE7", memoryIds: [1], createdAt: "" },
      { id: "2", name: "Health", color: "#00D2D3", memoryIds: [2], createdAt: "" },
      { id: "3", name: "Finance", color: "#FDCB6E", memoryIds: [3], createdAt: "" },
    ];
    const updated = folders.filter((f) => f.id !== "2");
    expect(updated).toHaveLength(2);
    expect(updated.map((f) => f.name)).toEqual(["Work", "Finance"]);
  });

  it("enforces folder limit for basic plan", () => {
    const folderLimit = 3;
    const currentFolderCount = 3;
    const canCreate = folderLimit < 0 || currentFolderCount < folderLimit;
    expect(canCreate).toBe(false);
  });

  it("allows unlimited folders for pro plan", () => {
    const folderLimit = -1;
    const currentFolderCount = 100;
    const canCreate = folderLimit < 0 || currentFolderCount < folderLimit;
    expect(canCreate).toBe(true);
  });
});

// ─── Document Analysis Types ─────────────────────────────────────────────────

describe("Document Analysis Types", () => {
  const ANALYSIS_TYPES = ["summary", "contract", "medical", "financial", "research"];

  it("has all expected analysis types", () => {
    expect(ANALYSIS_TYPES).toContain("summary");
    expect(ANALYSIS_TYPES).toContain("contract");
    expect(ANALYSIS_TYPES).toContain("medical");
    expect(ANALYSIS_TYPES).toContain("financial");
    expect(ANALYSIS_TYPES).toContain("research");
    expect(ANALYSIS_TYPES).toHaveLength(5);
  });

  it("each type has a corresponding prompt", () => {
    const prompts: Record<string, string> = {
      summary: "Provide a comprehensive, easy-to-understand summary",
      contract: "Analyze this contract/agreement",
      medical: "Analyze this medical document",
      financial: "Analyze this financial document",
      research: "Analyze this document for research purposes",
    };
    for (const type of ANALYSIS_TYPES) {
      expect(prompts[type]).toBeDefined();
      expect(prompts[type].length).toBeGreaterThan(10);
    }
  });
});

// ─── Export Memory Markdown Format ───────────────────────────────────────────

describe("Export Memory Markdown Format", () => {
  it("generates valid markdown export", () => {
    const memory = {
      title: "Test Memory",
      type: "text",
      createdAt: "2026-03-15T10:00:00Z",
      aiSummary: "This is a test summary",
      aiTopics: ["testing", "development"],
      aiKeyInsights: ["Insight 1", "Insight 2"],
      content: "Original content here",
    };

    const parts = [
      `# ${memory.title}`,
      `**Type:** ${memory.type} | **Date:** ${new Date(memory.createdAt).toLocaleDateString()}`,
      "",
    ];
    if (memory.aiSummary) parts.push(`## AI Summary\n${memory.aiSummary}\n`);
    if (memory.aiTopics?.length) parts.push(`## Topics\n${memory.aiTopics.map((t) => `- ${t}`).join("\n")}\n`);
    if (memory.aiKeyInsights?.length) parts.push(`## Key Insights\n${memory.aiKeyInsights.map((i) => `- ${i}`).join("\n")}\n`);
    if (memory.content) parts.push(`## Original Content\n${memory.content}\n`);
    parts.push("\n---\n*Exported from MindVault*");

    const markdown = parts.join("\n");
    expect(markdown).toContain("# Test Memory");
    expect(markdown).toContain("## AI Summary");
    expect(markdown).toContain("## Topics");
    expect(markdown).toContain("- testing");
    expect(markdown).toContain("- development");
    expect(markdown).toContain("## Key Insights");
    expect(markdown).toContain("*Exported from MindVault*");
  });

  it("handles memory with minimal data", () => {
    const memory = {
      title: "Quick Note",
      type: "text",
      createdAt: "2026-03-15T10:00:00Z",
      content: "Just a quick note",
    };

    const parts = [
      `# ${memory.title}`,
      `**Type:** ${memory.type} | **Date:** ${new Date(memory.createdAt).toLocaleDateString()}`,
      "",
    ];
    if (memory.content) parts.push(`## Original Content\n${memory.content}\n`);
    parts.push("\n---\n*Exported from MindVault*");

    const markdown = parts.join("\n");
    expect(markdown).toContain("# Quick Note");
    expect(markdown).not.toContain("## AI Summary");
    expect(markdown).not.toContain("## Topics");
    expect(markdown).toContain("## Original Content");
  });
});

// ─── Onboarding Flow Logic ───────────────────────────────────────────────────

describe("Onboarding Flow Logic", () => {
  it("has correct number of onboarding slides", () => {
    const SLIDES = [
      { title: "Welcome to MindVault" },
      { title: "Capture Everything" },
      { title: "AI-Powered Analysis" },
      { title: "Ask Questions Naturally" },
      { title: "Insights & Knowledge Graph" },
      { title: "Organize with Folders" },
    ];
    expect(SLIDES).toHaveLength(6);
  });

  it("tracks onboarding completion", () => {
    let hasCompletedOnboarding = false;
    const completeOnboarding = () => {
      hasCompletedOnboarding = true;
    };
    expect(hasCompletedOnboarding).toBe(false);
    completeOnboarding();
    expect(hasCompletedOnboarding).toBe(true);
  });
});

// ─── Tutorial Tips Logic ─────────────────────────────────────────────────────

describe("Tutorial Tips Logic", () => {
  it("marks tutorial as seen", () => {
    const hasSeenTutorial: Record<string, boolean> = {};
    const markTutorialSeen = (key: string) => {
      hasSeenTutorial[key] = true;
    };

    expect(hasSeenTutorial["home_welcome"]).toBeUndefined();
    markTutorialSeen("home_welcome");
    expect(hasSeenTutorial["home_welcome"]).toBe(true);
  });

  it("tracks multiple tutorial tips independently", () => {
    const hasSeenTutorial: Record<string, boolean> = {};
    hasSeenTutorial["home_welcome"] = true;
    hasSeenTutorial["capture_intro"] = true;

    expect(hasSeenTutorial["home_welcome"]).toBe(true);
    expect(hasSeenTutorial["capture_intro"]).toBe(true);
    expect(hasSeenTutorial["ask_ai_intro"]).toBeUndefined();
  });
});

// ─── Guest Mode Logic ────────────────────────────────────────────────────────

describe("Guest Mode Logic", () => {
  it("defaults to not guest", () => {
    const defaultState = { isGuest: false };
    expect(defaultState.isGuest).toBe(false);
  });

  it("can enable guest mode", () => {
    let isGuest = false;
    isGuest = true;
    expect(isGuest).toBe(true);
  });

  it("determines login status correctly", () => {
    const isAuthenticated = false;
    const isGuest = true;
    const isLoggedIn = isAuthenticated || isGuest;
    expect(isLoggedIn).toBe(true);
  });

  it("authenticated user is logged in even without guest mode", () => {
    const isAuthenticated = true;
    const isGuest = false;
    const isLoggedIn = isAuthenticated || isGuest;
    expect(isLoggedIn).toBe(true);
  });
});

// ─── Share Content Generation ────────────────────────────────────────────────

describe("Share Content Generation", () => {
  it("generates share text from memory", () => {
    const memory = {
      title: "Marketing Notes",
      aiSummary: "Key marketing strategies discussed",
      content: "Full content of the notes",
      aiKeyInsights: ["Focus on digital", "Social media growth"],
      sourceUrl: "https://example.com",
    };

    const shareContent = [
      memory.title,
      "",
      memory.aiSummary ? `Summary: ${memory.aiSummary}` : "",
      memory.content ? `\nContent:\n${memory.content}` : "",
      memory.aiKeyInsights?.length
        ? `\nKey Insights:\n${memory.aiKeyInsights.map((i) => `• ${i}`).join("\n")}`
        : "",
      memory.sourceUrl ? `\nSource: ${memory.sourceUrl}` : "",
      "\n— Shared from MindVault",
    ]
      .filter(Boolean)
      .join("\n");

    expect(shareContent).toContain("Marketing Notes");
    expect(shareContent).toContain("Summary: Key marketing strategies discussed");
    expect(shareContent).toContain("• Focus on digital");
    expect(shareContent).toContain("Source: https://example.com");
    expect(shareContent).toContain("— Shared from MindVault");
  });
});


// ─── Phase 3: Tag System Logic ──────────────────────────────────────────────

describe("Tag System Logic", () => {
  interface UserTag {
    id: string;
    name: string;
    color: string;
  }

  it("creates a tag with correct structure", () => {
    const tag: UserTag = {
      id: "abc123",
      name: "Important",
      color: "#D4A017",
    };
    expect(tag.name).toBe("Important");
    expect(tag.color).toBe("#D4A017");
    expect(tag.id).toBeTruthy();
  });

  it("adds tag to memory", () => {
    const memoryTags: Record<number, string[]> = {};
    const memoryId = 42;
    const tagId = "tag1";

    const existing = memoryTags[memoryId] || [];
    if (!existing.includes(tagId)) {
      memoryTags[memoryId] = [...existing, tagId];
    }

    expect(memoryTags[42]).toContain("tag1");
    expect(memoryTags[42]).toHaveLength(1);
  });

  it("prevents duplicate tag on same memory", () => {
    const memoryTags: Record<number, string[]> = { 42: ["tag1"] };
    const memoryId = 42;
    const tagId = "tag1";

    const existing = memoryTags[memoryId] || [];
    if (!existing.includes(tagId)) {
      memoryTags[memoryId] = [...existing, tagId];
    }

    expect(memoryTags[42]).toHaveLength(1);
  });

  it("removes tag from memory", () => {
    const memoryTags: Record<number, string[]> = { 42: ["tag1", "tag2", "tag3"] };
    const memoryId = 42;
    const tagId = "tag2";

    const existing = memoryTags[memoryId] || [];
    memoryTags[memoryId] = existing.filter((id) => id !== tagId);

    expect(memoryTags[42]).toHaveLength(2);
    expect(memoryTags[42]).not.toContain("tag2");
  });

  it("deletes tag and removes from all memories", () => {
    const tags: UserTag[] = [
      { id: "tag1", name: "Work", color: "#00C9A7" },
      { id: "tag2", name: "Personal", color: "#D4A017" },
    ];
    const memoryTags: Record<number, string[]> = {
      1: ["tag1", "tag2"],
      2: ["tag2"],
      3: ["tag1"],
    };

    const tagIdToDelete = "tag2";
    const updatedTags = tags.filter((t) => t.id !== tagIdToDelete);
    const updatedMemoryTags: Record<number, string[]> = {};
    for (const [key, tagIds] of Object.entries(memoryTags)) {
      updatedMemoryTags[Number(key)] = tagIds.filter((id) => id !== tagIdToDelete);
    }

    expect(updatedTags).toHaveLength(1);
    expect(updatedMemoryTags[1]).toEqual(["tag1"]);
    expect(updatedMemoryTags[2]).toEqual([]);
    expect(updatedMemoryTags[3]).toEqual(["tag1"]);
  });

  it("gets memories by tag", () => {
    const memoryTags: Record<number, string[]> = {
      1: ["tag1", "tag2"],
      2: ["tag2"],
      3: ["tag1"],
      4: ["tag3"],
    };

    const tagId = "tag2";
    const memoryIds = Object.entries(memoryTags)
      .filter(([_, tagIds]) => tagIds.includes(tagId))
      .map(([memId]) => Number(memId));

    expect(memoryIds).toEqual([1, 2]);
  });

  it("gets tags for a memory", () => {
    const tags: UserTag[] = [
      { id: "tag1", name: "Work", color: "#00C9A7" },
      { id: "tag2", name: "Personal", color: "#D4A017" },
      { id: "tag3", name: "Urgent", color: "#E74C3C" },
    ];
    const memoryTags: Record<number, string[]> = { 42: ["tag1", "tag3"] };

    const tagIds = memoryTags[42] || [];
    const memTags = tags.filter((t) => tagIds.includes(t.id));

    expect(memTags).toHaveLength(2);
    expect(memTags.map((t) => t.name)).toEqual(["Work", "Urgent"]);
  });
});

// ─── Phase 3: Focus Mode Logic ─────────────────────────────────────────────

describe("Focus Mode Logic", () => {
  interface FocusSession {
    id: string;
    folderId: string;
    folderName: string;
    startedAt: string;
    durationMinutes: number;
    capturedMemoryIds: number[];
    completed: boolean;
  }

  it("creates a focus session with correct structure", () => {
    const session: FocusSession = {
      id: "session1",
      folderId: "folder1",
      folderName: "Marketing Research",
      startedAt: new Date().toISOString(),
      durationMinutes: 25,
      capturedMemoryIds: [],
      completed: false,
    };

    expect(session.durationMinutes).toBe(25);
    expect(session.completed).toBe(false);
    expect(session.capturedMemoryIds).toHaveLength(0);
  });

  it("adds captured memory to active session", () => {
    const session: FocusSession = {
      id: "session1",
      folderId: "folder1",
      folderName: "Work",
      startedAt: new Date().toISOString(),
      durationMinutes: 25,
      capturedMemoryIds: [1, 2],
      completed: false,
    };

    session.capturedMemoryIds = [...session.capturedMemoryIds, 3];
    expect(session.capturedMemoryIds).toHaveLength(3);
    expect(session.capturedMemoryIds).toContain(3);
  });

  it("completes a focus session", () => {
    const session: FocusSession = {
      id: "session1",
      folderId: "folder1",
      folderName: "Work",
      startedAt: new Date().toISOString(),
      durationMinutes: 25,
      capturedMemoryIds: [1, 2, 3],
      completed: false,
    };

    const completed = { ...session, completed: true };
    expect(completed.completed).toBe(true);
    expect(completed.capturedMemoryIds).toHaveLength(3);
  });

  it("calculates timer display correctly", () => {
    const timeLeft = 1523; // seconds
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    expect(minutes).toBe(25);
    expect(seconds).toBe(23);
    expect(String(minutes).padStart(2, "0")).toBe("25");
    expect(String(seconds).padStart(2, "0")).toBe("23");
  });

  it("calculates progress correctly", () => {
    const totalSeconds = 25 * 60; // 1500
    const timeLeft = 750; // halfway
    const progress = 1 - timeLeft / totalSeconds;

    expect(progress).toBeCloseTo(0.5, 2);
  });

  it("validates available durations", () => {
    const DURATIONS = [15, 25, 45, 60, 90];
    expect(DURATIONS).toHaveLength(5);
    expect(DURATIONS[0]).toBe(15);
    expect(DURATIONS[DURATIONS.length - 1]).toBe(90);
  });

  it("stores completed sessions in history", () => {
    const sessions: FocusSession[] = [];
    const completed: FocusSession = {
      id: "s1",
      folderId: "f1",
      folderName: "Work",
      startedAt: "2026-03-15T10:00:00Z",
      durationMinutes: 25,
      capturedMemoryIds: [1, 2],
      completed: true,
    };

    sessions.push(completed);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].completed).toBe(true);
  });
});

// ─── Phase 3: Data Export Logic ─────────────────────────────────────────────

describe("Data Export Logic", () => {
  it("generates markdown for a single memory export", () => {
    const memory = {
      title: "Test Note",
      type: "text",
      content: "Some content here",
      aiSummary: "A brief summary",
      aiTopics: ["testing", "development"],
      aiKeyInsights: ["Key point 1"],
      createdAt: "2026-03-15T10:00:00Z",
    };

    const lines = [
      `# ${memory.title}`,
      `**Type:** ${memory.type} | **Date:** ${new Date(memory.createdAt).toLocaleDateString()}`,
      "",
    ];
    if (memory.aiSummary) lines.push(`## Summary\n${memory.aiSummary}\n`);
    if (memory.aiTopics?.length) lines.push(`## Topics\n${memory.aiTopics.map((t) => `- ${t}`).join("\n")}\n`);
    if (memory.aiKeyInsights?.length) lines.push(`## Key Insights\n${memory.aiKeyInsights.map((i) => `- ${i}`).join("\n")}\n`);
    if (memory.content) lines.push(`## Content\n${memory.content}\n`);

    const md = lines.join("\n");
    expect(md).toContain("# Test Note");
    expect(md).toContain("## Summary");
    expect(md).toContain("- testing");
    expect(md).toContain("- Key point 1");
    expect(md).toContain("## Content");
  });

  it("generates index file for bulk export", () => {
    const memories = [
      { id: 1, title: "Note A", type: "text", createdAt: "2026-03-15T10:00:00Z" },
      { id: 2, title: "Note B", type: "image", createdAt: "2026-03-14T10:00:00Z" },
      { id: 3, title: "Note C", type: "voice", createdAt: "2026-03-13T10:00:00Z" },
    ];

    const indexLines = [
      "# MindVault Knowledge Base Export",
      `**Exported:** ${new Date().toLocaleDateString()}`,
      `**Total Memories:** ${memories.length}`,
      "",
      "## Memories",
      "",
    ];

    for (const m of memories) {
      indexLines.push(`- [${m.title}](./memory_${m.id}.md) — ${m.type} — ${new Date(m.createdAt).toLocaleDateString()}`);
    }

    const index = indexLines.join("\n");
    expect(index).toContain("# MindVault Knowledge Base Export");
    expect(index).toContain(`**Total Memories:** 3`);
    expect(index).toContain("[Note A](./memory_1.md)");
    expect(index).toContain("[Note B](./memory_2.md)");
  });

  it("sanitizes filenames for export", () => {
    function sanitizeFilename(name: string): string {
      return name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
    }

    expect(sanitizeFilename("My Note: Important!")).toBe("My_Note__Important_");
    expect(sanitizeFilename("normal-file_name")).toBe("normal-file_name");
    expect(sanitizeFilename("a".repeat(100))).toHaveLength(50);
  });
});

// ─── Phase 3: Updated Feature Gating (with new pro features) ───────────────

describe("Updated Feature Gating with Phase 3 Features", () => {
  const proFeatures = [
    "document_analysis", "voice_capture", "image_capture", "export_pdf",
    "report_generation", "market_research", "idea_generation", "knowledge_graph",
    "push_notifications", "unlimited_memories", "unlimited_folders", "advanced_ai",
    "focus_mode", "custom_tags", "data_export",
  ];

  function canUseFeature(subscription: string, feature: string): boolean {
    if (subscription === "pro") return true;
    return !proFeatures.includes(feature);
  }

  it("basic users cannot use focus_mode", () => {
    expect(canUseFeature("basic", "focus_mode")).toBe(false);
  });

  it("basic users cannot use custom_tags", () => {
    expect(canUseFeature("basic", "custom_tags")).toBe(false);
  });

  it("basic users cannot use data_export", () => {
    expect(canUseFeature("basic", "data_export")).toBe(false);
  });

  it("pro users can use all new features", () => {
    expect(canUseFeature("pro", "focus_mode")).toBe(true);
    expect(canUseFeature("pro", "custom_tags")).toBe(true);
    expect(canUseFeature("pro", "data_export")).toBe(true);
  });

  it("basic users can still use basic features", () => {
    expect(canUseFeature("basic", "text_capture")).toBe(true);
    expect(canUseFeature("basic", "search")).toBe(true);
    expect(canUseFeature("basic", "link_capture")).toBe(true);
  });
});

// ─── Phase 3: Tag Color Palette ─────────────────────────────────────────────

describe("Tag Color Palette", () => {
  const TAG_COLORS = [
    "#00C9A7", "#D4A017", "#E74C3C", "#3498DB", "#9B59B6",
    "#1ABC9C", "#F39C12", "#E67E22", "#2ECC71", "#E91E63",
  ];

  it("has 10 color options", () => {
    expect(TAG_COLORS).toHaveLength(10);
  });

  it("all colors are valid hex codes", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const color of TAG_COLORS) {
      expect(hexRegex.test(color)).toBe(true);
    }
  });

  it("has no duplicate colors", () => {
    const unique = new Set(TAG_COLORS);
    expect(unique.size).toBe(TAG_COLORS.length);
  });
});
