---
description: Load context for a specific milestone and produce a session plan
argument-hint: <milestone_id>  e.g.  M0.1  or  M2  or  M4.3
allowed-tools: Read, Grep, Glob
---

# /milestone — milestone context loader

Load the context needed to start work on milestone $1.

1. Parse `$1` (e.g., M0.1, M2, M4.3) — top-level milestone + sub-milestone.
2. Read CLAUDE.md.
3. Read `docs/build/M{N}_prompts.md` if exists.
4. Extract the relevant section from `docs/spec/DocVault_Master_Build_Spec.docx`.
5. Identify dependencies (previous milestones, schema migrations, API keys, human-only blockers).
6. Produce a session plan with: goal, pre-requisites, files to touch, schema migrations, API endpoints, UI surfaces, tests, acceptance criteria, estimated token budget, risks.
7. **Pause for confirmation** before starting work.
8. If Hassan says "go," open feature branch `feat/$1-<short-slug>` and begin.
