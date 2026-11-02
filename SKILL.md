---
name: ui-motion
description: 为 Web 与 H5 组件审查或实现界面动效，按交互意图选择节奏并保留项目既有结构与行为。
---

# UI 动效

为 Web/H5 组件选择能表达状态、反馈或空间关系的动效。先辨认用户要审查、建议还是实现，再按需读取一类配方；动效可以很轻，也可以省略。

## 工作方式

- 将用户当前组件、框架、视觉系统和明确范围作为边界。保留设计 token、文案、内容、回调、语义和现有状态模型；不为动效擅自改写交互或引入依赖。
- 用户要走查、诊断或建议时，只检查并报告证据、影响和建议；只有用户要求实现时才修改代码。实现范围不清时先做范围内可逆的局部方案，并标出未覆盖部分。
- 先写清触发事件、语义状态、可见结果和中断/返回路径。让动画呈现应用已有状态，不让动画成为状态来源；避免重复状态和竞态。
- 为真实意图选择一种或少量动效属性，先试最小有效幅度。保留键盘操作、焦点可见性、触屏操作和 `prefers-reduced-motion` 下完整的功能反馈。
- 依照[决策指南](references/decision-guide.md)路由任务，按需打开对应配方；审查或实现后参照[验证指南](references/verification.md)。不必一次读取所有配方。

## 配方路由

- 按下、加载、成功或失败的即时反馈：[press-and-status](recipes/press-and-status.md)
- 面板、提示、弹层的出现与退出：[presence-and-overlays](recipes/presence-and-overlays.md)
- 选中项、标签切换与页面导航：[selection-and-navigation](recipes/selection-and-navigation.md)
- 拖动、排序和触摸手势：[reorder-and-gestures](recipes/reorder-and-gestures.md)
- 输入、校验和提交反馈：[forms-and-feedback](recipes/forms-and-feedback.md)
- 数字、标签或内容更新：[data-and-content](recipes/data-and-content.md)

此 skill 面向组件层的 Web/H5 动效。优先沿用目标项目已有的动效工具和约定；只有项目没有合适工具、且运行环境适配 DOM 与 Web Animations API 时，才考虑使用本仓库的[可选运行时](runtime/motion.mjs)。它不要求接入，也不应覆盖项目已有系统；需要使用专用 wrapper，避免覆盖元素已有的 `transform`/`opacity`。四个 helper 的选项默认值和完成结果见[运行时契约](references/verification.md#bundled-runtime-contract)。
