/**
 * DocVault Eval Suite — Vitest Integration
 *
 * Runs all 30 eval fixtures against the model router.
 * Requires API keys (ANTHROPIC_API_KEY, GOOGLE_AI_KEY) to be set.
 * Skips gracefully if keys are missing (CI without secrets).
 *
 * Gate: PR fails if any fixture regresses (must_contain / must_not_contain / structure).
 */
import { describe, it, expect } from "vitest";
import { loadAllFixtures } from "./runner/loader";
import { runAssertions } from "./runner/assertions";
import type { EvalFixture } from "./runner/types";

// ─── Fixture loading tests (always run, no API keys needed) ──────────────────

describe("Eval Suite — Fixture Loading", () => {
  const fixtures = loadAllFixtures();

  it("loads exactly 30 fixtures", () => {
    expect(fixtures.length).toBe(30);
  });

  it("all fixtures have required fields", () => {
    for (const f of fixtures) {
      expect(f.id).toBeTruthy();
      expect(f.job).toBeTruthy();
      expect(f.input).toBeTruthy();
      expect(f.input.messages).toBeTruthy();
      expect(f.input.messages.length).toBeGreaterThan(0);
      expect(Array.isArray(f.expected_must_contain)).toBe(true);
      expect(Array.isArray(f.expected_must_not_contain)).toBe(true);
    }
  });

  it("all fixture IDs are unique", () => {
    const ids = fixtures.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all fixtures reference valid job names", () => {
    const validJobs = [
      "cards.generate",
      "plan.compose",
      "report.weekly",
      "agent.deepStudy",
      "osce.judge",
      "video.script",
      "vault.qa",
    ];
    for (const f of fixtures) {
      expect(validJobs).toContain(f.job);
    }
  });

  it("covers at least 4 distinct job types", () => {
    const jobs = new Set(fixtures.map((f) => f.job));
    expect(jobs.size).toBeGreaterThanOrEqual(4);
  });
});

// ─── Assertion engine unit tests (no API keys needed) ────────────────────────

describe("Eval Suite — Assertion Engine", () => {
  const mockFixture: EvalFixture = {
    id: "test-fixture",
    job: "cards.generate",
    input: { messages: [{ role: "user", content: "test" }] },
    expected_must_contain: ['"correct"', '"options"'],
    expected_must_not_contain: ["Pastest", "AMBOSS"],
    expected_structure: {
      type: "object",
      required: ["correct", "options"],
      properties: {
        correct: { type: "string", enum: ["A", "B", "C", "D", "E"] },
        options: { type: "object", required: ["A", "B", "C", "D", "E"] },
      },
    },
    notes: "test",
  };

  it("passes when output meets all criteria", () => {
    const output = JSON.stringify({
      correct: "A",
      options: { A: "opt1", B: "opt2", C: "opt3", D: "opt4", E: "opt5" },
    });
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails on missing must_contain", () => {
    const output = JSON.stringify({ answer: "A" });
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("MUST_CONTAIN"))).toBe(true);
  });

  it("fails on must_not_contain violation", () => {
    const output = JSON.stringify({
      correct: "A",
      options: { A: "Pastest question", B: "opt2", C: "opt3", D: "opt4", E: "opt5" },
    });
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("MUST_NOT_CONTAIN"))).toBe(true);
  });

  it("fails on invalid JSON when structure is expected", () => {
    const output = "This is not JSON at all";
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("STRUCTURE"))).toBe(true);
  });

  it("fails on missing required fields", () => {
    const output = JSON.stringify({ correct: "A" }); // missing options
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes('missing required field "options"'))).toBe(true);
  });

  it("fails on invalid enum value", () => {
    const output = JSON.stringify({
      correct: "F", // invalid
      options: { A: "opt1", B: "opt2", C: "opt3", D: "opt4", E: "opt5" },
    });
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("not in enum"))).toBe(true);
  });

  it("handles JSON wrapped in markdown code blocks", () => {
    const output = '```json\n{"correct": "B", "options": {"A": "1", "B": "2", "C": "3", "D": "4", "E": "5"}}\n```';
    const result = runAssertions(mockFixture, output);
    expect(result.passed).toBe(true);
  });

  it("passes when expected_structure is null", () => {
    const noStructureFixture: EvalFixture = {
      ...mockFixture,
      expected_structure: null,
      expected_must_contain: ["hello"],
      expected_must_not_contain: ["goodbye"],
    };
    const result = runAssertions(noStructureFixture, "hello world");
    expect(result.passed).toBe(true);
  });
});

// ─── Live eval tests (skipped if API keys missing) ───────────────────────────

const hasApiKeys = !!(process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_AI_KEY);

describe.skipIf(!hasApiKeys)("Eval Suite — Live Model Invocation", () => {
  it(
    "live evals — full fixture suite",
    async () => {
      const { runFixture } = await import("./runner/run");
      const fixtures = loadAllFixtures();

      // Run in parallel batches of 5 for ~3 min total
      const BATCH_SIZE = 5;
      const results: Array<import("./runner/types").EvalResult> = [];

      for (let i = 0; i < fixtures.length; i += BATCH_SIZE) {
        const batch = fixtures.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map((f) => runFixture(f)));
        results.push(...batchResults);
      }

      // Report failures before asserting
      const failed = results.filter((r) => !r.passed);
      if (failed.length > 0) {
        console.error(
          `\n❌ ${failed.length}/${results.length} fixtures FAILED:\n` +
            failed
              .map(
                (r) =>
                  `  • ${r.fixtureId} (${r.job}, ${r.duration_ms}ms)\n` +
                  r.failures.map((f) => `      → ${f}`).join("\n"),
              )
              .join("\n"),
        );
      }

      // Gate: every fixture must pass
      expect(failed).toHaveLength(0);
    },
    { timeout: 5 * 60 * 1000 }, // 5 minutes
  );
});
