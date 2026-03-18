import { describe, it, expect, vi } from "vitest";

// ─── OCR Visual Indicator Logic ─────────────────────────────────────────────

describe("OCR Visual Indicator", () => {
  function hasOcrContent(memory: { type: string; aiExtractedText?: string | null }): boolean {
    return memory.type === "image" && !!memory.aiExtractedText && memory.aiExtractedText.length > 0;
  }

  it("shows OCR badge for image memories with extracted text", () => {
    expect(hasOcrContent({ type: "image", aiExtractedText: "Some extracted text from image" })).toBe(true);
  });

  it("does not show OCR badge for image memories without extracted text", () => {
    expect(hasOcrContent({ type: "image", aiExtractedText: null })).toBe(false);
    expect(hasOcrContent({ type: "image", aiExtractedText: "" })).toBe(false);
    expect(hasOcrContent({ type: "image" })).toBe(false);
  });

  it("does not show OCR badge for non-image memories", () => {
    expect(hasOcrContent({ type: "text", aiExtractedText: "Some text" })).toBe(false);
    expect(hasOcrContent({ type: "document", aiExtractedText: "Some text" })).toBe(false);
    expect(hasOcrContent({ type: "voice", aiExtractedText: "Some text" })).toBe(false);
  });
});

// ─── Semantic Search Match Logic ────────────────────────────────────────────

describe("Semantic Search Match Indicator", () => {
  function isSemanticMatch(
    search: string,
    memory: { title: string; content?: string | null; aiSummary?: string | null }
  ): boolean {
    if (!search.trim()) return false;
    if (!memory.aiSummary) return false;
    const lowerSearch = search.toLowerCase();
    if (memory.title.toLowerCase().includes(lowerSearch)) return false;
    if (memory.content?.toLowerCase().includes(lowerSearch)) return false;
    return true;
  }

  it("identifies semantic match when search doesn't match title or content", () => {
    expect(isSemanticMatch("marketing strategy", {
      title: "Q4 Planning Notes",
      content: "We discussed the budget allocation for next quarter",
      aiSummary: "Marketing strategy discussion for Q4 budget planning",
    })).toBe(true);
  });

  it("does not flag as semantic when title matches", () => {
    expect(isSemanticMatch("planning", {
      title: "Q4 Planning Notes",
      content: "Some content",
      aiSummary: "Summary about planning",
    })).toBe(false);
  });

  it("does not flag as semantic when content matches", () => {
    expect(isSemanticMatch("budget", {
      title: "Some Title",
      content: "We discussed the budget allocation",
      aiSummary: "Summary about budget",
    })).toBe(false);
  });

  it("does not flag when search is empty", () => {
    expect(isSemanticMatch("", {
      title: "Title",
      content: "Content",
      aiSummary: "Summary",
    })).toBe(false);
  });

  it("does not flag when no AI summary exists", () => {
    expect(isSemanticMatch("test", {
      title: "Title",
      content: "Content",
      aiSummary: null,
    })).toBe(false);
  });
});

// ─── On This Day Logic ──────────────────────────────────────────────────────

describe("On This Day", () => {
  function getOnThisDayMemories(
    memories: { id: number; title: string; summary: string; createdAt: Date }[],
    today: Date
  ) {
    const month = today.getMonth();
    const day = today.getDate();
    return memories.filter((m) => {
      const d = new Date(m.createdAt);
      return d.getMonth() === month && d.getDate() === day && d.getFullYear() !== today.getFullYear();
    }).map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      date: m.createdAt.toISOString(),
    }));
  }

  it("finds memories from same day in previous years", () => {
    const today = new Date(2026, 2, 18); // March 18, 2026
    const memories = [
      { id: 1, title: "Last year note", summary: "Summary 1", createdAt: new Date(2025, 2, 18) },
      { id: 2, title: "Two years ago", summary: "Summary 2", createdAt: new Date(2024, 2, 18) },
      { id: 3, title: "Different day", summary: "Summary 3", createdAt: new Date(2025, 2, 17) },
      { id: 4, title: "Today this year", summary: "Summary 4", createdAt: new Date(2026, 2, 18) },
    ];
    const result = getOnThisDayMemories(memories, today);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it("returns empty when no memories on this day in past years", () => {
    const today = new Date(2026, 2, 18);
    const memories = [
      { id: 1, title: "Note", summary: "Summary", createdAt: new Date(2025, 2, 19) },
    ];
    expect(getOnThisDayMemories(memories, today)).toHaveLength(0);
  });

  it("excludes memories from the current year", () => {
    const today = new Date(2026, 2, 18);
    const memories = [
      { id: 1, title: "Today", summary: "Summary", createdAt: new Date(2026, 2, 18) },
    ];
    expect(getOnThisDayMemories(memories, today)).toHaveLength(0);
  });
});

// ─── AI Theme of the Week ───────────────────────────────────────────────────

describe("AI Theme of the Week", () => {
  function deriveThemeOfTheWeek(
    topics: { topic: string; count: number }[],
    previousTheme?: string
  ): string | undefined {
    if (topics.length === 0) return undefined;
    // Pick the top topic that isn't the same as last week's theme
    const sorted = [...topics].sort((a, b) => b.count - a.count);
    const candidate = sorted.find((t) => t.topic !== previousTheme);
    return candidate?.topic || sorted[0]?.topic;
  }

  it("returns the most frequent topic as theme", () => {
    const topics = [
      { topic: "marketing", count: 5 },
      { topic: "sales", count: 3 },
      { topic: "ai", count: 2 },
    ];
    expect(deriveThemeOfTheWeek(topics)).toBe("marketing");
  });

  it("avoids repeating the previous theme", () => {
    const topics = [
      { topic: "marketing", count: 5 },
      { topic: "sales", count: 3 },
    ];
    expect(deriveThemeOfTheWeek(topics, "marketing")).toBe("sales");
  });

  it("falls back to top topic if all match previous theme", () => {
    const topics = [{ topic: "marketing", count: 5 }];
    expect(deriveThemeOfTheWeek(topics, "marketing")).toBe("marketing");
  });

  it("returns undefined for empty topics", () => {
    expect(deriveThemeOfTheWeek([])).toBeUndefined();
  });
});

// ─── Teams Tier Subscription ────────────────────────────────────────────────

describe("Teams Tier Subscription", () => {
  const proFeatures = ["document_analysis", "voice_capture", "image_capture", "export_pdf", "report_generation", "market_research", "idea_generation", "knowledge_graph", "push_notifications", "unlimited_memories", "unlimited_folders", "advanced_ai", "focus_mode", "custom_tags", "data_export", "smart_reminders", "collaborative_folders", "daily_digest"];
  const teamsFeatures = ["shared_vaults", "admin_controls", "api_access", "sso", "team_analytics", "custom_branding", "bulk_import_export", "audit_logs"];

  function canUseFeature(subscription: string, feature: string): boolean {
    if (subscription === "teams") return true;
    if (subscription === "pro") return !teamsFeatures.includes(feature);
    return !proFeatures.includes(feature) && !teamsFeatures.includes(feature);
  }

  it("teams users can access all features", () => {
    expect(canUseFeature("teams", "shared_vaults")).toBe(true);
    expect(canUseFeature("teams", "admin_controls")).toBe(true);
    expect(canUseFeature("teams", "api_access")).toBe(true);
    expect(canUseFeature("teams", "sso")).toBe(true);
    expect(canUseFeature("teams", "document_analysis")).toBe(true);
    expect(canUseFeature("teams", "text_capture")).toBe(true);
  });

  it("pro users can access pro features but not teams features", () => {
    expect(canUseFeature("pro", "document_analysis")).toBe(true);
    expect(canUseFeature("pro", "knowledge_graph")).toBe(true);
    expect(canUseFeature("pro", "shared_vaults")).toBe(false);
    expect(canUseFeature("pro", "admin_controls")).toBe(false);
    expect(canUseFeature("pro", "api_access")).toBe(false);
    expect(canUseFeature("pro", "sso")).toBe(false);
  });

  it("basic users cannot access pro or teams features", () => {
    expect(canUseFeature("basic", "document_analysis")).toBe(false);
    expect(canUseFeature("basic", "shared_vaults")).toBe(false);
    expect(canUseFeature("basic", "text_capture")).toBe(true);
  });
});

// ─── Team Member Management ─────────────────────────────────────────────────

describe("Team Member Management", () => {
  interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: "admin" | "member";
    status: "active" | "invited" | "deactivated";
  }

  it("adds a team member", () => {
    const members: TeamMember[] = [];
    const newMember: TeamMember = {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      role: "member",
      status: "invited",
    };
    members.push(newMember);
    expect(members).toHaveLength(1);
    expect(members[0].status).toBe("invited");
  });

  it("removes a team member", () => {
    const members: TeamMember[] = [
      { id: "1", email: "a@test.com", name: "A", role: "member", status: "active" },
      { id: "2", email: "b@test.com", name: "B", role: "admin", status: "active" },
    ];
    const filtered = members.filter((m) => m.id !== "1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].email).toBe("b@test.com");
  });

  it("updates member role", () => {
    const members: TeamMember[] = [
      { id: "1", email: "a@test.com", name: "A", role: "member", status: "active" },
    ];
    const updated = members.map((m) => m.id === "1" ? { ...m, role: "admin" as const } : m);
    expect(updated[0].role).toBe("admin");
  });
});

// ─── Team Vault Management ──────────────────────────────────────────────────

describe("Team Vault Management", () => {
  interface TeamVault {
    id: string;
    name: string;
    memberIds: string[];
  }

  it("creates a vault", () => {
    const vaults: TeamVault[] = [];
    vaults.push({ id: "v1", name: "Marketing", memberIds: [] });
    expect(vaults).toHaveLength(1);
  });

  it("adds member to vault", () => {
    const vault: TeamVault = { id: "v1", name: "Marketing", memberIds: [] };
    const updated = { ...vault, memberIds: [...vault.memberIds, "m1"] };
    expect(updated.memberIds).toContain("m1");
  });

  it("removes member from vault", () => {
    const vault: TeamVault = { id: "v1", name: "Marketing", memberIds: ["m1", "m2"] };
    const updated = { ...vault, memberIds: vault.memberIds.filter((id) => id !== "m1") };
    expect(updated.memberIds).toEqual(["m2"]);
  });

  it("deletes a vault", () => {
    const vaults: TeamVault[] = [
      { id: "v1", name: "Marketing", memberIds: [] },
      { id: "v2", name: "Sales", memberIds: [] },
    ];
    const filtered = vaults.filter((v) => v.id !== "v1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Sales");
  });
});

// ─── Referral System ────────────────────────────────────────────────────────

describe("Referral System", () => {
  interface Referral {
    id: string;
    code: string;
    referredEmail: string;
    status: "pending" | "converted" | "expired";
    createdAt: string;
    convertedAt?: string;
  }

  it("generates a referral code", () => {
    const code = "MV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    expect(code).toMatch(/^MV-[A-Z0-9]{6}$/);
  });

  it("adds a referral", () => {
    const referrals: Referral[] = [];
    referrals.push({
      id: "r1",
      code: "MV-ABC123",
      referredEmail: "friend@test.com",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    expect(referrals).toHaveLength(1);
    expect(referrals[0].status).toBe("pending");
  });

  it("converts a referral", () => {
    const referral: Referral = {
      id: "r1",
      code: "MV-ABC123",
      referredEmail: "friend@test.com",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const converted = { ...referral, status: "converted" as const, convertedAt: new Date().toISOString() };
    expect(converted.status).toBe("converted");
    expect(converted.convertedAt).toBeDefined();
  });

  it("calculates referral stats correctly", () => {
    const referrals: Referral[] = [
      { id: "r1", code: "MV-A", referredEmail: "a@test.com", status: "converted", createdAt: "", convertedAt: "" },
      { id: "r2", code: "MV-A", referredEmail: "b@test.com", status: "pending", createdAt: "" },
      { id: "r3", code: "MV-A", referredEmail: "c@test.com", status: "pending", createdAt: "" },
      { id: "r4", code: "MV-A", referredEmail: "d@test.com", status: "expired", createdAt: "" },
    ];
    const stats = {
      total: referrals.length,
      converted: referrals.filter((r) => r.status === "converted").length,
      pending: referrals.filter((r) => r.status === "pending").length,
    };
    expect(stats.total).toBe(4);
    expect(stats.converted).toBe(1);
    expect(stats.pending).toBe(2);
  });
});

// ─── Upgrade Prompt Analytics ───────────────────────────────────────────────

describe("Upgrade Prompt Analytics", () => {
  interface UpgradePromptEvent {
    id: string;
    feature: string;
    screen: string;
    timestamp: string;
    converted: boolean;
  }

  it("tracks an upgrade prompt event", () => {
    const events: UpgradePromptEvent[] = [];
    events.push({
      id: "e1",
      feature: "document_analysis",
      screen: "capture",
      timestamp: new Date().toISOString(),
      converted: false,
    });
    expect(events).toHaveLength(1);
    expect(events[0].converted).toBe(false);
  });

  it("marks an event as converted", () => {
    const event: UpgradePromptEvent = {
      id: "e1",
      feature: "document_analysis",
      screen: "capture",
      timestamp: new Date().toISOString(),
      converted: false,
    };
    const converted = { ...event, converted: true };
    expect(converted.converted).toBe(true);
  });

  it("calculates analytics correctly", () => {
    const events: UpgradePromptEvent[] = [
      { id: "e1", feature: "document_analysis", screen: "capture", timestamp: "", converted: true },
      { id: "e2", feature: "document_analysis", screen: "library", timestamp: "", converted: false },
      { id: "e3", feature: "knowledge_graph", screen: "insights", timestamp: "", converted: true },
      { id: "e4", feature: "export_pdf", screen: "export", timestamp: "", converted: false },
    ];

    const totalPrompts = events.length;
    const conversions = events.filter((e) => e.converted).length;
    const conversionRate = (conversions / totalPrompts) * 100;

    expect(totalPrompts).toBe(4);
    expect(conversions).toBe(2);
    expect(conversionRate).toBe(50);

    // Top features
    const featureMap: Record<string, number> = {};
    for (const e of events) {
      featureMap[e.feature] = (featureMap[e.feature] || 0) + 1;
    }
    const topFeatures = Object.entries(featureMap)
      .sort((a, b) => b[1] - a[1])
      .map(([feature, count]) => ({ feature, count }));

    expect(topFeatures[0].feature).toBe("document_analysis");
    expect(topFeatures[0].count).toBe(2);
  });

  it("limits stored events to prevent unbounded growth", () => {
    const maxEvents = 200;
    const events: UpgradePromptEvent[] = [];
    for (let i = 0; i < 250; i++) {
      events.push({
        id: `e${i}`,
        feature: "test",
        screen: "test",
        timestamp: new Date().toISOString(),
        converted: false,
      });
    }
    const trimmed = events.slice(-maxEvents);
    expect(trimmed).toHaveLength(200);
    expect(trimmed[0].id).toBe("e50");
  });
});

// ─── Shareable Insight Card Themes ──────────────────────────────────────────

describe("Shareable Insight Card Themes", () => {
  const CARD_THEMES = [
    { id: "gold", name: "Gold", accent: "#FFD700" },
    { id: "ocean", name: "Ocean", accent: "#4FC3F7" },
    { id: "sunset", name: "Sunset", accent: "#FF6B6B" },
    { id: "forest", name: "Forest", accent: "#81C784" },
    { id: "purple", name: "Violet", accent: "#BB86FC" },
  ];

  it("has 5 theme options", () => {
    expect(CARD_THEMES).toHaveLength(5);
  });

  it("each theme has unique id and accent color", () => {
    const ids = new Set(CARD_THEMES.map((t) => t.id));
    const accents = new Set(CARD_THEMES.map((t) => t.accent));
    expect(ids.size).toBe(5);
    expect(accents.size).toBe(5);
  });

  it("generates share text with branding", () => {
    const title = "My Insight";
    const insight = "AI is transforming everything";
    const topic = "Technology";
    const showBranding = true;
    const text = `${title}\n\n"${insight}"\n\n${topic ? `Topic: ${topic}\n` : ""}${showBranding ? "\nShared via MindVault" : ""}`;
    expect(text).toContain("My Insight");
    expect(text).toContain("AI is transforming everything");
    expect(text).toContain("Topic: Technology");
    expect(text).toContain("Shared via MindVault");
  });

  it("generates share text without branding", () => {
    const title = "My Insight";
    const insight = "Test";
    const showBranding = false;
    const text = `${title}\n\n"${insight}"\n\n${showBranding ? "\nShared via MindVault" : ""}`;
    expect(text).not.toContain("Shared via MindVault");
  });
});

// ─── Daily Digest with Theme and On This Day ────────────────────────────────

describe("Daily Digest Extended", () => {
  interface DailyDigest {
    id: string;
    date: string;
    insight: string;
    focusTopic: string;
    memoriesCount: number;
    themeOfTheWeek?: string;
    onThisDay?: { id: number; title: string; summary: string; date: string }[];
  }

  it("includes theme of the week in digest", () => {
    const digest: DailyDigest = {
      id: "d1",
      date: new Date().toISOString(),
      insight: "You focused on marketing this week.",
      focusTopic: "Marketing",
      memoriesCount: 12,
      themeOfTheWeek: "Digital Marketing Strategies",
    };
    expect(digest.themeOfTheWeek).toBe("Digital Marketing Strategies");
  });

  it("includes on this day memories", () => {
    const digest: DailyDigest = {
      id: "d1",
      date: new Date().toISOString(),
      insight: "Test",
      focusTopic: "Test",
      memoriesCount: 5,
      onThisDay: [
        { id: 1, title: "Last year note", summary: "Summary", date: "2025-03-18T00:00:00.000Z" },
        { id: 2, title: "Two years ago", summary: "Summary", date: "2024-03-18T00:00:00.000Z" },
      ],
    };
    expect(digest.onThisDay).toHaveLength(2);
    expect(digest.onThisDay![0].title).toBe("Last year note");
  });

  it("handles digest without optional fields", () => {
    const digest: DailyDigest = {
      id: "d1",
      date: new Date().toISOString(),
      insight: "Test",
      focusTopic: "Test",
      memoriesCount: 0,
    };
    expect(digest.themeOfTheWeek).toBeUndefined();
    expect(digest.onThisDay).toBeUndefined();
  });
});
