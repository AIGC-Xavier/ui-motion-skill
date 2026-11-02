# ui-motion

这是一个由 AIGC-Xavier 自行维护的 Codex skill，用于审查或实现 Web/H5 组件动效。它按交互意图路由到六类配方，并附带一组可选的浏览器原生 helper 和交互演示。没有第三方运行依赖；接入时优先保留目标项目已有的动效工具、token、回调和状态模型。

## 用户级安装

本仓库根目录就是 skill 路径（`.`），其中直接包含 `SKILL.md`。将仓库克隆到用户级 skills 目录即可：

```sh
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/AIGC-Xavier/ui-motion-skill.git "${CODEX_HOME:-$HOME/.codex}/skills/ui-motion"
```

安装目录不需要再嵌套一层仓库目录。skill 名称为 `ui-motion`，可用 `$ui-motion` 显式调用，也可由自动选择机制匹配相关 Web/H5 动效任务。

## 可选运行时与演示

[runtime/motion.mjs](runtime/motion.mjs) 提供 `shiftLabel`、`animateValue`、`setPresence` 和 `animateLayout`。它们使用浏览器 DOM/Web Animations 能力，不需要额外依赖，也不是 skill 工作流的必选项。先检查项目是否已有更适合的工具；接入前请按[运行时契约](references/verification.md#bundled-runtime-contract)核对参数、取消和返回状态。

启动本地演示服务器：

```sh
node scripts/serve-demo.mjs
```

然后打开 <http://127.0.0.1:8766/>。演示页面位于 [demo/index.html](demo/index.html)，用于手动体验状态反馈、浮层开合、数值过渡和列表布局联动。

## 维护者检查

验证工具和测试使用 Node 内置模块；CI 固定使用 Node.js 22。无需安装包：

```sh
node --test tests/*.test.mjs
node scripts/validate.mjs
```

行为测试覆盖运行时 helper 与校验器的可重复场景；校验器检查必需路径、入口 frontmatter、agent 元数据、六类配方和 Markdown 本地链接。这些命令不启动真实浏览器，也不验证实际渲染、浏览器交互或目标项目集成；演示需单独在浏览器中体验。

## 维护范围

入口、配方、运行时、验证工具和演示均为本项目自行维护。没有复制第三方动效目录或组件源码，也没有随包分发图片、字体或标志。具体来源与范围见 [PROVENANCE.md](PROVENANCE.md)。本仓库尚未指定分发许可证，待所有者决定后再添加。
