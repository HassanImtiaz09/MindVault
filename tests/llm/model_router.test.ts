import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.ANTHROPIC_API_KEY = "test-anthropic";
  process.env.OPENAI_API_KEY = "test-openai";
  process.env.GOOGLE_AI_KEY = "test-google";
  process.env.HELICONE_API_KEY = "test-helicone";
});

// ─── Mock provider SDKs ──────────────────────────────────────────────────────

const anthropicCtorOpts: Array<unknown> = [];
const mockAnthropicCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation((opts) => {
    anthropicCtorOpts.push(opts);
    return { messages: { create: mockAnthropicCreate } };
  }),
}));

const openaiCtorOpts: Array<unknown> = [];
const mockOpenAICreate = vi.fn();
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation((opts) => {
    openaiCtorOpts.push(opts);
    return { chat: { completions: { create: mockOpenAICreate } } };
  }),
}));

const googleCtorOpts: Array<unknown> = [];
const mockGoogleGenerate = vi.fn();
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation((opts) => {
    googleCtorOpts.push(opts);
    return { models: { generateContent: mockGoogleGenerate } };
  }),
}));

// ─── Mock the DB logger so model_router doesn't try to hit MySQL ────────────

const mockLogModelRouting = vi.fn().mockResolvedValue(undefined);
vi.mock("../../server/db", () => ({
  logModelRouting: (...args: unknown[]) => mockLogModelRouting(...args),
}));

// Imports MUST come after vi.mock + vi.hoisted, but vi.mock hoists
// automatically so this is safe.
import {
  hasMultimodalContent,
  invoke,
  JOB_CONFIG,
  ModelRouterError,
  __resetClientsForTests,
} from "../../server/_core/model_router";

// Convenience canned responses
const anthropicResponse = (text = "ok", model = "claude-sonnet-4-6") => ({
  id: "msg_test",
  model,
  content: [{ type: "text", text }],
  stop_reason: "end_turn",
  usage: { input_tokens: 10, output_tokens: 4 },
});

const googleResponse = (text = "ok") => ({
  text,
  candidates: [{ finishReason: "STOP" }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 4, totalTokenCount: 14 },
});

beforeEach(() => {
  vi.clearAllMocks();
  anthropicCtorOpts.length = 0;
  openaiCtorOpts.length = 0;
  googleCtorOpts.length = 0;
  __resetClientsForTests();
});

describe("modelRouter — job routing", () => {
  it("routes cards.generate (text only) to Anthropic claude-haiku-4-5", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse("hi", "claude-haiku-4-5"));
    await invoke("cards.generate", { messages: [{ role: "user", content: "hi" }] });
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
    expect(mockAnthropicCreate.mock.calls[0][0].model).toBe("claude-haiku-4-5");
    expect(mockGoogleGenerate).not.toHaveBeenCalled();
  });

  it("routes plan.compose to Anthropic claude-sonnet-4-6", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse());
    await invoke("plan.compose", { messages: [{ role: "user", content: "x" }] });
    expect(mockAnthropicCreate.mock.calls[0][0].model).toBe("claude-sonnet-4-6");
  });

  it("routes vault.qa (text only) to Anthropic claude-sonnet-4-6", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse());
    await invoke("vault.qa", { messages: [{ role: "user", content: "what is x?" }] });
    expect(mockAnthropicCreate.mock.calls[0][0].model).toBe("claude-sonnet-4-6");
    expect(mockGoogleGenerate).not.toHaveBeenCalled();
  });

  it("redirects vault.qa with image_url to Google gemini-2.5-pro (multimodal)", async () => {
    mockGoogleGenerate.mockResolvedValueOnce(googleResponse());
    await invoke("vault.qa", {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "describe" },
            { type: "image_url", image_url: { url: "https://example.com/x.jpg" } },
          ],
        },
      ],
    });
    expect(mockGoogleGenerate).toHaveBeenCalledTimes(1);
    expect(mockGoogleGenerate.mock.calls[0][0].model).toBe("gemini-2.5-pro");
    expect(mockAnthropicCreate).not.toHaveBeenCalled();
  });

  it("redirects cards.generate with file_url to Google gemini-2.5-pro", async () => {
    mockGoogleGenerate.mockResolvedValueOnce(googleResponse());
    await invoke("cards.generate", {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "extract" },
            { type: "file_url", file_url: { url: "https://example.com/x.pdf", mime_type: "application/pdf" } },
          ],
        },
      ],
    });
    expect(mockGoogleGenerate).toHaveBeenCalledTimes(1);
    expect(mockGoogleGenerate.mock.calls[0][0].model).toBe("gemini-2.5-pro");
  });

  it("does NOT redirect plan.compose (no multimodal config) even if image_url present", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse());
    await invoke("plan.compose", {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "go" },
            { type: "image_url", image_url: { url: "https://example.com/x.jpg" } },
          ],
        },
      ],
    });
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
    expect(mockGoogleGenerate).not.toHaveBeenCalled();
  });

  it("registers all 7 jobs in JOB_CONFIG", () => {
    expect(Object.keys(JOB_CONFIG).sort()).toEqual(
      [
        "agent.deepStudy",
        "cards.generate",
        "osce.judge",
        "plan.compose",
        "report.weekly",
        "vault.qa",
        "video.script",
      ].sort(),
    );
  });
});

describe("modelRouter — error handling", () => {
  it("throws ModelRouterError for unknown job", async () => {
    await expect(
      // @ts-expect-error — testing runtime guard
      invoke("nonsense.job", { messages: [{ role: "user", content: "x" }] }),
    ).rejects.toBeInstanceOf(ModelRouterError);
  });

  it("wraps provider errors in ModelRouterError with job and model context", async () => {
    mockAnthropicCreate.mockRejectedValueOnce(new Error("provider exploded"));
    try {
      await invoke("vault.qa", { messages: [{ role: "user", content: "x" }] });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ModelRouterError);
      const message = (err as Error).message;
      expect(message).toContain("vault.qa");
      expect(message).toContain("anthropic");
      expect(message).toContain("claude-sonnet-4-6");
      expect(message).toContain("provider exploded");
    }
  });
});

describe("modelRouter — Helicone URL construction", () => {
  it("applies Helicone baseURL + Helicone-Auth header to Anthropic when HELICONE_API_KEY is set", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse());
    await invoke("plan.compose", { messages: [{ role: "user", content: "x" }] });
    expect(anthropicCtorOpts.length).toBe(1);
    const opts = anthropicCtorOpts[0] as { baseURL?: string; defaultHeaders?: Record<string, string> };
    expect(opts.baseURL).toBe("https://anthropic.helicone.ai");
    expect(opts.defaultHeaders?.["Helicone-Auth"]).toBe("Bearer test-helicone");
  });

  it("attaches Helicone-Property-Job header on each Anthropic call", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse());
    await invoke("osce.judge", { messages: [{ role: "user", content: "x" }] });
    const callOptions = mockAnthropicCreate.mock.calls[0][1] as { headers?: Record<string, string> };
    expect(callOptions.headers?.["Helicone-Property-Job"]).toBe("osce.judge");
  });

  it("applies Helicone gateway baseUrl + headers to Google when HELICONE_API_KEY is set", async () => {
    mockGoogleGenerate.mockResolvedValueOnce(googleResponse());
    await invoke("vault.qa", {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "x" },
            { type: "image_url", image_url: { url: "https://example.com/x.jpg" } },
          ],
        },
      ],
    });
    expect(googleCtorOpts.length).toBe(1);
    const opts = googleCtorOpts[0] as {
      httpOptions?: { baseUrl?: string; headers?: Record<string, string> };
    };
    expect(opts.httpOptions?.baseUrl).toBe("https://gateway.helicone.ai");
    expect(opts.httpOptions?.headers?.["Helicone-Auth"]).toBe("Bearer test-helicone");
    expect(opts.httpOptions?.headers?.["Helicone-Target-URL"]).toBe(
      "https://generativelanguage.googleapis.com",
    );
  });
});

describe("modelRouter — telemetry", () => {
  it("logs job name, provider, model, latency, and cost on every call", async () => {
    mockAnthropicCreate.mockResolvedValueOnce(anthropicResponse("hi", "claude-sonnet-4-6"));
    await invoke("plan.compose", { messages: [{ role: "user", content: "x" }] });
    // The fire-and-forget log is wrapped in `void` + `.catch` — give it a microtask to flush
    await Promise.resolve();
    expect(mockLogModelRouting).toHaveBeenCalledTimes(1);
    const entry = mockLogModelRouting.mock.calls[0][0];
    expect(entry.jobName).toBe("plan.compose");
    expect(entry.provider).toBe("anthropic");
    expect(entry.model).toBe("claude-sonnet-4-6");
    expect(entry.promptTokens).toBe(10);
    expect(entry.completionTokens).toBe(4);
    expect(typeof entry.latencyMs).toBe("number");
    expect(entry.latencyMs).toBeGreaterThanOrEqual(0);
    // cost = (240 * 10 + 1200 * 4) / 1_000_000 = 0.0072 pence
    expect(entry.costEstimatePence).toBe("0.0072");
  });

  it("logs an error_message and re-throws when the provider fails", async () => {
    mockAnthropicCreate.mockRejectedValueOnce(new Error("boom"));
    await expect(
      invoke("plan.compose", { messages: [{ role: "user", content: "x" }] }),
    ).rejects.toBeInstanceOf(ModelRouterError);
    await Promise.resolve();
    const entry = mockLogModelRouting.mock.calls[0][0];
    expect(entry.errorMessage).toBe("boom");
  });
});

describe("hasMultimodalContent helper", () => {
  it("returns false for plain string messages", () => {
    expect(hasMultimodalContent([{ role: "user", content: "hi" }])).toBe(false);
  });

  it("returns false for text-array messages", () => {
    expect(
      hasMultimodalContent([
        { role: "user", content: [{ type: "text", text: "hi" }] },
      ]),
    ).toBe(false);
  });

  it("returns true if any message contains image_url", () => {
    expect(
      hasMultimodalContent([
        { role: "system", content: "you are a doctor" },
        {
          role: "user",
          content: [
            { type: "text", text: "what is this?" },
            { type: "image_url", image_url: { url: "https://example.com/x.jpg" } },
          ],
        },
      ]),
    ).toBe(true);
  });

  it("returns true if any message contains file_url", () => {
    expect(
      hasMultimodalContent([
        {
          role: "user",
          content: [
            { type: "file_url", file_url: { url: "https://example.com/x.pdf" } },
          ],
        },
      ]),
    ).toBe(true);
  });
});
