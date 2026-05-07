import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import { ENV } from "./env";
import { logModelRouting } from "../db";

// ─── Public types (OpenAI-compatible shape preserved for migration ergonomics) ──

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = { type: "text"; text: string };
export type ImageContent = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type FileContent = {
  type: "file_url";
  file_url: { url: string; mime_type?: string };
};
export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: { name: string; schema: Record<string, unknown>; strict?: boolean };
    };

export type InvokeParams = {
  messages: Message[];
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  maxTokens?: number;
  max_tokens?: number;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
    };
    finish_reason: string | null;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
};

// ─── Job table ───────────────────────────────────────────────────────────────

export type JobName =
  | "cards.generate"
  | "plan.compose"
  | "report.weekly"
  | "agent.deepStudy"
  | "osce.judge"
  | "video.script"
  | "vault.qa";

export type Provider = "anthropic" | "openai" | "google";

export type JobConfig = {
  provider: Provider;
  model: string;
  multimodalModel?: { provider: Provider; model: string };
  maxTokens: number;
};

export const JOB_CONFIG: Record<JobName, JobConfig> = {
  "cards.generate": {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    multimodalModel: { provider: "google", model: "gemini-2.5-pro" },
    maxTokens: 4096,
  },
  "plan.compose": {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
  },
  "report.weekly": {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
  },
  "agent.deepStudy": {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
  },
  "osce.judge": {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
  },
  "video.script": {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    maxTokens: 8192,
  },
  "vault.qa": {
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    multimodalModel: { provider: "google", model: "gemini-2.5-pro" },
    maxTokens: 8192,
  },
};

// Pricing in pence per 1M tokens (UK list, 2026-05-07). Used for cost telemetry only.
const PRICING_PENCE_PER_1M: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 80, output: 400 },
  "claude-sonnet-4-6": { input: 240, output: 1200 },
  "claude-opus-4-6": { input: 1200, output: 6000 },
  "gemini-2.5-pro": { input: 100, output: 400 },
  "gpt-4o": { input: 200, output: 800 },
};

function estimateCostPence(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const price = PRICING_PENCE_PER_1M[model];
  if (!price) return 0;
  return (price.input * promptTokens + price.output * completionTokens) / 1_000_000;
}

// ─── Helicone-proxied SDK clients (lazy, cached) ─────────────────────────────

const HELICONE_BASE_ANTHROPIC = "https://anthropic.helicone.ai";
const HELICONE_BASE_OPENAI = "https://oai.helicone.ai/v1";
const HELICONE_BASE_GEMINI = "https://gateway.helicone.ai";

let _anthropic: Anthropic | undefined;
let _openai: OpenAI | undefined;
let _google: GoogleGenAI | undefined;

function getAnthropic(): Anthropic {
  if (!_anthropic) {
    if (!ENV.anthropicApiKey) throw new ModelRouterError("ANTHROPIC_API_KEY is not configured");
    _anthropic = new Anthropic({
      apiKey: ENV.anthropicApiKey,
      baseURL: ENV.heliconeApiKey ? HELICONE_BASE_ANTHROPIC : undefined,
      defaultHeaders: ENV.heliconeApiKey
        ? { "Helicone-Auth": `Bearer ${ENV.heliconeApiKey}` }
        : undefined,
    });
  }
  return _anthropic;
}

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!ENV.openaiApiKey) throw new ModelRouterError("OPENAI_API_KEY is not configured");
    _openai = new OpenAI({
      apiKey: ENV.openaiApiKey,
      baseURL: ENV.heliconeApiKey ? HELICONE_BASE_OPENAI : undefined,
      defaultHeaders: ENV.heliconeApiKey
        ? { "Helicone-Auth": `Bearer ${ENV.heliconeApiKey}` }
        : undefined,
    });
  }
  return _openai;
}

function getGoogle(): GoogleGenAI {
  if (!_google) {
    if (!ENV.googleAiKey) throw new ModelRouterError("GOOGLE_AI_KEY is not configured");
    _google = new GoogleGenAI({
      apiKey: ENV.googleAiKey,
      httpOptions: ENV.heliconeApiKey
        ? {
            baseUrl: HELICONE_BASE_GEMINI,
            headers: {
              "Helicone-Auth": `Bearer ${ENV.heliconeApiKey}`,
              "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
            },
          }
        : undefined,
    });
  }
  return _google;
}

// ─── Provider adapters ───────────────────────────────────────────────────────

function flattenText(content: MessageContent | MessageContent[]): string {
  const parts = Array.isArray(content) ? content : [content];
  return parts
    .map((p) => (typeof p === "string" ? p : p.type === "text" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
}

function anthropicContent(
  content: MessageContent | MessageContent[],
): string | Anthropic.ContentBlockParam[] {
  const parts = Array.isArray(content) ? content : [content];
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  if (parts.length === 1 && typeof parts[0] !== "string" && parts[0].type === "text") {
    return parts[0].text;
  }
  const blocks: Anthropic.ContentBlockParam[] = [];
  for (const p of parts) {
    if (typeof p === "string") {
      blocks.push({ type: "text", text: p });
    } else if (p.type === "text") {
      blocks.push({ type: "text", text: p.text });
    } else if (p.type === "image_url") {
      blocks.push({
        type: "image",
        source: { type: "url", url: p.image_url.url },
      } as Anthropic.ImageBlockParam);
    }
    // file_url blocks are routed to Gemini, not Anthropic
  }
  return blocks;
}

async function invokeAnthropic(
  model: string,
  params: InvokeParams,
  defaultMaxTokens: number,
  jobName: JobName,
): Promise<InvokeResult> {
  const client = getAnthropic();
  const systemParts: string[] = [];
  const messages: Anthropic.MessageParam[] = [];
  for (const m of params.messages) {
    if (m.role === "system") {
      systemParts.push(flattenText(m.content));
      continue;
    }
    if (m.role === "tool" || m.role === "function") {
      messages.push({ role: "user", content: flattenText(m.content) });
      continue;
    }
    messages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: anthropicContent(m.content),
    });
  }
  const response = await client.messages.create(
    {
      model,
      max_tokens: params.maxTokens ?? params.max_tokens ?? defaultMaxTokens,
      system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
      messages,
    },
    {
      headers: { "Helicone-Property-Job": jobName },
    },
  );
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  const text = textBlocks.map((b) => b.text).join("");
  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: response.stop_reason,
      },
    ],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

function openaiContent(
  content: MessageContent | MessageContent[],
): string | OpenAI.Chat.ChatCompletionContentPart[] {
  if (typeof content === "string") return content;
  const parts = Array.isArray(content) ? content : [content];
  const isTextOnly = (p: MessageContent): p is string | TextContent =>
    typeof p === "string" || p.type === "text";
  if (parts.every(isTextOnly)) {
    return parts.map((p) => (typeof p === "string" ? p : p.text)).join("\n");
  }
  const out: OpenAI.Chat.ChatCompletionContentPart[] = [];
  for (const p of parts) {
    if (typeof p === "string") out.push({ type: "text", text: p });
    else if (p.type === "text") out.push({ type: "text", text: p.text });
    else if (p.type === "image_url") out.push({ type: "image_url", image_url: p.image_url });
    // file_url routed to Gemini, not OpenAI
  }
  return out;
}

async function invokeOpenAI(
  model: string,
  params: InvokeParams,
  defaultMaxTokens: number,
  jobName: JobName,
): Promise<InvokeResult> {
  const client = getOpenAI();
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = params.messages.map((m) => {
    if (m.role === "system") {
      return { role: "system", content: flattenText(m.content) };
    }
    if (m.role === "assistant") {
      return { role: "assistant", content: flattenText(m.content) };
    }
    if (m.role === "tool" || m.role === "function") {
      return { role: "user", content: flattenText(m.content) };
    }
    return { role: "user", content: openaiContent(m.content) };
  });
  const response = await client.chat.completions.create(
    {
      model,
      max_tokens: params.maxTokens ?? params.max_tokens ?? defaultMaxTokens,
      messages,
      response_format: params.responseFormat ?? params.response_format,
    },
    {
      headers: { "Helicone-Property-Job": jobName },
    },
  );
  return {
    id: response.id,
    created: response.created,
    model: response.model,
    choices: response.choices.map((c) => ({
      index: c.index,
      message: { role: "assistant", content: c.message.content ?? "" },
      finish_reason: c.finish_reason,
    })),
    usage: response.usage
      ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

function googleParts(content: MessageContent | MessageContent[]): unknown[] {
  const parts = Array.isArray(content) ? content : [content];
  return parts.map((p) => {
    if (typeof p === "string") return { text: p };
    if (p.type === "text") return { text: p.text };
    if (p.type === "image_url") {
      return { fileData: { fileUri: p.image_url.url, mimeType: "image/jpeg" } };
    }
    if (p.type === "file_url") {
      return {
        fileData: {
          fileUri: p.file_url.url,
          mimeType: p.file_url.mime_type ?? "application/octet-stream",
        },
      };
    }
    return { text: "" };
  });
}

async function invokeGoogle(
  model: string,
  params: InvokeParams,
  defaultMaxTokens: number,
  _jobName: JobName,
): Promise<InvokeResult> {
  const client = getGoogle();
  const systemParts: string[] = [];
  const contents: Array<{ role: "user" | "model"; parts: unknown[] }> = [];
  for (const m of params.messages) {
    if (m.role === "system") {
      systemParts.push(flattenText(m.content));
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: googleParts(m.content),
    });
  }
  const wantsJson =
    (params.responseFormat ?? params.response_format)?.type === "json_object";
  const response = await client.models.generateContent({
    model,
    contents: contents as never,
    config: {
      maxOutputTokens: params.maxTokens ?? params.max_tokens ?? defaultMaxTokens,
      systemInstruction: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
      responseMimeType: wantsJson ? "application/json" : undefined,
    },
  });
  const text = response.text ?? "";
  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: response.candidates?.[0]?.finishReason ?? null,
      },
    ],
    usage: response.usageMetadata
      ? {
          prompt_tokens: response.usageMetadata.promptTokenCount ?? 0,
          completion_tokens: response.usageMetadata.candidatesTokenCount ?? 0,
          total_tokens: response.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined,
  };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export function hasMultimodalContent(messages: Message[]): boolean {
  for (const m of messages) {
    const parts = Array.isArray(m.content) ? m.content : [m.content];
    for (const p of parts) {
      if (typeof p === "object" && (p.type === "image_url" || p.type === "file_url")) {
        return true;
      }
    }
  }
  return false;
}

export class ModelRouterError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ModelRouterError";
  }
}

export async function invoke(
  jobName: JobName,
  params: InvokeParams,
): Promise<InvokeResult> {
  const cfg = JOB_CONFIG[jobName];
  if (!cfg) throw new ModelRouterError(`Unknown job: ${jobName}`);

  const isMultimodal = hasMultimodalContent(params.messages);
  const target =
    isMultimodal && cfg.multimodalModel
      ? cfg.multimodalModel
      : { provider: cfg.provider, model: cfg.model };

  const start = Date.now();
  let result: InvokeResult | undefined;
  let errorMessage: string | undefined;
  try {
    if (target.provider === "anthropic") {
      result = await invokeAnthropic(target.model, params, cfg.maxTokens, jobName);
    } else if (target.provider === "openai") {
      result = await invokeOpenAI(target.model, params, cfg.maxTokens, jobName);
    } else if (target.provider === "google") {
      result = await invokeGoogle(target.model, params, cfg.maxTokens, jobName);
    } else {
      throw new ModelRouterError(`Unsupported provider: ${target.provider satisfies never}`);
    }
    return result;
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    if (err instanceof ModelRouterError) throw err;
    throw new ModelRouterError(
      `[${jobName}] ${target.provider}/${target.model} failed: ${errorMessage}`,
      { cause: err },
    );
  } finally {
    const latencyMs = Date.now() - start;
    const promptTokens = result?.usage?.prompt_tokens ?? 0;
    const completionTokens = result?.usage?.completion_tokens ?? 0;
    const cost = estimateCostPence(target.model, promptTokens, completionTokens);
    void logModelRouting({
      jobName,
      provider: target.provider,
      model: target.model,
      promptTokens,
      completionTokens,
      latencyMs,
      costEstimatePence: cost.toFixed(4),
      errorMessage,
    }).catch((logErr) => {
      console.warn("[model_router] Failed to log routing entry:", logErr);
    });
  }
}

export const modelRouter = {
  invoke,
  jobs: JOB_CONFIG,
};

// Test-only hook: clear the cached SDK clients so tests can re-mock between runs.
export function __resetClientsForTests(): void {
  _anthropic = undefined;
  _openai = undefined;
  _google = undefined;
}
