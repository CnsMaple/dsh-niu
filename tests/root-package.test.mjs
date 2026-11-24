import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const pkg = JSON.parse(await read("package.json"));
const req = createRequire(new URL("index.js", root));

test("manifest and exports are self-contained", async () => {
  assert.equal(pkg.name, "dsh-niubash");
  assert.equal(pkg.engines.dsh, "0.2.3-alpha.2");
  assert.equal(pkg.dsh.bundle.patch, "./cordis.patch.yml");
  for (const key of [".", "./client", "./sandbox", "./locale/*.json", "./icon", "./package.json"]) assert.ok(pkg.exports[key], key);
  assert.deepEqual(pkg.dependencies ?? {}, {});
  assert.equal(pkg.peerDependencies["@deepseek-ai/dsh-pwsh-sandbox"], "0.2.3-alpha.2");
  for (const key of ["prepare", "prepack", "install", "postinstall"]) assert.equal(pkg.scripts?.[key], undefined);
  const listed = ["index.js", "client.js", "sandbox/index.js", "sandbox/resolve.js", "cordis.patch.yml", "locale/en.json", "locale/zh.json", "icon.svg", "LICENSE"];
  for (const p of listed) await read(p);
  assert.equal(typeof (await import("dsh-niubash")).apply, "function");
  assert.equal(req.resolve("dsh-niubash/sandbox"), fileURLToPath(new URL("sandbox/index.js", root)));
  assert.equal(req.resolve("dsh-niubash/client"), fileURLToPath(new URL("client.js", root)));
  for (const dir of ["sandbox", "locale"]) assert.ok(!(await readdir(new URL(dir + "/", root))).includes("package.json"), `nested package boundary: ${dir}`);
});

test("generated artifacts match the private component sources", async () => {
  const sandboxSrc = await read("packages/shell/niu-sandbox/lib/index.js");
  assert.equal(await read("sandbox/index.js"), sandboxSrc);
  assert.equal(await read("sandbox/resolve.js"), await read("packages/shell/niu-sandbox/lib/resolve.js"));
  assert.equal(await read("client.js"), (await read("packages/client/ui-niu/lib/client.js")).replace('id: "dsh-niubash-client"', 'id: "dsh-niubash"'));
});

test("private component sources are not publishable", async () => {
  for (const path of ["packages/shell/niu-sandbox/package.json", "packages/client/ui-niu/package.json"]) {
    const component = JSON.parse(await read(path));
    assert.equal(component.private, true, path);
    assert.equal(component.publishConfig, undefined, path);
    assert.ok(!String(component.name).startsWith("@"), `${path} uses a private, unscoped name`);
  }
});

test("client registers exactly one root package module", async () => {
  const registrations = [];
  vm.runInNewContext(await read("client.js"), { window: { __ModuleLoader__: { load: item => registrations.push(item) } } });
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].id, pkg.name);
  assert.equal(typeof registrations[0].factory, "function");
  assert.equal(pkg.dsh.client.platform, "web");
});

test("host rows replace both shell providers and keep bash", async () => {
  const host = await read("cordis.patch.yml");
  assert.match(host, /name: 'dsh-niubash\/sandbox'/);
  assert.match(host, /name: 'dsh-niubash'/);
  assert.match(host, /- id: bash-sandbox\n  disabled: true/);
  assert.match(host, /- id: pwsh-sandbox\n  disabled: true/);
  assert.match(host, /- id: tool-pwsh\n  disabled: true/);
  assert.match(host, /- id: tool-bash\n  disabled: false/);
  assert.doesNotMatch(host, /name: ['"]?(?:\.{1,2}\/|[A-Za-z]:[\\/])/);
});
