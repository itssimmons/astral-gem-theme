import { test } from "node:test";
import assert from "node:assert";

function someAsyncThing() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 100);
  });
}

test("timing test", (t) => {
  t.plan(2);

  assert.equal(typeof Date.now, "function");
  const start = Date.now();

  setTimeout(function () {
    assert.equal(Date.now() - start, 100);
  }, 100);
});

test("test using promises", async () => {
  const result = await someAsyncThing();
  assert.ok(result);
});
