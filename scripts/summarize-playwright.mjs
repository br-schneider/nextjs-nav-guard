import { appendFileSync, readFileSync } from "node:fs";

const report = JSON.parse(
  readFileSync("playwright-report/results.json", "utf8"),
);
const counts = {
  passed: 0,
  expectedFailures: 0,
  unexpectedFailures: 0,
  flaky: 0,
  skipped: 0,
};
const expectedFailures = [];

function visit(suite) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests) {
      if (test.status === "skipped") counts.skipped += 1;
      else if (test.status === "flaky") counts.flaky += 1;
      else if (test.status === "unexpected") counts.unexpectedFailures += 1;
      else if (test.expectedStatus === "failed") {
        counts.expectedFailures += 1;
        expectedFailures.push(`${test.projectName}: ${spec.title}`);
      } else counts.passed += 1;
    }
  }
  for (const child of suite.suites ?? []) visit(child);
}

visit(report);
const summary = [
  "## Browser verification",
  "",
  `Passed: ${counts.passed}. Expected failures: ${counts.expectedFailures}. Unexpected failures: ${counts.unexpectedFailures}. Flaky: ${counts.flaky}. Skipped: ${counts.skipped}.`,
  "",
  ...expectedFailures.map(
    (name) => `- Known limitation, not verified protection: ${name}`,
  ),
  "",
].join("\n");

process.stdout.write(summary);
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
