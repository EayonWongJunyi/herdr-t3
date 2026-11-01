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
- **释放已放下的 Pi 进程**：Settle 满 30 分钟后，隐藏且未置顶的 Pi 和它空闲的子 agent 可以结束运行，会话和窗格位置保留。打开标签时自动接回父 agent；有窗格的子 agent 提供手动 Resume 按钮。
- **Agent 模式**（`cmd-shift-a`，或 `+` 左边的按钮）：工作区不再显示当前标签，而是把一个 agent 铺满显示，在侧栏点谁就显示谁。标签栏变成一条显示该 agent 的栏，滚轮切换 agent。会落到看不见的地方的操作都会自动退回标签模式：在当前 space 新开 shell 或分屏（并聚焦过去）、从 `+` 启动任何东西、焦点移到 shell 上。新出现的 agent pane（多半是 agent 自己派生的）不会抢走画面，它会出现在侧栏里。
- **各处同一个名字**：Focus 卡片、agents 列表、标签和窗格标题用同一条规则给终端取名：Pi 会话名，其次是你命名过的标签，再其次是有意义的终端标题，最后是程序名。同一个标签里的两个 Pi 各自显示自己的会话名。
- **各处同一套状态标记**：工作中转圈，blocked 显示 `!`，done 显示圆点。显示 Focus 时，已 Settle 的 agent 在标签和窗格标题上也不再显示 done 圆点。
- **窄标签、带框窗格**：28px 胶囊标签；圆角窗格带 28px 标题栏（名字、目录、状态；悬停时出现分屏、缩放、关闭）。
- **新建菜单**（`+`）：先选 space（或新建一个），再选终端或任一已安装的 agent。

## 安装

让你的 Herdr agent 添加 `herdr.dev/layouts/JinJieBeWater/herdr-t3`。手动安装：把 `layouts/herdr-t3.json`、`layouts/herdr-t3.svg` 和所有 `mods/t3-*` 复制进 `~/.config/herdr-app/`，把 `keys.json` 合并进你自己的。外观和行为见 [RECIPE.zh-CN.md](RECIPE.zh-CN.md)。

## 快速上手

- **侧栏**：侧栏右上角的按钮（或 `cmd-shift-b`）在 Spaces + Agents 和 Focus 之间切换；旁边那个按钮隐藏侧栏。
- **Focus**：鼠标移到已结束的卡片上，点 `✓ Settle` 收起；有新工作时它会自己回来，也可以点那一行的撤销箭头拿回来。
- **Released**：淡色 `Released` 表示进程已经结束。点卡片或标签即可接回。取消 Settle 只改变列表位置，打开时才接回。工作中、blocked、置顶或当前可见的对话继续运行。只在本布局里、明确 Settle 后释放，普通空闲时间不计入。
- **Agent 模式**：`+` 左边的按钮（或 `cmd-shift-a`）把一个 agent 铺满显示，点侧栏卡片切换显示哪个。新开 shell、分屏或从 `+` 启动东西时会自动回到标签模式。

## 更新

Herdr 不会更新别人做的 mod 和布局。再添加一次也不行：安装从不覆盖已有文件，只会装出一份改了名的副本（如 `t3-focus-2`）。更新要靠覆盖：

- 对你的 Herdr agent 说：「从 github.com/JinJieBeWater/herdr-t3 更新 Herdr T3：用仓库最新的文件覆盖我已安装的 `mods/t3-*` 和 `layouts/herdr-t3.*`，然后对每个 mod 跑 `herdr-app check`。」如果首次安装时因为重名改过名字，就覆盖改名后的那份。
- 手动更新：把同样的文件复制过去覆盖旧的。mod 保存后自动重载，不用重启。
- 会保留：置顶、折叠、排序、Settled 收纳区和已 Settle 的 agent。这些存在 `data/`、`shared.json` 和终端标签里，不在 mod 目录中。会丢掉：你自己对被覆盖文件的修改。
- `keys.json` 和可选扩展保持原样；只有提交记录提到它们时，再和仓库对比。带 `!` 的提交会改名（例如 `refactor!: rename the layout and theme to herdr-t3`），按提交里的改名同步调整。

## 它会运行什么

- `t3-spaces`：在各 space 的目录里运行只读的 `git status` / `git rev-parse`，监听这些仓库的变化（`watchFolder`），运行 `hc machine ls --json`。
- `t3-focus`：Settle 或取消 Settle 时运行 `hc label <agent> settled=<ms>:<turn>`。
- `t3-chrome`：每分钟检查一次，用 `hc ls/get/label/kill` 释放符合条件的 Pi 树，用 `hc rm` 清理标签已关闭的释放记录。结束父进程前复查整棵树，再清理仍存活的子进程。
- `t3-released`：保留窗格，用 `hc read` 显示最后的输出；打开时启动 `pi --session <保存的文件>`，确认 Pi 已上报同一会话后才移除旧 Core 记录。接回期间用一个短命 Node.js 进程占用 Core 唯一名称，防止两个客户端同时启动同一 Pi；完成后清理，客户端退出后最多一分钟自动失效。失败时保留会话和 Retry 按钮。启动 Pi 也会加载你平常的 Pi 扩展和设置。
- `t3-new-menu`：向 Herdr 查询装了哪些 agent（`knownAgents`）。
- `t3-tabs`：读取可选 pulls.review 扩展的元数据，监听 mods 目录里的安装和卸载。

不发网络请求。

## 手动恢复已释放的对话

占位窗格在其他布局里也能接回。Herdr 自带的 agent 列表、`hc ls` 和外部工具只列出仍在运行的 agent，保存的标签仍可打开。

卸载布局前，先打开需要继续运行的对话。不借助 mod 恢复时，运行 `hc get <旧地址> --json`，找到 `t3.resume` 标签，再启动 `pi --session '<保存的文件>'`。没有窗格的子 agent 也保留这个标签。自动释放目前只支持 Pi。Core 无法把检查空闲与结束进程合成一个原子操作，最终复查之后的短暂间隙仍可能收到新消息。

## 可选扩展

不属于布局本身，安装时也不会被复制；需要的话手动添加。

### pulls.review

`extras/mods/pulls-review/` 在 [pulls.review](https://github.com/antfu/pulls.review) 里打开当前窗格所在的仓库：有未提交改动时看这些改动，否则打开 pulls.review 的默认页面（当前分支对比默认分支）。

- **需要[我的 fork](https://github.com/JinJieBeWater/pulls.review/tree/multi-repo) 里的 CLI**（`multi-repo` 分支）。这个 mod 运行 `pulls.review -d`：`-d` 把仓库交给一个所有仓库共用的后台服务。上游 pulls.review 没有后台服务模式。
- 只支持本机目录：窗格在其他机器上时会报错。
- 安装：把 `extras/mods/pulls-review/` 复制进 `~/.config/herdr-app/mods/`。`+` 旁边会出现评审按钮；卸载扩展后按钮隐藏，不用重启。
- 默认用浏览器打开。点按钮旁的小箭头，可以选择 **Browser** 或 **Installed app (PWA)**；先安装应用再选 PWA，这时才加 `--pwa`。选择会记住，按钮和快捷键共用。
- 可选快捷键：在 `keys.json` 的 `global` 里添加 `"cmd-shift-r": "mod.open:pulls-review"`。
- 会运行只读的 `git status --porcelain` 和 `pulls.review`。

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
