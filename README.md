# DSH Niubash Plugins

Niubash support for DeepSeek Harness.

## Install the repository bundle

First install Niubash and make `niu.exe` available on `PATH`. This bundle targets **exactly DSH 0.2.3-alpha.2**; it does not install Niubash. In DSH, open Plugins → Add plugin and enter:

```text
https://github.com/CnsMaple/dsh-niu
```

The root package contains its runtime and client artifacts; installation needs no other packages and no install-time build. The component sources under `packages/` are private inputs for this build, not separately installable. DSH supplies the `@deepseek-ai/dsh-pwsh-sandbox` runtime peer. For reproducibility, append a full commit SHA to the repository URL.

## How it replaces the shell

DSH has one `ctx.shell` capability. The bundle disables both first-party providers (`bash-sandbox`, `pwsh-sandbox`), inserts a Niubash executor as the one shell provider, keeps the dialect-neutral `bash` tool, and disables `tool-pwsh`. Every consumer of `ctx.shell` — the model's bash tool, background jobs, hooks, and any agent preset, official (standard, ptc, cordis, minimal) or user-defined — then runs `niu -c`. No agent preset is edited, so upgrading DSH never requires resnapshotting presets. `tool-bash` resolves to the DSH installation's own copy; `tool-pwsh` is disabled because its PowerShell schema would not match niu execution. The Settings information card is read-only and cannot detect the current session provider.

## Development

The root bundle ships generated artifacts copied from the private sources under `packages/`. After editing a source package, run `node scripts/sync-root.mjs` and `node --test tests/root-package.test.mjs`; review and commit the regenerated files with the source changes. The sync script is a maintainer tool, never an install lifecycle hook. The tests check exact source synchronization, exports, patches, client identity, package boundaries, and that the component sources stay private.

The sources under `packages/` are private build inputs for the root package; they are not published or installed on their own.

## License

See the individual package metadata and upstream DSH license terms.
