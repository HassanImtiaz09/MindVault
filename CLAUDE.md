# CLAUDE.md — DocVault project context

> Read this first. It's the persistent context for every Claude Code session on this repo. The full plan lives in `docs/spec/` (eight DocVault spec documents). This file is the operating manual.

## What we're building

**DocVault** — the AI study + coaching platform for UK doctors and medical students. Built by an NHS doctor, for doctors. Replaces the brand "MindVault" (the existing repo). It combines a curated UK exam-aligned content library (UKMLA, MRCS, MRCP, MRCGP, MRCEM, MRCOG, MRCPCH, MRCPsych, MRCPath, PSA, MSRA), a personal medical vault, an adaptive study-plan engine, a voice + video OSCE simulator, and a creator marketplace.

Audience: UK medical students, F1/F2 doctors, postgraduate trainees, UK and international medical graduates.

Web app + native iOS + native Android. Cloudflare-led backend.

> Note: the GitHub repo is still named `MindVault` (github.com/HassanImtiaz09/MindVault) for now. Product brand is DocVault. Repo rename is a deferred one-click change; do not assume the URL or origin name has changed.

## The locked tech stack — DO NOT DEVIATE

> Note: PlanetScale's Postgres beta was sunset; we use MySQL. Existing repo already uses mysql2 so M0.2 is just pointing at PlanetScale, not a Postgres migration.

- Marketing site: **Next.js 15 on Cloudflare Pages**
- Web app: **Expo Web (existing)**
- Native iOS / Android: **Expo SDK 54+**
- Backend API: **Express + tRPC v11 (existing)** on **Fly.io UK region**
- Database: **PlanetScale MySQL (UK region)** — the existing repo already uses MySQL (`mysql2` + `drizzle-orm/mysql-core`), so M0.2 is a connection-string switch, not a Postgres migration. We deliberately stay on MySQL because Turbopuffer covers vectors and MySQL 8 JSON is sufficient for our jsonb needs.
- Object storage: **Cloudflare R2 (EU)**
- Video CDN: **Cloudflare Stream**
- Edge cache: **Cloudflare Workers**
- Background jobs: **Inngest** (not BullMQ)
- Cache: **Upstash Redis (eu-west-1)**
- Vector search: **Turbopuffer (eu-west)**
- LLM observability: **Helicone Cloud** — proxy ALL LLM calls
- Errors: **Sentry (EU)**
- Product analytics: **Posthog Cloud EU**
- Auth (web): **Better-Auth on tRPC**
- Auth (native): existing OAuth callback + JWT cookies
- Email: **Resend (EU)**
- Push: Expo Push (existing)
- Payments + subscriptions: **Stripe (UK)**
- Marketplace payouts: **Stripe Connect Express**

LLM job routing:
- `cards.generate` → **Claude Haiku 4.5**
- `plan.compose`, `report.weekly`, `agent.deepStudy`, `osce.judge`, `video.script`, `vault.qa` → **Claude Sonnet 4.6**
- Hardest cases → **Claude Opus 4.6**
- Multimodal (images, video) → **Gemini 2.5 Pro**
- Voice real-time (tutor + OSCE) → **GPT-4o Realtime**
- TTS (Free) → **Kokoro** (self-hosted)
- TTS (Pro) → **ElevenLabs Turbo v2.5**
- Empathic voice analysis → **Hume AI EVI**
- Speech-to-text → **Whisper-Large-v3**
- Embeddings → **Voyage-3**
- Avatar (Free/Pro) → **Hedra + Wav2Lip**
- Avatar (Specialist) → **Tavus CVI**
- Video render pipeline → **Remotion + Manim + FFmpeg**

If you think a different choice is better, **stop and ask Hassan**. Don't silently swap.

## Anti-goals — DO NOT DO

1. Don't migrate the entire codebase to a new stack. Use the existing Expo + tRPC + Drizzle skeleton. Add, don't rewrite.
2. Don't add features outside the current sub-milestone scope.
3. Don't paraphrase commercial content (Pastest, Quesmed, Passmedicine, BMJ OnExamination, AMBOSS, UWorld, commercial OSCE schemes) even "as inspiration." Build from scratch on public sources only (NICE, BNF, GMC, Royal College curricula).
4. Don't store any patient-identifying string. Redaction on every save and every transcript.
5. Don't ship without observability. Helicone + Sentry + Posthog wired in M0.
6. Don't hardcode prices, tier limits, exam list, curriculum, or feature gates. Everything configurable.
7. Don't bypass tests or eval suite. Regressions block merge.
8. Don't store secrets in code or git history.
9. Don't expand the dependency tree casually.
10. Don't commit straight to `main`. Feature branch + PR always.

## Code conventions

- TypeScript strict; no `any`; prefer `unknown` and narrow.
- Zod schemas at I/O boundary; derive types via `z.infer`.
- Drizzle for all DB access; no raw SQL except in migrations.
- File layout:
  - `app/` — Expo Router screens (web + native)
  - `apps/marketing/` — Next.js marketing site (added in M0.4)
  - `server/` — Express + tRPC API
  - `server/_core/` — infra: llm router, observability, auth, env
  - `drizzle/schema/*.ts` — one file per logical area
  - `tests/` — Vitest tests
  - `tests/evals/` — eval suite
  - `docs/spec/` — master spec + companion docs
  - `docs/build/` — milestone prompts
  - `.claude/` — Claude Code configuration
- Naming: camelCase TS, PascalCase components/types, snake_case DB columns + event names, kebab-case routes.
- Branches: `feat/m0.1-model-router`, `fix/auth-cookie-domain`.
- Commits and PR titles: `feat(m0.1): refactor llm.ts into ModelRouter`.
- Squash merge only.

## Definition of Done (per sub-milestone)

A sub-milestone is "done" when ALL are true:
- All listed files added/modified per the spec
- All schema migrations applied + reverse-tested
- All listed API endpoints exposed via tRPC
- All listed UI surfaces deployed to staging
- Tests cover ≥ 80% of new code; existing suite green (`pnpm test`)
- Eval suite passes (no regression below baseline)
- Lint + typecheck pass (`pnpm lint`, `pnpm check`)
- Acceptance criteria from the spec verified
- PR description includes the checklist with each item ticked
- No new dependencies without justification
- No hardcoded secrets, config, or tier values

## How to interact with the project owner

- Owner: **Hassan Imtiaz, MD** — UK NHS doctor + founder. He reviews every PR.
- He brings PRs back to a senior reviewer (Cowork Claude) before merging.
- When you have a question, **ask before guessing**.
- When you encounter a blocker, **stop and surface it**. Don't invent a workaround.
- **Cite the spec** in PR descriptions.

## Environment variables (expected at runtime)

Don't ship code that reads from non-existent env vars. Add to `server/_core/env.ts` with Zod validation. Expected vars (M0):

```
DATABASE_URL
ANTHROPIC_API_KEY
OPENAI_API_KEY
GOOGLE_AI_KEY
ELEVENLABS_API_KEY
HUME_API_KEY
VOYAGE_API_KEY
HELICONE_API_KEY
SENTRY_DSN
POSTHOG_API_KEY
RESEND_API_KEY
BETTER_AUTH_SECRET
INNGEST_EVENT_KEY
INNGEST_SIGNING_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
TURBOPUFFER_API_KEY
CF_ACCOUNT_ID
CF_API_TOKEN
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_VAULT
R2_BUCKET_VIDEO
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PUBLISHABLE_KEY
```

## Decisions log

Architectural decisions made by Hassan that future sessions must honour. Each entry: decision, milestone it lands in, and date.

- **2026-05-07 — M0.1 LLM provider routing.** The existing `forge.manus.im` proxy is removed in M0.1. All Anthropic calls go via Anthropic SDK direct, then through Helicone. All OpenAI calls go via OpenAI SDK direct, then through Helicone. All Gemini calls go via Google AI SDK direct, then through Helicone. The Manus Forge dependency is fully removed in M0.1.
- **2026-05-07 — Storage and owner-push graceful stubs.** `server/storage.ts` (`storagePut`, `storageGet`) and `server/_core/notification.ts` (`notifyOwner`) are migrated to graceful no-op stubs in M0.1. They were riding on `forge.manus.im` for non-LLM features; rather than pull the M0.3 R2 migration forward, they return structured `{ ok: false, error: "STORAGE_NOT_CONFIGURED" | "NOTIFICATION_NOT_CONFIGURED", reason }` responses and log a warning. **Runtime impact:** file-upload memories will return `STORAGE_NOT_CONFIGURED` until M0.3 wires Cloudflare R2; owner push returns `NOTIFICATION_NOT_CONFIGURED` pending a later milestone (TBD; likely M5 or later). User-facing push (`expo-notifications`) is unaffected because it does not go through this helper.
- **2026-05-07 — Speech-to-text model.** STT uses `whisper-1` via OpenAI SDK (large-v2 internally), proxied through Helicone, in M0.1+. Nothing calls STT until M4 voice OSCE, so accuracy is not yet a constraint. If clinical-grade transcription accuracy becomes a blocker in M4, evaluate Groq Whisper, Replicate Whisper-Large-v3, or Deepgram Nova-2 as a swap. Until then, `whisper-1` is sufficient.
- **2026-05-08 — M0.4 Auth: Better-Auth over NextAuth.** We use Better-Auth (lightweight, tRPC-native) with magic-link flow via Resend, not NextAuth/Auth.js. Reasons: (1) Better-Auth integrates cleanly with our existing tRPC router without requiring a separate API route handler; (2) magic-link is passwordless — simpler UX for medical professionals; (3) no OAuth provider dependency for core auth (OAuth remains for social login later). Session tokens are JWTs signed with `BETTER_AUTH_SECRET`; native app receives JWT via cookie bridge in the verify response.
- **2026-05-08 — M0.4 Email: Resend over SendGrid/Postmark.** Resend chosen for transactional email (magic links, notifications). Reasons: (1) EU data processing; (2) modern DX with excellent TypeScript SDK; (3) generous free tier (100 emails/day); (4) simple domain verification. Domain: `docvault.uk` with SPF + DKIM records.
- **2026-05-08 — M0.4 Marketing site: Static Next.js 15 export.** The marketing site (`apps/marketing/`) uses Next.js 15 with `output: "export"` for Cloudflare Pages deployment. No SSR, no API routes in the marketing site — it's purely static HTML/CSS/JS. This keeps hosting costs at zero and gives global CDN distribution. The web app (Expo Web) remains separate at `app.docvault.uk`.
- **2026-05-08 — M0.4 Database: TiDB Cloud over PlanetScale.** PlanetScale free tier was sunset; we migrated to TiDB Cloud Serverless (MySQL-compatible, AWS eu-central-1). Connection via `gateway01.eu-central-1.prod.aws.tidbcloud.com:4000`. All Drizzle schemas and migrations work unchanged. 9 tables now including `better_auth_sessions` and `verification_tokens`.
- **2026-05-08 — M0.5 Eval suite: 30 YAML fixtures with assertion engine.** Eval suite lives in `tests/evals/` with 30 fixtures covering 5 job types (cards.generate ×15, vault.qa ×5, report.weekly ×3, plan.compose ×1, osce.judge ×1, MRCS ×5). Assertions check `must_contain`, `must_not_contain`, and JSON `structure`. Fixture loading + assertion engine run in CI without API keys; live model invocation runs on push to main with secrets. Gate: PR blocked if eval suite regresses.
- **2026-05-08 — M0.5 PostHog: consent-gated, 7 typed events.** PostHog EU host (`eu.i.posthog.com`). Events only fire when `hasConsent: true` — respects GDPR opt-in. 7 core events: `memory_saved`, `review_completed`, `plan_generated`, `osce_session_completed`, `mock_started`, `report_viewed`, `auth_signed_in`. We do NOT track: tap heatmaps, scroll positions, audio recordings, vault content, patient data, or device fingerprints (per Performance Insights spec).
- **2026-05-08 — M0.5 Sentry: release tagging + PII scrubbing.** Sentry release tagged as `docvault-server@{package.version}`. PII scrubbing strips emails, UK phone numbers, and NHS number patterns before sending to Sentry. User IP addresses are removed. Query params (may contain tokens) stripped from HTTP breadcrumbs.
- **2026-05-08 — M0.5 CI/CD: GitHub Actions with eval gate.** `.github/workflows/ci.yml` runs on every PR: lint, type-check, unit tests, eval fixture loading. Live evals run on push to main only (requires API key secrets). Branch protection requires all 3 jobs to pass before merge.

## Spec overrides

The following entries in `docs/spec/DocVault_Master_Build_Spec.docx` are superseded by CLAUDE.md and the Decisions log. Treat CLAUDE.md as authoritative when in conflict.

- 2026-05-07 — Database. § 6 references to "Postgres" and § 7 M0.2 "PlanetScale Postgres setup / replace mysql2 with postgres / Postgres migration verified" are erroneous. PlanetScale shut down their Postgres beta in 2024. We use **PlanetScale MySQL (UK region)**. M0.2 is consequently "point the existing mysql2 connection at PlanetScale UK and add the M0 schema tables", NOT a Postgres migration. Where the spec references Postgres-specific features (jsonb, vector ops), use MySQL 8 JSON type and Turbopuffer for vectors.
- 2026-05-07 — M0.1 job count. § 7 M0.1 acceptance lists 6 named jobs (cards.generate, plan.compose, report.weekly, agent.deepStudy, osce.judge, video.script). M0.1 ships **7** jobs — add `vault.qa` (Sonnet 4.6, RAG-grounded) for the existing `ai.query` tRPC procedure migration. The M0-level acceptance "6 named jobs to 5+ providers" therefore reads as "7 named jobs to 3 providers (Anthropic, OpenAI, Google)" in M0.1; ElevenLabs/Hume/Voyage adapters land when their first consuming jobs do (Voyage in M1, ElevenLabs in M3, Hume in M4).

## Where to start each session

- Always read this file first.
- Look in `docs/build/M{N}_prompts.md` for the milestone-specific prompt.
- Use `/spec <topic>` to look up specific sections of the master spec.
- Use `/milestone <id>` to load context for a specific milestone.
- Use `/review-pr` before asking for merge.
- Subagent `code-reviewer` available for non-trivial PRs (Hassan triggers).
