/**
 * Eval runner — invokes the model router for each fixture and validates output.
 * Used by the Vitest integration to run evals as part of CI.
 */
import type { EvalFixture, EvalResult } from "./types";
import { runAssertions } from "./assertions";
import { invoke, type Message } from "../../../server/_core/model_router";

/**
 * Execute a single eval fixture against the model router.
 */
export async function runFixture(fixture: EvalFixture): Promise<EvalResult> {
  const start = Date.now();

  try {
    const messages: Message[] = fixture.input.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await invoke(fixture.job, {
      messages,
      responseFormat: fixture.expected_structure ? { type: "json_object" } : { type: "text" },
    });

    const output =
      typeof result.choices[0]?.message.content === "string"
        ? result.choices[0].message.content
        : JSON.stringify(result.choices[0]?.message.content);

    const assertions = runAssertions(fixture, output);
    const duration_ms = Date.now() - start;

    return {
      fixtureId: fixture.id,
      job: fixture.job,
      passed: assertions.passed,
      duration_ms,
      failures: assertions.failures,
      output: output.slice(0, 2000), // truncate for logging
    };
  } catch (err) {
    const duration_ms = Date.now() - start;
    return {
      fixtureId: fixture.id,
      job: fixture.job,
      passed: false,
      duration_ms,
      failures: [`RUNTIME_ERROR: ${err instanceof Error ? err.message : String(err)}`],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Execute all fixtures and return results.
 */
export async function runAllFixtures(fixtures: EvalFixture[]): Promise<EvalResult[]> {
  const results: EvalResult[] = [];
  for (const fixture of fixtures) {
    const result = await runFixture(fixture);
    results.push(result);
  }
  return results;
}
