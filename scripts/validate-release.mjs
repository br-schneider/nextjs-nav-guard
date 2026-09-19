import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
assert.match(
  version,
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
  "Automatic publishing requires a stable package version.",
);
assert.equal(
  process.env.RELEASE_TAG,
  `v${version}`,
  "The release tag must match package.json exactly, including its v prefix.",
);
