// Fixture-based regression tests. Each test/expectations/*.json names a
// fixture in test/fixtures/ plus assertions about the extracted Markdown.
// To add a regression test for a new problem site: capture a fixture with
// the debug context menu, then add one JSON — nothing else.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
import { extract } from "../src/content/extract-page.js";

const expectationsDir = new URL("./expectations/", import.meta.url);

for (const file of readdirSync(expectationsDir).sort()) {
  if (!file.endsWith(".json")) continue;
  const expectation = JSON.parse(readFileSync(new URL(file, expectationsDir), "utf8"));

  test(file.replace(/\.json$/, ""), () => {
    const html = readFileSync(new URL(`./fixtures/${expectation.fixture}`, import.meta.url), "utf8");
    const { document } = parseHTML(html);

    const result = extract(document, expectation.url);
    assert.equal(result.error, undefined, `extract() failed: ${result.error}`);

    for (const needle of expectation.mustContain ?? []) {
      assert.ok(result.markdown.includes(needle), `markdown must contain: ${needle}`);
    }
    for (const needle of expectation.mustNotContain ?? []) {
      assert.ok(!result.markdown.includes(needle), `markdown must NOT contain: ${needle}`);
    }
    for (const [key, value] of Object.entries(expectation.meta ?? {})) {
      assert.equal(result.meta[key], value, `meta.${key}`);
    }
  });
}
