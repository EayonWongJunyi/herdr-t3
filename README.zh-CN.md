# Herdr T3

[English](README.md) · 中文

给 Herdr App 用的 [T3 Code](https://github.com/pingdotgg/t3code) 风格布局。侧栏可以在 Spaces + Agents 和带 T3 式 Settle 的 Focus 列表之间切换，另有窄标签栏、带圆角边框的窗格，以及一次只看一个 agent 的 Agent 模式。

![Herdr T3](preview.png)

只想要 Settle 侧栏？它也单独发布了一份：[herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus)。

## 功能

- **两种侧栏，一键切换**（`cmd-shift-b`）：Spaces + Agents，或 Focus。
  - Spaces：只在不寻常时显示仓库、分支和领先/落后；worktree 折叠在它的 checkout 下；机器多于一台时按机器分组。
  - Agents：按 space 或按优先级分组，可置顶，子 agent 缩进在父级下。
  - Focus：T3 式 Settle。需要你的 agent 以卡片留在上方；结束的由你手动 Settle 进底部的安静列表，有新工作时自动回来。工作中的 agent 折叠进 Working 收纳区。
- **Agent 模式**（`cmd-shift-a`，或 `+` 左边的按钮）：工作区不再显示当前标签，而是把一个 agent 铺满显示，在侧栏点谁就显示谁。标签栏变成一条显示该 agent 的栏，滚轮切换 agent。会落到看不见的地方的操作都会自动退回标签模式：在当前 space 新开 shell 或分屏（并聚焦过去）、从 `+` 启动任何东西、焦点移到 shell 上。新出现的 agent pane（多半是 agent 自己派生的）不会抢走画面，它会出现在侧栏里。
- **各处同一个名字**：Focus 卡片、agents 列表、标签和窗格标题用同一条规则给终端取名：Pi 会话名，其次是你命名过的标签，再其次是有意义的终端标题，最后是程序名。同一个标签里的两个 Pi 各自显示自己的会话名。
- **各处同一套状态标记**：工作中转圈，blocked 显示 `!`，done 显示圆点。显示 Focus 时，已 Settle 的 agent 在标签和窗格标题上也不再显示 done 圆点。
- **窄标签、带框窗格**：28px 胶囊标签；圆角窗格带 28px 标题栏（名字、目录、状态；悬停时出现分屏、缩放、关闭）。
- **新建菜单**（`+`）：先选 space（或新建一个），再选终端或任一已安装的 agent。

## 安装

让你的 Herdr agent 添加 `herdr.dev/layouts/JinJieBeWater/herdr-t3`。手动安装：把 `layouts/herdr-t3.json`、`layouts/herdr-t3.svg` 和所有 `mods/t3-*` 复制进 `~/.config/herdr-app/`，把 `keys.json` 合并进你自己的，然后按 `ctrl-shift-l` 切换（或运行 `layout.switch {"name": "herdr-t3"}`）。外观和行为见 [RECIPE.zh-CN.md](RECIPE.zh-CN.md)。

## 快速上手

1. **切换过来**：按 `ctrl-shift-l`，直到窗口变成 Herdr T3。想要截图里的配色，再到设置里选 `herdr-t3` 主题（见可选扩展）。
2. **开始干活**：点标签栏右侧的 `+`（或按 `cmd-t`）。先选一个 space，或用 New space 选一个文件夹，再选终端或某个 agent。
3. **在 Spaces + Agents 里看进度**：侧栏一开始就是这个视图。Spaces 显示你在哪、git 状态如何；Agents 列出正在跑的 agent，用转圈、`!` 或圆点表示状态。
4. **agent 多了就切到 Focus**：按 `cmd-shift-b`（或侧栏顶部的对勾图标）。需要你处理的 agent 以卡片排在上方，工作中的折叠进 Working。
5. **把做完的 Settle 掉**：鼠标移到已结束的卡片上，点 `✓ Settle`。它会收进底部的 Settled，done 圆点也会消失。之后再给它发消息，或它又开始工作，就会自己回来；也可以点它那一行的撤销箭头手动拿回来。
6. **一次只看一个 agent**：按 `cmd-shift-a`（或 `+` 左边的按钮）。工作区会把一个 agent 铺满显示；点侧栏的卡片或行，或按 `cmd-]` / `cmd-[`，切换显示哪个。分屏（`cmd-d`）、新建标签或从 `+` 启动任何东西都会自动回到标签模式，不会开在看不见的地方。再按一次 `cmd-shift-a` 回到标签模式。
7. **窗格**：鼠标移到窗格标题栏上可以分屏、缩放或关闭；`cmd-d` / `cmd-shift-d` 分屏，`cmd-shift-enter` 缩放。

## 更新

Herdr 不会更新别人做的 mod 和布局。再添加一次也不行：安装从不覆盖已有文件，只会装出一份改了名的副本（如 `t3-focus-2`）。更新要靠覆盖：

- 对你的 Herdr agent 说：「从 github.com/JinJieBeWater/herdr-t3 更新 Herdr T3：用仓库最新的文件覆盖我已安装的 `mods/t3-*` 和 `layouts/herdr-t3.*`，然后对每个 mod 跑 `herdr-app check`。」如果首次安装时因为重名改过名字，就覆盖改名后的那份。
- 手动更新：把同样的文件复制过去覆盖旧的。mod 保存后自动重载，不用重启。
- 会保留：置顶、折叠、排序、Settled 收纳区和已 Settle 的 agent。这些存在 `data/`、`shared.json` 和终端标签里，不在 mod 目录中。会丢掉：你自己对被覆盖文件的修改。
- `keys.json` 和可选扩展保持原样；只有提交记录提到它们时，再和仓库对比。带 `!` 的提交会改名（例如 `refactor!: rename the layout and theme to herdr-t3`），按提交里的改名同步调整。

## 它会运行什么

- `t3-spaces`：在各 space 的目录里运行只读的 `git status` / `git rev-parse`，监听这些仓库的变化（`watchFolder`），运行 `hc machine ls --json`。
- `t3-focus`：Settle 或取消 Settle 时运行 `hc label <agent> settled=<ms>:<turn>`。
- `t3-new-menu`：向 Herdr 查询装了哪些 agent（`knownAgents`）。

不发网络请求。

## 可选扩展

不属于布局本身，安装时也不会被复制；需要的话手动添加。

### pulls.review

`extras/mods/pulls-review/` 在 [pulls.review](https://github.com/antfu/pulls.review) 里打开当前窗格所在的仓库：有未提交改动时看这些改动，否则打开 pulls.review 的默认页面（当前分支对比默认分支）。

- **需要[我的 fork](https://github.com/JinJieBeWater/pulls.review/tree/multi-repo) 里的 CLI**（`multi-repo` 分支）。这个 mod 运行 `pulls.review -d --pwa`：`-d` 把仓库交给一个所有仓库共用的后台服务，`--pwa` 打开已安装的 pulls.review 应用，而不是浏览器标签页。上游 pulls.review 没有这两个参数。
- 只支持本机目录：窗格在其他机器上时会报错。
- 安装：把 `extras/mods/pulls-review/` 复制进 `~/.config/herdr-app/mods/`，再在 `keys.json` 的 `global` 里加一个快捷键：`"cmd-shift-r": "mod.open:pulls-review"`。
- 会运行只读的 `git status --porcelain` 和 `pulls.review`。
- 本布局的标签栏没有对应按钮，用快捷键或命令面板打开。

### 预览图里的主题和设置

`extras/themes/herdr-t3.json` 是截图里的深色主题：canvas 和 chrome 为 `#141418`，accent 和 working 为 `#6b93ff`，blocked 为 `#f0a33a`。把它复制进 `~/.config/herdr-app/themes/`。它和布局同名，所以是这个布局专属的主题：只有在 Herdr T3 布局里，设置页才会列出它，在那里选上即可。其余设置写进 `settings.json`：

```json
{
  "appearance": "dark",
  "font": "Maple Mono NF CN",
  "ui_font": "Maple Mono NF CN",
  "font_size": 12,
  "minimum_contrast": 3
}
```

Herdr 不自带 [Maple Mono NF CN](https://github.com/subframe7536/maple-font)：先安装它，或者删掉字体这几行，沿用 Herdr 的 JetBrains Mono 和 Geist。

### 我配套用的快捷键

写在 `keys.json` 的 `global` 里，另外还有布局自带的 `cmd-shift-b` 和 `cmd-shift-a`：

| 快捷键 | 命令 | 作用 |
| --- | --- | --- |
| `cmd-]` / `cmd-[` | `agent.next` / `agent.prev` | 按 Focus 卡片的顺序切换 agent，已 Settle 的排在最后 |
| `cmd-p` | `mod.open:picker` | 和 Focus 顶栏的 Search 是同一个选择器 |
| `cmd-shift-r` | `mod.open:pulls-review` | 审阅当前仓库（需要上面的扩展） |

## 致谢与许可证

`t3-chrome`、`t3-spaces`、`t3-agents`、`t3-tabs`、`t3-pane`、`t3-new-menu` 和布局本身，分别基于 Herdr App 自带的 `workspace-chrome`、`spaces`、`agents`、`tabs`、`pane`、`new-menu` 和 `main` 修改。Settle 参照 T3 Code 的设计。许可证与 Herdr App 相同，为 Apache-2.0。

## 更多

- [herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus)：本布局的 Focus 侧栏，单独作为 mod 发布。
- [herdling](https://github.com/JinJieBeWater/herdling)：Herdr 的 macOS 菜单栏伴侣。
- [pi-stuff](https://github.com/JinJieBeWater/pi-stuff)：我写的 Pi 扩展和 Skills。
