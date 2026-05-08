# Observability Stack — DocVault

## Overview

DocVault uses three observability services, all EU-hosted for GDPR compliance:

| Service | Purpose | EU Region | Key Env Var |
|---------|---------|-----------|-------------|
| **Helicone** | LLM proxy — cost, latency, per-job logging | EU gateway | `HELICONE_API_KEY` |
| **Sentry** | Error tracking, performance monitoring | EU (ingest.sentry.io) | `SENTRY_DSN` |
| **PostHog** | Product analytics, consent-gated events | eu.i.posthog.com | `POSTHOG_API_KEY` |

## Helicone

### How it works

All LLM SDK clients (Anthropic, OpenAI, Google) are configured to route through Helicone's proxy when `HELICONE_API_KEY` is set. This provides:

- Per-request cost tracking (input + output tokens × model pricing)
- Latency histograms per job name
- Request/response logging for debugging
- No code changes needed — it's a transparent proxy

### Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Helicone-Auth` | `Bearer ${HELICONE_API_KEY}` | Authentication |
| `Helicone-Property-Job` | e.g., `cards.generate` | Job-level grouping |
| `Helicone-Target-URL` | (Google only) | Route to correct upstream |

### Fallback

If `HELICONE_API_KEY` is not set, SDK clients connect directly to provider APIs. No functionality is lost — only observability.

## Sentry

### Configuration

```typescript
Sentry.init({
  dsn: ENV.sentryDsn,
  environment: "production" | "development",
  release: `docvault-server@${packageVersion}`,
  tracesSampleRate: 0.1, // 10% in prod
  profilesSampleRate: 0.05, // 5% in prod
});
```

### PII Scrubbing

Before any event is sent to Sentry:
- Email addresses → `[REDACTED_EMAIL]`
- UK phone numbers → `[REDACTED_PHONE]`
- NHS numbers (10-digit patterns) → `[REDACTED_NHS_NUMBER]`
- User IP addresses are stripped
- Query params (may contain tokens) are removed from HTTP breadcrumbs

### User Context

Set per-request via `setSentryUser(userId, email?)`. Cleared on logout via `clearSentryUser()`.

## PostHog

### Consent Model

PostHog events are **only sent when the user has explicitly opted in** (`hasConsent: true`). This is checked at the call site — the `trackEvent()` helper short-circuits if consent is false.

### Core Events (7)

| Event | When Fired | Key Properties |
|-------|-----------|----------------|
| `memory_saved` | User saves to vault | `memory_type`, `curriculum_tag`, `size_bytes` |
| `review_completed` | Flashcard session ends | `cards_reviewed`, `accuracy_pct`, `duration_seconds` |
| `plan_generated` | Daily plan created | `total_minutes`, `blocks_count`, `energy_level` |
| `osce_session_completed` | OSCE practice ends | `station_type`, `duration_seconds`, `overall_score` |
| `mock_started` | Mock exam begins | `mock_type`, `exam_target`, `question_count` |
| `report_viewed` | Weekly report opened | `report_type`, `week_number` |
| `auth_signed_in` | User signs in | `method`, `is_new_user` |

### What We Do NOT Track

Per Performance Insights spec:
- Tap heatmaps, scroll positions, button hover
- Audio recordings of OSCE sessions
- Free-text vault content
- Patient data of any form
- Cross-app browsing or device fingerprinting

### Usage

```typescript
import { trackEvent } from "../server/_core/observability";

trackEvent(userId, "memory_saved", {
  memory_type: "lecture_note",
  curriculum_tag: "cardiology.af",
  size_bytes: 1024,
}, user.analyticsConsent);
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HELICONE_API_KEY` | No | — | Helicone proxy auth |
| `SENTRY_DSN` | No | — | Sentry project DSN |
| `POSTHOG_API_KEY` | No | — | PostHog project key |

All three are optional — the server runs without them (with console warnings).

## Branch Protection

The CI workflow (`.github/workflows/ci.yml`) runs on every PR and requires:
1. `Lint & Type Check` — passes
2. `Unit & Integration Tests` — passes
3. `Eval Suite Gate` — passes (fixture loading + assertion engine)

Configure in GitHub → Settings → Branches → `main` → Require status checks.
