# Storage & Background Jobs — M0.3

## Overview

M0.3 introduces three infrastructure pillars:

| Service | Purpose | Status |
|---------|---------|--------|
| **Cloudflare R2** | S3-compatible object storage for user files | Live (EU jurisdiction) |
| **Cloudflare Stream** | Video transcoding & adaptive playback | Scaffolded |
| **Inngest** | Durable background job execution | Live (hello-world verified) |

---

## Cloudflare R2

### Architecture

```
Mobile App → tRPC memory.create → server/storage.ts → R2 (docvault-vault)
                                                    ↘ presigned URLs for direct upload
```

### Buckets

| Bucket | Jurisdiction | Purpose |
|--------|-------------|---------|
| `docvault-vault` | EU (Frankfurt) | Primary user file storage |
| `docvault-cache` | Automatic | Edge-cache Worker scratch space |

### S3-Compatible Endpoint

```
https://<ACCOUNT_ID>.eu.r2.cloudflarestorage.com
```

> **Note:** EU-jurisdicted buckets require the `.eu.` subdomain segment. The
> `R2_JURISDICTION` env var controls this (default: `"eu"`).

### Key Functions (`server/storage.ts`)

| Function | Description |
|----------|-------------|
| `storagePut(key, body, contentType)` | Upload object to vault bucket |
| `storageGet(key)` | Download object as Buffer |
| `storageExists(key)` | Check if object exists (HEAD) |
| `storageDelete(key)` | Remove object |
| `storagePresignGet(key, expiresIn?)` | Generate presigned GET URL (default 1h) |
| `storagePresignPut(key, contentType, expiresIn?)` | Generate presigned PUT URL (default 1h) |

All functions return `Result<T>` — either `{ ok: true, data: T }` or
`{ ok: false, error: string }`. When R2 credentials are not configured, they
return `{ ok: false, error: "STORAGE_NOT_CONFIGURED" }` (graceful degradation).

### Environment Variables

```bash
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<s3-access-key>
R2_SECRET_ACCESS_KEY=<s3-secret-key>
R2_BUCKET_VAULT=docvault-vault      # default
R2_BUCKET_CACHE=docvault-cache      # default
R2_JURISDICTION=eu                   # default; set to "" for non-EU
```

---

## Cloudflare Stream

### Architecture

```
Mobile App → tRPC → server/_core/stream.ts → Cloudflare Stream API
                                            → customer subdomain playback URLs
```

### Key Functions (`server/_core/stream.ts`)

| Function | Description |
|----------|-------------|
| `getPlaybackUrl(videoId)` | HLS manifest URL via customer subdomain |
| `getThumbnailUrl(videoId, opts?)` | Thumbnail URL with optional time/fit/dimensions |
| `createDirectUpload(maxDuration?, meta?)` | Get a direct-creator upload URL |

### Environment Variables

```bash
CF_STREAM_API_TOKEN=<api-token-with-stream-read-write>
CF_STREAM_ACCOUNT_ID=<account-id>        # falls back to R2_ACCOUNT_ID
CF_STREAM_CUSTOMER_SUBDOMAIN=<subdomain> # e.g. customer-abc123.cloudflarestream.com
```

---

## Inngest (Background Jobs)

### Architecture

```
tRPC system.triggerHello → inngest.send("docvault/hello")
                                    ↓
Inngest Cloud → POST /api/inngest → helloWorld function executes step
```

### Registered Functions

| Function ID | Event | Description |
|-------------|-------|-------------|
| `hello-world` | `docvault/hello` | Smoke-test function; logs greeting, returns message |

### Adding a New Function

1. Create the function in `server/_core/inngest.ts` or a new file:
   ```ts
   export const myJob = inngest.createFunction(
     { id: "my-job", triggers: [{ event: "docvault/my-event" }] },
     async ({ event, step }) => {
       // step.run(), step.sleep(), step.waitForEvent(), etc.
     },
   );
   ```
2. Add it to the `inngestFunctions` array.
3. The serve handler at `/api/inngest` auto-registers all functions.

### Environment Variables

```bash
INNGEST_EVENT_KEY=<event-key>
INNGEST_SIGNING_KEY=<signing-key>
```

### Local Development

For local dev without Inngest Cloud, set `INNGEST_DEV=1` and run the
[Inngest Dev Server](https://www.inngest.com/docs/local-development):

```bash
npx inngest-cli@latest dev
```

---

## Edge-Cache Worker

### Location

```
workers/edge-cache/
├── src/index.ts      ← Cloudflare Worker entry
├── wrangler.toml     ← Deployment config
├── package.json
└── tsconfig.json
```

### Purpose

Sits in front of R2 to serve public/shared assets with Cloudflare CDN caching.
Checks `docvault-cache` first, falls back to `docvault-vault`, and writes
through to cache on miss.

### Deployment

```bash
cd workers/edge-cache
pnpm install
npx wrangler deploy
```

> **Not yet deployed** — requires Cloudflare Workers plan and R2 bucket bindings
> to be configured in the Cloudflare dashboard.

---

## Testing

### R2 Tests (`tests/infra/r2.test.ts`)

- Live upload/download/exists/delete against real R2
- Presigned URL generation (format validation)
- Graceful degradation when credentials are missing

### Inngest Tests (`tests/infra/inngest.test.ts`)

- Client instantiation with correct ID
- Function registration and export
- Stream helper URL format validation
- Env configuration validation

### Running

```bash
# Requires R2 + Inngest env vars set
pnpm test
```

---

## Secrets Required for CI

Add these to GitHub Actions secrets:

| Secret | Source |
|--------|--------|
| `DATABASE_URL` | TiDB Cloud connection string |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret key |
| `INNGEST_EVENT_KEY` | Inngest dashboard → Keys |
| `INNGEST_SIGNING_KEY` | Inngest dashboard → Signing Key |
