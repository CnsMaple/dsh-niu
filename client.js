window.__ModuleLoader__.load({
  id: "dsh-niubash",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const NS = "settings.niu";
    const BUNDLE = "dsh-niubash";
    const copy = {
      en: {
        description: "This bundle configures Niubash as a Windows shell provider when its profile patches are applied.",
        status: "This page cannot determine the current session’s provider. Install Niubash separately, put niu.exe on PATH, and check the niu-sandbox and tool-bash rows in Plugins and your profile configuration.",
        exportHint: "If session export is available, the session header’s more-actions menu can copy Markdown or download a ZIP; /export downloads a ZIP.",
      },
      zh: {
        description: "应用此 bundle 的 profile 补丁时，将配置 Niubash 为 Windows Shell Provider。",
        status: "此页面无法判断当前会话使用的 Provider。请单独安装 Niubash，将 niu.exe 加入 PATH，并在插件页面和 profile 配置中检查 niu-sandbox、tool-bash 行。",
        exportHint: "若会话导出功能可用，可在会话标题的更多操作菜单中复制 Markdown 或下载 ZIP；/export 可下载 ZIP。",
      },
    };

    function NiuInfo({ t }) {
      return h("section", {
        style: {
          color: "var(--dsw-alias-label-secondary)",
          fontSize: 13,
          lineHeight: 1.5,
          display: "grid",
          gap: 8,
        },
      },
        h("p", { style: { margin: 0 } }, t("description")),
        h("p", { style: { margin: 0 } }, t("status")),
        h("p", { style: { margin: 0 } }, t("exportHint")),
      );
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, copy), "ui-niu: dictionaries");
      ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
        name: "plugins.bundle.config",
        key: BUNDLE,
        locale: NS,
      }, NiuInfo));
    }

    return { NS, apply, inject: ["slots", "locale"] };
  },
});
