# dsh-niubash-client

此 Web 客户端在 DSH 0.2.3-alpha.2 的 Niubash bundle 插件详情页提供只读说明。它不会检测当前 Provider、修改 profile 配置或提供启用开关。实际配置由 bundle/profile 补丁决定；请检查相关设置确认。

必须将此客户端包作为 Host 插件挂载，DSH 才会发现其 `./client` 入口。若 DSH 会话日志导出插件可用，可通过会话标题的更多操作菜单或 `/export` 导出会话。

`lib/client.js` 是浏览器模块加载器产物，`lib/index.js` 是空的 Host 入口。运行 `node --test test/client.test.mjs` 可检查两个入口及 slot 契约。
