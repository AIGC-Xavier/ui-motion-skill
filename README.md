# ui-motion

给 Codex 用的 UI 动效技能，适用于 Web 和 H5。可以处理按钮反馈、弹窗开合、导航切换、列表重排等场景，也会检查连续点击、动画中断和键盘操作等细节。仓库里附有可运行的示例，方便直接体验效果。

## 安装

将仓库克隆到 Codex 的 skills 目录：

```sh
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
git clone https://github.com/AIGC-Xavier/ui-motion-skill.git "${CODEX_HOME:-$HOME/.codex}/skills/ui-motion"
```

安装后重启 Codex。

## 使用

在对话中输入 `$ui-motion`，说明要调整的组件和预期效果。例如：

```text
$ui-motion 给这个弹窗加上打开和关闭过渡，保留现有布局，并检查连续开关和键盘操作。
```

Codex 也可以在相关 Web/H5 动效任务中自动选择这个 skill。各类场景的具体说明：

| 场景 | 指南 |
| --- | --- |
| 按钮、加载与完成状态 | [按钮与状态反馈](recipes/press-and-status.md) |
| 弹窗、菜单与浮层 | [进入与退出](recipes/presence-and-overlays.md) |
| 选项、标签页与导航 | [选择与导航](recipes/selection-and-navigation.md) |
| 列表重排、拖动与手势 | [重排与手势](recipes/reorder-and-gestures.md) |
| 输入、校验与通知 | [表单与反馈](recipes/forms-and-feedback.md) |
| 数值、图表与内容变化 | [数据与内容](recipes/data-and-content.md) |

## 预览示例

在仓库目录运行以下命令，需要 Node.js 22 或更新版本：

```sh
node scripts/serve-demo.mjs
```

打开 <http://127.0.0.1:8766/>，可以体验按钮状态、浮层开合、数值变化和列表重排，也可以尝试中途取消、连续触发和键盘导航。

## 动效工具

[runtime/motion.mjs](runtime/motion.mjs) 提供四个可按需使用的函数，基于浏览器原生 API，无需安装额外依赖：

| 函数 | 用途 |
| --- | --- |
| `shiftLabel` | 切换文字标签 |
| `animateValue` | 在两个数值之间平滑过渡 |
| `setPresence` | 控制元素的进入、退出与显隐 |
| `animateLayout` | 在布局变化后过渡到新位置 |

项目已有动效方案时，优先沿用。函数参数、取消方式和使用限制见[运行时说明](references/verification.md#bundled-runtime-contract)。

## 运行检查

在仓库目录运行，无需安装依赖。CI 使用 Node.js 22：

```sh
node --test tests/*.test.mjs
node scripts/validate.mjs
```

测试检查状态切换、取消、重复触发、减少动态效果等行为；校验器检查 skill 配置、文件结构和文档链接。实际视觉效果和键盘交互需在浏览器中确认，具体项目的检查要点见[验证指南](references/verification.md)。

## 许可证

暂未指定分发许可证。
