---
description: Look up a specific topic in the DocVault master spec
argument-hint: <topic>  e.g.  pricing,  schema,  api-keys,  m4.2,  rubric-design
allowed-tools: Read, Grep, Glob, Bash(pandoc*)
---

# /spec — spec lookup

Surface specific information from the master build spec.

| Topic | Source doc | Section |
|---|---|---|
| stack, tech-stack | Master Build Spec | § 3 |
| cloudflare, topology | Master Build Spec | § 4 |
| api-keys, keys | Master Build Spec | § 5 |
| schema, tables | Master Build Spec | § 6 |
| m0…m8, M0.1… | Master Build Spec | § 7 |
| pricing, tiers | Master Build Spec | § 8 |
| revenue, forecast | Master Build Spec | § 9 |
| risks | Master Build Spec | § 10 |
| medical-strategy | DocVault_Medical_Strategy.docx | full |
| hybrid, three-layer | DocVault_Hybrid_Architecture.docx | full |
| exams, ukmla, mrcs, mrcp, etc. | DocVault_UK_Written_Exams_Blueprint.docx | relevant exam |
| adaptive, planner, fsrs, weekly-report, videos | DocVault_Adaptive_Engine_Video_Tutor.docx | relevant |
| osce, voice-osce, personas, rubric-design | DocVault_OSCE_Module.docx | relevant |
| analytics, dashboard, gdpr, dpia | DocVault_Performance_Insights.docx | relevant |

Use `pandoc docs/spec/DocVault_Master_Build_Spec.docx -t markdown` to extract text. Surface the relevant section with a short summary, exact spec text, and section reference. If the topic isn't found, tell Hassan — don't make it up.
