import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const source = await readFile(new URL("lib/client.js", root), "utf8");

test("Host entry exports a no-op plugin without evaluating browser code", async () => {
  const host = await import(new URL("lib/index.js", root));
  assert.equal(typeof host.apply, "function");
  assert.doesNotThrow(() => host.apply());
});

test("browser artifact registers the bundle slot and follows DSH locale", () => {
  let loaded;
  let requireCount = 0;
  const React = { createElement: (type, props, ...children) => ({ type, props, children }) };
  vm.runInNewContext(source, { window: { __ModuleLoader__: { load(value) { loaded = value; } } } });
  assert.equal(loaded.id, manifest.name);
  assert.equal(requireCount, 0);
  const plugin = loaded.factory((name) => {
    requireCount++;
    assert.equal(name, "react");
    return React;
  });
  assert.deepEqual(Array.from(plugin.inject), ["slots", "locale"]);
  const effects = [];
  const registrations = [];
  let dictionaries;
  const ctx = {
    effect(callback) { effects.push(callback()); },
    locale: { register(namespace, entries) { assert.equal(namespace, plugin.NS); dictionaries = entries; return () => {}; } },
    slots: {
      inject(name, callback) { assert.equal(name, "plugins.bundle.config"); effects.push(callback()); },
      register(options, component) { registrations.push({ options, component }); return () => {}; },
    },
  };
  plugin.apply(ctx);
  assert.equal(registrations.length, 1);
  const { options, component } = registrations[0];
  assert.equal(options.name, "plugins.bundle.config");
  assert.equal(options.key, "dsh-niubash");
  assert.equal(options.locale, plugin.NS);
  for (const locale of ["en", "zh"]) {
    const element = component({ view: "page", t: (key) => dictionaries[locale][key] });
    assert.equal(element.type, "section");
    assert.equal(element.children.length, 3);
    assert.ok(element.children.every(child => child.type === "p" && typeof child.children[0] === "string" && child.children[0].length > 0));
    assert.ok(element.children.every(child => child.type !== "input" && child.type !== "button"));
  }
  assert.match(dictionaries.en.status, /cannot determine/);
  assert.match(dictionaries.zh.status, /无法判断/);
  assert.equal(effects.length, 2);
});

test("manifest declares target client dependencies without unavailable slots package", () => {
  assert.deepEqual(manifest.dsh.client.inject, ["@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-plugin-manager"]);
  assert.equal(manifest.dsh.client.platform, "web");
  assert.equal(manifest.exports["./client"].default, "./lib/client.js");
  assert.equal(manifest.exports["."].default, "./lib/index.js");
  assert.ok(manifest.files.includes("lib/client.js"));
  assert.ok(manifest.files.includes("lib/index.js"));
});
