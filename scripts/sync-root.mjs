// Maintainer-only artifact sync. Never run during installation.
//
// The root package `dsh-niubash` is the only published artifact. It ships
// prebuilt runtime files generated from the private component sources under
// `packages/`, so installation needs no component packages and no build step.
// `cordis.patch.yml`, `locale/` and `icon.svg` live only at the root and are
// the source of truth; this script only regenerates the code artifacts.
import { readFile, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const write = (path, data) => writeFile(new URL(path, root), data);

// sandbox/index.js + sandbox/resolve.js: the sandbox executor and the niu
// path resolver it uses, both from the private `dsh-niubash-sandbox` sources.
await write("sandbox/index.js", (await read("packages/shell/niu-sandbox/lib/index.js"))
  .replace(/^import \{ resolveNiuPath \} from '.\/resolve.js';$/m, "import { resolveNiuPath } from './resolve.js';"));
await write("sandbox/resolve.js", await read("packages/shell/niu-sandbox/lib/resolve.js"));

// client.js: the Web information card, registered under the root package name.
await write("client.js", (await read("packages/client/ui-niu/lib/client.js"))
  .replace('id: "dsh-niubash-client"', 'id: "dsh-niubash"'));
