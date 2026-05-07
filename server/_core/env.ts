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

  // M0.3 — Cloudflare R2 (S3-compatible object storage)
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_VAULT: z.string().default("docvault-vault"),
  R2_BUCKET_CACHE: z.string().default("docvault-cache"),
  R2_JURISDICTION: z.string().default("eu"),  // "eu" | "" (empty for default)

  // M0.3 — Cloudflare Stream
  CF_STREAM_API_TOKEN: z.string().optional(),
  CF_STREAM_ACCOUNT_ID: z.string().optional(),
  CF_STREAM_CUSTOMER_SUBDOMAIN: z.string().optional(),

  // M0.3 — Inngest (background jobs)
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
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

  // R2
  r2AccountId: raw.R2_ACCOUNT_ID,
  r2AccessKeyId: raw.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: raw.R2_SECRET_ACCESS_KEY,
  r2BucketVault: raw.R2_BUCKET_VAULT,
  r2BucketCache: raw.R2_BUCKET_CACHE,
  r2Jurisdiction: raw.R2_JURISDICTION,
  r2Endpoint: raw.R2_ACCOUNT_ID
    ? `https://${raw.R2_ACCOUNT_ID}${raw.R2_JURISDICTION ? `.${raw.R2_JURISDICTION}` : ""}.r2.cloudflarestorage.com`
    : undefined,

  // Stream
  cfStreamApiToken: raw.CF_STREAM_API_TOKEN,
  cfStreamAccountId: raw.CF_STREAM_ACCOUNT_ID ?? raw.R2_ACCOUNT_ID,
  cfStreamCustomerSubdomain: raw.CF_STREAM_CUSTOMER_SUBDOMAIN,

  // Inngest
  inngestEventKey: raw.INNGEST_EVENT_KEY,
  inngestSigningKey: raw.INNGEST_SIGNING_KEY,
} as const;

const optionalKeys = [
  "anthropicApiKey",
  "openaiApiKey",
  "googleAiKey",
  "heliconeApiKey",
  "sentryDsn",
  "posthogApiKey",
  "r2AccountId",
  "r2AccessKeyId",
  "r2SecretAccessKey",
  "cfStreamApiToken",
  "cfStreamCustomerSubdomain",
  "inngestEventKey",
  "inngestSigningKey",
] as const;

for (const key of optionalKeys) {
  if (!ENV[key]) {
    const level = ENV.isProduction ? "error" : "warn";
    console[level](`[env] ${key} is missing${ENV.isProduction ? "" : " (dev mode — non-fatal)"}`);
  }
}
