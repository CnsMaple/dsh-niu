# dsh-niubash-client

The Web client contributes a read-only explanation to the Niubash bundle’s Plugins detail page on DSH 0.2.3-alpha.2. It does not detect the active provider, change profile configuration, or provide an enable switch. Bundle/profile patches determine the effective configuration; inspect those settings to confirm it.

The client package must be mounted as a Host plugin for DSH to discover its `./client` entry. If the DSH session-log export plugin is available, use the session header’s more-actions menu or `/export` for session export.

The shipped `lib/client.js` is the browser module-loader artifact and `lib/index.js` is the no-op Host entry. Run `node --test test/client.test.mjs` to check both entrypoints and the slot contract.
