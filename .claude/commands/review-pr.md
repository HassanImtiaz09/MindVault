---
description: Run a structured pre-merge review of the current PR against the master spec
allowed-tools: Bash(git diff*), Bash(git log*), Bash(gh pr view*), Bash(pnpm test*), Bash(pnpm lint*), Read, Grep, Glob
---

# /review-pr — pre-merge structured review

Use this before asking Hassan to merge any PR.

## Steps

1. Run `git status` and `git diff --stat origin/main...HEAD`. Identify the sub-milestone the PR claims to implement.
2. Read CLAUDE.md and the relevant spec section. For each acceptance criterion, mark Met / Partial / Missing.
3. Anti-goals audit: stack drift, scope creep, paraphrased commercial content (search for "Pastest", "Quesmed", "AMBOSS"), patient identifiers, observability wiring, hardcoded config, eval suite green, secrets in diff, new dependencies justified.
4. Code-quality pass: type safety, Drizzle usage, Zod validation, error handling, ModelRouter routing, Helicone proxy, test coverage.
5. Run `pnpm test`, `pnpm lint`, `pnpm check`, and (if exists) `pnpm test:eval`.
6. Produce a structured review report with verdict (Ready to merge / Changes requested / Spec ambiguity — escalate) and specific actionable next steps.
7. If changes are requested, address them in the same PR; re-run /review-pr.
8. Hand off: tell Hassan "PR ready for senior review. Bring it to your Cowork session for architectural sanity check, then merge."
