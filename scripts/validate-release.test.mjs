import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const script = fileURLToPath(new URL("validate-release.mjs", import.meta.url));

for (const [name, tag, accepted] of [
  ["accepts the exact version tag", `v${version}`, true],
  ["rejects a missing tag", "", false],
  ["rejects a different version", "v9999.0.0", false],
  ["rejects a missing v prefix", version, false],
  ["rejects prerelease tags", `v${version}-beta.1`, false],
  ["rejects trailing whitespace", `v${version}\n`, false],
]) {
  test(name, () => {
    const result = spawnSync(process.execPath, [script], {
      env: { ...process.env, RELEASE_TAG: tag },
      encoding: "utf8",
    });
    assert.ifError(result.error);
    assert.equal(result.status === 0, accepted, result.stderr);
  });
}
