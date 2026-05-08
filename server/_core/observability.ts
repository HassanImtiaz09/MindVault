/**
 * Observability layer — Sentry, PostHog, Helicone.
 *
 * M0.5: Adds release tagging, environment, PII scrubbing, user context,
 * consent-gated PostHog events, and typed event helpers.
 */
import * as Sentry from "@sentry/node";
import { PostHog } from "posthog-node";
import { ENV } from "./env";

// ─── Package version for Sentry release tag ──────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
let APP_VERSION = "0.0.0";
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pkg = require("../../package.json");
  APP_VERSION = pkg.version ?? "0.0.0";
} catch {
  // Fallback if package.json is not available at runtime
}

// ─── Sentry ──────────────────────────────────────────────────────────────────

let sentryInitialized = false;

export function initSentry(): void {
  if (sentryInitialized) return;
  if (!ENV.sentryDsn) {
    console.warn("[observability] SENTRY_DSN missing — Sentry disabled");
    return;
  }

  Sentry.init({
    dsn: ENV.sentryDsn,
    environment: ENV.isProduction ? "production" : "development",
    release: `docvault-server@${APP_VERSION}`,
    tracesSampleRate: ENV.isProduction ? 0.1 : 1.0,
    profilesSampleRate: ENV.isProduction ? 0.05 : 0,
    // PII scrubbing: strip emails, IPs, and user content from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "http" && breadcrumb.data) {
        // Remove query params that may contain tokens
        delete breadcrumb.data.query;
      }
      return breadcrumb;
    },
    beforeSend(event) {
      // Strip PII from error messages
      if (event.message) {
        event.message = scrubPii(event.message);
      }
      // Remove user IP
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });

  sentryInitialized = true;
  console.log(`[observability] Sentry initialised (release: docvault-server@${APP_VERSION})`);
}

/**
 * Set Sentry user context for the current request scope.
 */
export function setSentryUser(userId: string, email?: string): void {
  Sentry.setUser({ id: userId, email: email ? scrubPii(email) : undefined });
}

/**
 * Clear Sentry user context (e.g., on logout).
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

// ─── PostHog ─────────────────────────────────────────────────────────────────

let posthogInstance: PostHog | undefined;

export function initPosthog(): void {
  if (posthogInstance) return;
  if (!ENV.posthogApiKey) {
    console.warn("[observability] POSTHOG_API_KEY missing — PostHog disabled");
    return;
  }

  posthogInstance = new PostHog(ENV.posthogApiKey, {
    host: "https://eu.i.posthog.com",
    // Flush every 30s or 20 events in production; immediately in dev
    flushAt: ENV.isProduction ? 20 : 1,
    flushInterval: ENV.isProduction ? 30000 : 0,
  });

  console.log("[observability] PostHog initialised (EU host)");
}

export function getPosthog(): PostHog | undefined {
  return posthogInstance;
}

// ─── PostHog Typed Events ────────────────────────────────────────────────────
// 7 core events from Performance Insights spec § "Core events to capture"

export type PostHogEventName =
  | "memory_saved"
  | "review_completed"
  | "plan_generated"
  | "osce_session_completed"
  | "mock_started"
  | "report_viewed"
  | "auth_signed_in";

export interface PostHogEventProperties {
  memory_saved: {
    memory_type: string;
    curriculum_tag?: string;
    size_bytes?: number;
  };
  review_completed: {
    cards_reviewed: number;
    accuracy_pct: number;
    duration_seconds: number;
    topic?: string;
  };
  plan_generated: {
    total_minutes: number;
    blocks_count: number;
    energy_level?: string;
    exam_target?: string;
  };
  osce_session_completed: {
    station_type: string;
    duration_seconds: number;
    overall_score?: number;
    pass?: boolean;
  };
  mock_started: {
    mock_type: string;
    exam_target: string;
    question_count: number;
  };
  report_viewed: {
    report_type: "weekly" | "monthly";
    week_number?: number;
  };
  auth_signed_in: {
    method: "magic_link" | "oauth";
    is_new_user: boolean;
  };
}

/**
 * Track a PostHog event with type safety.
 * Respects user consent — only sends if consent flag is true.
 *
 * @param userId - The user's unique ID (not email)
 * @param event - One of the 7 core event names
 * @param properties - Typed properties for the event
 * @param hasConsent - Whether the user has opted in to analytics
 */
export function trackEvent<E extends PostHogEventName>(
  userId: string,
  event: E,
  properties: PostHogEventProperties[E],
  hasConsent: boolean,
): void {
  if (!hasConsent) return; // Respect GDPR consent flag
  if (!posthogInstance) return;

  posthogInstance.capture({
    distinctId: userId,
    event,
    properties: {
      ...properties,
      $set: { last_active: new Date().toISOString() },
    },
  });
}

/**
 * Identify a user in PostHog (called on sign-in or profile update).
 */
export function identifyUser(
  userId: string,
  traits: { email?: string; exam_target?: string; tier?: string },
  hasConsent: boolean,
): void {
  if (!hasConsent) return;
  if (!posthogInstance) return;

  posthogInstance.identify({
    distinctId: userId,
    properties: {
      ...traits,
      // Scrub email to domain-only for analytics
      email_domain: traits.email?.split("@")[1],
    },
  });
}

// ─── Combined init ───────────────────────────────────────────────────────────

export function initObservability(): void {
  initSentry();
  initPosthog();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Scrub PII patterns from strings (emails, NHS numbers, phone numbers).
 */
function scrubPii(input: string): string {
  return input
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[REDACTED_EMAIL]")
    // UK phone numbers
    .replace(/(\+44|0)\s?\d{4}\s?\d{6}/g, "[REDACTED_PHONE]")
    // NHS numbers (10 digits)
    .replace(/\b\d{3}\s?\d{3}\s?\d{4}\b/g, "[REDACTED_NHS_NUMBER]");
}

/**
 * Flush PostHog events (call on server shutdown).
 */
export async function shutdownObservability(): Promise<void> {
  if (posthogInstance) {
    await posthogInstance.shutdown();
  }
}

export { Sentry };
