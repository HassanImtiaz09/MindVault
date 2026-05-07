# CLAUDE.md — DocVault project context

> Read this first. It's the persistent context for every Claude Code session on this repo. The full plan lives in `docs/spec/` (eight DocVault spec documents). This file is the operating manual.

## What we're building

**DocVault** — the AI study + coaching platform for UK doctors and medical students. Built by an NHS doctor, for doctors. Replaces the brand "MindVault" (the existing repo). It combines a curated UK exam-aligned content library (UKMLA, MRCS, MRCP, MRCGP, MRCEM, MRCOG, MRCPCH, MRCPsych, MRCPath, PSA, MSRA), a personal medical vault, an adaptive study-plan engine, a voice + video OSCE simulator, and a creator marketplace.

Audience: UK medical students, F1/F2 doctors, postgraduate trainees, UK and international medical graduates.

Web app + native iOS + native Android. Cloudflare-led backend.

> Note: the GitHub repo is still named `MindVault` (github.com/HassanImtiaz09/MindVault) for now. Product brand is DocVault. Repo rename is a deferred one-click change; do not assume the URL or origin name has changed.

## The locked tech stack — DO NOT DEVIATE

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

## Where to start each session

- Always read this file first.
- Look in `docs/build/M{N}_prompts.md` for the milestone-specific prompt.
- Use `/spec <topic>` to look up specific sections of the master spec.
- Use `/milestone <id>` to load context for a specific milestone.
- Use `/review-pr` before asking for merge.
- Subagent `code-reviewer` available for non-trivial PRs (Hassan triggers).
