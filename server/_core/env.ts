import { z } from "zod";

const envSchema = z.object({
  VITE_APP_ID: z.string().default(""),
  JWT_SECRET: z.string().default(""),
  DATABASE_URL: z.string().default(""),
  OAUTH_SERVER_URL: z.string().default(""),
  OWNER_OPEN_ID: z.string().default(""),
  NODE_ENV: z.string().default("development"),

  // M0.1 — LLM providers (all optional in dev; warn-not-crash if missing)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_AI_KEY: z.string().optional(),
  HELICONE_API_KEY: z.string().optional(),

  // M0.1 — Observability
  SENTRY_DSN: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] Invalid environment configuration:", parsed.error.format());
  throw new Error("Invalid environment configuration");
}

const raw = parsed.data;

export const ENV = {
  appId: raw.VITE_APP_ID,
  cookieSecret: raw.JWT_SECRET,
  databaseUrl: raw.DATABASE_URL,
  oAuthServerUrl: raw.OAUTH_SERVER_URL,
  ownerOpenId: raw.OWNER_OPEN_ID,
  isProduction: raw.NODE_ENV === "production",

  anthropicApiKey: raw.ANTHROPIC_API_KEY,
  openaiApiKey: raw.OPENAI_API_KEY,
  googleAiKey: raw.GOOGLE_AI_KEY,
  heliconeApiKey: raw.HELICONE_API_KEY,

  sentryDsn: raw.SENTRY_DSN,
  posthogApiKey: raw.POSTHOG_API_KEY,
} as const;

const optionalKeys = [
  "anthropicApiKey",
  "openaiApiKey",
  "googleAiKey",
  "heliconeApiKey",
  "sentryDsn",
  "posthogApiKey",
] as const;

for (const key of optionalKeys) {
  if (!ENV[key]) {
    const level = ENV.isProduction ? "error" : "warn";
    console[level](`[env] ${key} is missing${ENV.isProduction ? "" : " (dev mode — non-fatal)"}`);
  }
}
