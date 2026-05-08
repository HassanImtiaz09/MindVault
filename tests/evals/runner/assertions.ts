/**
 * Assertion logic for eval fixtures.
 * Validates model output against expected_must_contain, expected_must_not_contain,
 * and expected_structure constraints.
 */
import type { EvalFixture, ExpectedStructure } from "./types";

export interface AssertionResult {
  passed: boolean;
  failures: string[];
}

/**
 * Run all assertions for a fixture against the model output.
 */
export function runAssertions(fixture: EvalFixture, output: string): AssertionResult {
  const failures: string[] = [];

  // 1. must_contain checks
  for (const expected of fixture.expected_must_contain) {
    if (!output.includes(expected)) {
      failures.push(`MUST_CONTAIN: expected output to contain "${expected}"`);
    }
  }

  // 2. must_not_contain checks
  for (const forbidden of fixture.expected_must_not_contain) {
    if (output.includes(forbidden)) {
      failures.push(`MUST_NOT_CONTAIN: output must not contain "${forbidden}"`);
    }
  }

  // 3. structure checks (if expected_structure is defined)
  if (fixture.expected_structure) {
    const structureResult = validateStructure(output, fixture.expected_structure);
    failures.push(...structureResult);
  }

  return { passed: failures.length === 0, failures };
}

/**
 * Validate that the output is valid JSON matching the expected structure.
 */
function validateStructure(output: string, schema: ExpectedStructure): string[] {
  const failures: string[] = [];

  // Try to extract JSON from the output (may be wrapped in markdown code blocks)
  let jsonStr = output;
  const jsonMatch = output.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    failures.push(`STRUCTURE: output is not valid JSON`);
    return failures;
  }

  if (schema.type === "object") {
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      failures.push(`STRUCTURE: expected object, got ${Array.isArray(parsed) ? "array" : typeof parsed}`);
      return failures;
    }

    const obj = parsed as Record<string, unknown>;

    // Check required fields
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in obj)) {
          failures.push(`STRUCTURE: missing required field "${key}"`);
        }
      }
    }

    // Check property types and constraints
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        if (!(key in obj)) continue; // already checked in required

        const value = obj[key];

        if (prop.type === "string" && typeof value !== "string") {
          failures.push(`STRUCTURE: field "${key}" should be string, got ${typeof value}`);
        }
        if (prop.type === "number" && typeof value !== "number") {
          failures.push(`STRUCTURE: field "${key}" should be number, got ${typeof value}`);
        }
        if (prop.type === "boolean" && typeof value !== "boolean") {
          failures.push(`STRUCTURE: field "${key}" should be boolean, got ${typeof value}`);
        }
        if (prop.type === "object" && (typeof value !== "object" || value === null || Array.isArray(value))) {
          failures.push(`STRUCTURE: field "${key}" should be object`);
        }
        if (prop.type === "array" && !Array.isArray(value)) {
          failures.push(`STRUCTURE: field "${key}" should be array, got ${typeof value}`);
        }

        // Enum check
        if (prop.enum && typeof value === "string" && !prop.enum.includes(value)) {
          failures.push(`STRUCTURE: field "${key}" value "${value}" not in enum [${prop.enum.join(", ")}]`);
        }

        // Nested required check for objects
        if (prop.type === "object" && prop.required && typeof value === "object" && value !== null) {
          const nested = value as Record<string, unknown>;
          for (const nestedKey of prop.required) {
            if (!(nestedKey in nested)) {
              failures.push(`STRUCTURE: field "${key}" missing required sub-field "${nestedKey}"`);
            }
          }
        }
      }
    }
  }

  return failures;
}
