/**
 * Loads YAML eval fixtures from the fixtures directory.
 */
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import type { EvalFixture } from "./types";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");

export function loadAllFixtures(): EvalFixture[] {
  const files = fs
    .readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .sort();

  return files.map((file) => {
    const content = fs.readFileSync(path.join(FIXTURES_DIR, file), "utf-8");
    const fixture = yaml.load(content) as EvalFixture;
    if (!fixture.id || !fixture.job || !fixture.input) {
      throw new Error(`Invalid fixture file: ${file} — missing required fields`);
    }
    return fixture;
  });
}

export function loadFixturesByJob(job: string): EvalFixture[] {
  return loadAllFixtures().filter((f) => f.job === job);
}

export function loadFixtureById(id: string): EvalFixture | undefined {
  return loadAllFixtures().find((f) => f.id === id);
}
