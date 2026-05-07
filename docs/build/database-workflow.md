# Database Workflow

## Overview

DocVault uses **TiDB Cloud Serverless** (AWS eu-central-1) during the build phase, with **Drizzle ORM** as the schema management and query layer. All schema changes go through `drizzle-kit` — no raw SQL in application code.

## Schema Change Workflow

1. **Define schema** in `drizzle/schema/` (one file per table, TypeScript).
2. **Generate migration** SQL:
   ```bash
   pnpm exec drizzle-kit generate
   ```
3. **Review** the generated `.sql` file in `drizzle/`.
4. **Apply** to TiDB:
   ```bash
   pnpm db:push
   ```
   This runs `drizzle-kit generate && drizzle-kit migrate` in sequence.

## TiDB Cloud Serverless — Build Phase

TiDB Cloud Serverless allows **direct DDL** on the cluster. There is no deploy-request workflow during the build phase. This means:

- `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX` execute immediately.
- No branch-based schema review is required (unlike PlanetScale).
- Migrations are applied directly via the public endpoint.

## Pre-Launch: Migration to PlanetScale

Before launch, the database will migrate from TiDB Cloud Serverless to PlanetScale. At that point:

1. Switch to PlanetScale's **deploy-request workflow** (schema changes require a deploy request and review before merging to production).
2. Update `drizzle.config.ts` connection settings.
3. Replace `DATABASE_URL` in GitHub Actions secrets.
4. Document the full migration steps in a dedicated runbook.

## Secrets Management

| Secret | Location | Rotation |
|--------|----------|----------|
| `DATABASE_URL` | GitHub Actions secrets | Monthly |
| `DATABASE_URL` | Sandbox env (dev only) | As needed |

**Rotation procedure:**
1. Generate a new root password in the TiDB Cloud console (Cluster → Connect → Reset Password).
2. Update the connection string.
3. Apply to GitHub Actions:
   ```bash
   gh secret set DATABASE_URL --body "mysql://USER:NEW_PASSWORD@HOST:4000/docvault?ssl={...}"
   ```
4. Verify CI passes with the new credentials.

## Important Notes

- `DATABASE_URL` must **never** be committed to any file in the repository.
- All database queries in application code use Drizzle ORM — no raw SQL strings.
- TiDB does not enforce foreign key constraints at the SQL level; FK relationships are defined logically in the schema for documentation purposes only.
- The `events` and `audit_log` tables use `bigint` primary keys for high-volume append-only workloads.
