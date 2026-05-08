/**
 * Eval fixture types for DocVault eval suite.
 * Each fixture represents a single test scenario for a model router job.
 */

export type JobName =
  | "cards.generate"
  | "plan.compose"
  | "report.weekly"
  | "agent.deepStudy"
  | "osce.judge"
  | "video.script"
  | "vault.qa";

export interface FixtureMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface FixtureInput {
  messages: FixtureMessage[];
  context?: Record<string, unknown>;
}

export interface StructureProperty {
  type: string;
  enum?: string[];
  required?: string[];
}

export interface ExpectedStructure {
  type: string;
  required?: string[];
  properties?: Record<string, StructureProperty>;
}

export interface EvalFixture {
  id: string;
  job: JobName;
  input: FixtureInput;
  expected_must_contain: string[];
  expected_must_not_contain: string[];
  expected_structure: ExpectedStructure | null;
  notes: string;
}

export interface EvalResult {
  fixtureId: string;
  job: JobName;
  passed: boolean;
  duration_ms: number;
  failures: string[];
  output?: string;
  error?: string;
}
