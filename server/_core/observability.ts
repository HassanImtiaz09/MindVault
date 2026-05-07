import * as Sentry from "@sentry/node";
import { PostHog } from "posthog-node";
import { ENV } from "./env";

let sentryInitialized = false;
let posthogInstance: PostHog | undefined;

export function initObservability(): void {
  if (ENV.sentryDsn && !sentryInitialized) {
    Sentry.init({
      dsn: ENV.sentryDsn,
      environment: ENV.isProduction ? "production" : "development",
      tracesSampleRate: ENV.isProduction ? 0.1 : 1.0,
    });
    sentryInitialized = true;
    console.log("[observability] Sentry initialised");
  } else if (!ENV.sentryDsn) {
    console.warn("[observability] SENTRY_DSN missing — Sentry disabled");
  }

  if (ENV.posthogApiKey && !posthogInstance) {
    posthogInstance = new PostHog(ENV.posthogApiKey, {
      host: "https://eu.i.posthog.com",
    });
    console.log("[observability] Posthog initialised (EU host)");
  } else if (!ENV.posthogApiKey) {
    console.warn("[observability] POSTHOG_API_KEY missing — Posthog disabled");
  }
}

export function getPosthog(): PostHog | undefined {
  return posthogInstance;
}

export { Sentry };
