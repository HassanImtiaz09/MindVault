# Eval Suite — DocVault

## Overview

The eval suite validates that the model router produces correct, safe, and well-structured outputs for all DocVault AI jobs. It runs as part of CI on every PR and blocks merge if any fixture regresses.

## Architecture

```
tests/evals/
├── fixtures/          # 30 YAML fixture files
│   ├── ukmla-*.yaml  # UKMLA SBA generation (10 fixtures)
│   ├── psa-*.yaml    # PSA prescribing questions (5 fixtures)
│   ├── mrcs-*.yaml   # MRCS anatomy questions (5 fixtures)
│   ├── vault-qa-*.yaml # Vault Q&A retrieval (5 fixtures)
│   ├── tone-report-*.yaml # Weekly report tone (3 fixtures)
│   └── osce-judge-*.yaml  # OSCE rubric scoring (2 fixtures)
├── runner/
│   ├── types.ts       # TypeScript types for fixtures and results
│   ├── loader.ts      # YAML fixture loader
│   ├── assertions.ts  # Assertion engine (must_contain, must_not_contain, structure)
│   ├── run.ts         # Model router invocation wrapper
│   └── index.ts       # Barrel export
└── eval-suite.test.ts # Vitest integration (CI entry point)
```

## Fixture Format

Each fixture is a YAML file with the following schema:

```yaml
id: unique-fixture-id
job: cards.generate | plan.compose | report.weekly | osce.judge | vault.qa
input:
  messages:
    - role: system
      content: "System prompt..."
    - role: user
      content: "User prompt..."
  context:
    topic: cardiology
    exam: UKMLA
expected_must_contain:
  - "string that must appear in output"
expected_must_not_contain:
  - "string that must NOT appear (e.g., competitor names)"
expected_structure:
  type: object
  required: [field1, field2]
  properties:
    field1: { type: string }
    field2: { type: number }
notes: "Human-readable description of what this fixture tests."
```

## Assertion Types

| Type | Description | Failure message prefix |
|------|-------------|----------------------|
| `MUST_CONTAIN` | Output must include the exact substring | `MUST_CONTAIN:` |
| `MUST_NOT_CONTAIN` | Output must NOT include the substring | `MUST_NOT_CONTAIN:` |
| `STRUCTURE` | Output must be valid JSON matching schema | `STRUCTURE:` |
| `RUNTIME_ERROR` | Model invocation threw an exception | `RUNTIME_ERROR:` |

## CI Behaviour

### On every PR (no API keys needed):
- Loads all 30 fixtures and validates their YAML structure
- Runs assertion engine unit tests (mock data)
- Verifies fixture count, uniqueness, and job coverage

### On push to main (with secrets):
- Runs all 30 fixtures against the live model router
- Fails the build if any fixture regresses

## Adding New Fixtures

1. Create a new YAML file in `tests/evals/fixtures/`
2. Follow the naming convention: `{exam}-{topic}-{number}.yaml`
3. Ensure the `id` field is globally unique
4. Run `pnpm vitest run tests/evals/` to validate loading
5. If adding a live test, ensure the fixture passes locally before pushing

## Coverage by Job

| Job | Fixture Count | Coverage Focus |
|-----|--------------|----------------|
| `cards.generate` | 15 | SBA structure, guideline citation, no competitor content |
| `vault.qa` | 5 | Retrieval accuracy, hallucination refusal, entry attribution |
| `report.weekly` | 3 | Tone discipline, data accuracy, forbidden words |
| `plan.compose` | 1 | Energy-aware scheduling, weak-area prioritisation |
| `osce.judge` | 1 | Rubric structure, timestamped feedback |

## Branch Protection

The `evals` CI job must pass before merge. Configure in GitHub:
- Settings → Branches → Branch protection rules → `main`
- Require status checks: `Eval Suite Gate`, `Unit & Integration Tests`, `Lint & Type Check`
