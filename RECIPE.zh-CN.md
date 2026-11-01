# Herdr T3

> 中文译本。给 agent 构建用的正本是 [RECIPE.md](RECIPE.md)，两者不一致时以英文为准。

Herdr App 的一个安静、近似 T3 Code 的窗口：左侧 268px 侧栏，可在 Spaces + Agents 和带 T3 式 Settle 的 Focus 列表之间切换；窄标签栏；圆角窗格带小标题栏；还有 Agent 模式，用一个铺满的 agent 代替当前标签。全部使用主题自身的颜色，只有 agent 需要你时才醒目。

![Herdr T3](preview.png)

## 你看到什么

从左到右，分隔线 1px `border`：

- **侧栏**（268px，最小 180，最大 480，不能拖动调整，`chrome` 背景），从上到下：
  - **品牌栏**（40px，可拖动窗口，给 macOS 窗口按钮留位置）：右侧两个 26px 按钮：侧栏模式（`circle-check` 图标：显示 Focus；`layers`：显示 Spaces 和 Agents）、隐藏侧栏。
  - **列表**，二选一（stack）：
    - **Spaces + Agents**，1:1 分割（各至少 90px）。Spaces：彩色方形头像带 space 首字母；worktree 折叠在其主 checkout 下，带树线；机器多于一台时按机器分组；名字后面只显示不寻常的 git 信息（`repo · branch ↑2 ↓1`，省略 `main` / `master`）。Agents：按 space 分组或按优先级（排序菜单），置顶的在 `Pinned` 组，子 agent 带树线缩进在父级下；14px 状态标记靠右。
    - **Focus**：T3 侧栏。需要你的 agent 显示为卡片，底部是折叠的 Working 和 Settled 收纳区（见 `mods/t3-focus`；[单独 mod 的 recipe](https://github.com/JinJieBeWater/herdr-t3-focus/blob/main/RECIPE.zh-CN.md) 有完整说明）。
  - **底栏**（41px，上边框）：一行 Settings；App 更新就绪时带一个 6px `accent` 圆点。独立的 `T3` 按钮打开居中的 600×460 设置页，Appearance 下为 Focus border，Behavior 下为 Auto release。
- **工作区**：
  - **标签栏**（40px，可拖动窗口）：当前 space 的标签，28px 胶囊（圆角 6，当前标签 `selected`）：程序图标、名字（没人命名的标签按下面的命名规则显示其中的 agent，没有 agent 就显示当前 pane），工作中显示转圈，blocked 显示 `!` 徽章，done 且未看显示 7px `done` 圆点；当前标签有关闭 `×`。然后是 26px 的视图切换按钮（`square` 图标：只看一个 agent；`layers`：显示标签）和 `+`（打开 `t3-new-menu`）。Agent 模式下胶囊换成一条 agent 栏：程序图标、agent 名（`foreground`）、所在 space（`dim`）、状态标记。Windows 上有窗口按钮。侧栏隐藏时，最左边出现侧栏开关，同时统计 agent：blocked、working、done。
  - **工作主体**（内边距 2/8，间距 8），二选一（stack）：
    - **窗格**，即当前标签：圆角 8，`background` 填充，聚焦的窗格有 2px `accent` 边框（平时的边框也是 2px，颜色同 `background`，所以聚焦时终端不会变尺寸），单个窗格也带框。每个窗格顶部有 28px 标题栏：程序图标、agent 名或终端标题（13px 中粗，聚焦时 `foreground`）、目录、状态标记，以及右分屏、下分屏、缩放/取消缩放、关闭按钮（悬停时出现）。
    - **Agent 模式**：一个 agent 的终端铺满显示，`background` 填充，圆角 8，无标题栏。
  - 底部留 6px；布局里有自带的 `workspace-status` 状态栏，但隐藏。
- **新建菜单**（`t3-new-menu`，520×420 弹层，位于顶部）：先选 space（或 New space），再选在那里启动什么：终端或任一已安装的 agent；`⌘1…` 按编号选 space。

## 它怎么表现

- **名字**，各处（focus 卡片、agents 列表、标签、窗格标题）一条规则，写在 `mods/t3-focus/name.js`，用到它的 mod 各放一份副本：先用 Pi 会话名（`pi.session` 标签）；agent 再看有人命名过的标签名；然后是有意义的终端标题（不是路径、不含 `user@host`、不是程序自己的名字）；最后是程序名。
- **agent 状态**，各处（agents 列表、标签、窗格标题、focus 卡片）标记一致：working：`working` 色转圈；blocked：14px 圆角 `!` 徽章，底色为 15% 不透明的 `blocked`；done：7px `done` 圆点（Focus 里是绿色 `Done`）；idle：agents 列表里是圆环，其余位置不显示。父级显示子 agent 中最紧急的状态；子 agent 的 `error` 视为 blocked。
- **侧栏模式**：品牌栏按钮或 `cmd-shift-b`（`t3-chrome.sidebar`）对 stack `sidebar-lists` 执行 `layout.select`（`lists` / `focus`）。显示 Focus 时，标签栏和侧栏开关的计数里不再显示已 Settle agent 的完成圆点。
- **Spaces**：单击切换，右键打开自带 `menu`，拖动排序；悬停 checkout 的头像时它变成 worktree 的折叠箭头。只在 git 可能变化时读取（新位置、命令或轮次结束、机器重新连上），窗口在前台时另有慢速兜底轮询。
- **Agents**：单击执行 `agent.focus`（标签模式下聚焦那个窗格；Agent 模式下选定显示哪个 agent），Focus 卡片相同；悬停时状态位变成置顶按钮（布局不动）；悬停父级图标可折叠子 agent，折叠后显示淡色数量。你正在看的 done agent 留在 Done 组，直到你离开。
- **Focus / Settle**：悬停已结束的卡片出现 `✓ Settle`；悬停已 Settle 的行出现撤销箭头；有新工作（working、blocked，或 Settle 后又结束过一轮）自动回来。不做自动 Settle。
- **已释放的 Pi**：默认关闭，只有通过 **T3 → Behavior → Auto release** 将共享设置 `t3.auto-release` 明确设为 `true` 才启用新回收。顶层 Pi 的 Settle 满 30 分钟，且整棵树都 idle/done、可接回、未置顶、未显示时，品牌栏可以释放整棵树。先保存每个会话路径，在每个终端窗格旁放 `t3-released`，重读树和轮次，再先结束父、后清理仍存活的子进程。准备期间关掉开关，最终复查会取消释放。卡片、列表、标签保留名字，增加淡色 `Released`。打开保存的标签只自动接回父 agent；子窗格提供手动 Resume。关闭自动回收后，已保存的对话仍能接回。普通空闲不触发释放。
- **标签**：单击选中，双击改名，拖动排序，右键菜单，滚轮切换上/下一个标签（Agent 模式下切换 agent）。
- **支持范围**：Settle 可用于所有 agent；自动回收目前只支持 Pi，默认关闭。Claude Code、Codex 和其他程序不会被自动回收；Pi 树中包含这些程序时，整树也不回收。设置项明确标为 `Auto release (Pi only)`。
- **Agent 模式**：切换按钮或 `cmd-shift-a`（`t3-tabs.view`）对 stack `view` 执行 `layout.select`（`main` / `agent`）。它让键盘停在这个 agent 上，所以会落到看不见的地方的操作都会退回标签模式：当前 space 新出现的 shell 或 mod 窗格（分屏、新标签；随后对它执行 `pane.focus`）、从 `+` 启动的任何东西（`t3-new-menu` 先退出 Agent 模式）、用键盘把焦点移到 shell。新出现的 agent 窗格不抢画面；用键盘把焦点移到 agent 窗格时改为显示那个 agent。
- 置顶、折叠、排序、筛选和收纳区状态按屏幕保存（`localStorage` / 共享状态 `agents.sort`、`space.colors`）。

## 由什么构成

- `layouts/herdr-t3.json`：根为 `row` → `sidebar` 列 [`brand` 块 `t3-chrome`；`sidebar-lists` stack [`lists` 列 [`spaces` `t3-spaces`、`agents` `t3-agents`]、`focus` `t3-focus`，props `{ "newMenu": "t3-new-menu" }`]；`sidebar-footer` `t3-chrome`，props `{ "footer": true }`]，以及 `work` 列 [`tabs` `t3-tabs`；`work-body` 行 [`view` stack，默认 `main` [`main` `{ "tab": "active", "pane": { "header": { "content": { "mod": "t3-pane" } } } }`、`agent` `{ "agent": "focused" }`]]；`work-bottom-inset`；`status` `workspace-status`，隐藏]。预览图：`layouts/herdr-t3.svg`。
- Mods：`t3-chrome`、`t3-spaces`、`t3-agents`、`t3-tabs`、`t3-pane`、`t3-new-menu` 分别改自 Herdr 自带的 `workspace-chrome`、`spaces`、`agents`、`tabs`、`pane`、`new-menu`；`t3-focus` 是新写的。原样使用的自带 mod：`workspace-status`、`picker`、`menu`，以及 `mods/workspace-chrome/` 下的图标和 `mods/pane/close.svg`。
- `keys.json`：`layout:herdr-t3` → `cmd-shift-b`：`t3-chrome.sidebar`，`cmd-shift-a`：`t3-tabs.view`。
- `t3-settings`：使用原生 Switch。Focus border 只在点击时改变最新布局中的焦点颜色；Auto release 将布尔值保存到共享状态。渲染不改布局，也不启用设置。
- 运行的程序：`t3-spaces` 运行只读的 `git status` / `git rev-parse`（不加可选锁、不用 fsmonitor）和 `hc machine ls --json`；`t3-focus` 运行 `hc label <agent> settled=<ms>:<turn>`。
- `t3-chrome/release.js` 每分钟在本布局检查一次，用 `hc ls/get/label/kill/rm` 保存并结束 Pi 树，清理标签关闭后的旧记录。`t3-released` 读取最后的输出，在保存的位置执行 `pane.split {argv:["pi","--session",file]}`。等新 Pi 上报完全相同的 `pi.session_file` 才移除旧 Core 记录和占位；保留 Settle 时间，轮次改用新终端的计数；新 Pi 从自身启动（`created_ms`）起满 30 分钟才会再次被回收。失败时保留恢复信息并提供 Retry。
- `scripts/sync.sh` 将 `mods/t3-focus/released.js` 复制到列表、品牌栏和占位 mod。释放记录保存在共享状态 `t3.released`、占位 props 和 Core 的 `t3.resume`、`t3.released`、`t3.record` 标签中；共享记录保存实际占位 pane id。置顶以机器和 Pi 会话路径识别，接回换地址后仍有效。独立侧栏不运行释放循环。
- 接回前通过 `hc run --rm --no-parent --no-notify --bg --name … -- node -e 'setTimeout(()=>{},60000)'` 占用 Core 唯一的 live 名称 `t3-resume-<旧id>`。竞争失败的客户端等待并复用 replacement 标签，成功的一方在 `finally` 清理占用。按当前屏幕的 space UUID 和 machine 转换保存的 id 后再查询 Core，props 本身不带机器前缀转换。启动中的查询只走一秒定时器，不从 render 发起。

## 注意

- `t3-tabs` 和 `t3-chrome` 用 `find(layout(), "sidebar-lists")` 找 stack；保留节点 id `sidebar`、`sidebar-lists`、`lists`、`focus`。同样，`t3-tabs` 和 `t3-new-menu` 找 `view` 及其子节点 `main`、`agent`；没有它就没有切换按钮。
- 只有品牌栏那份 `t3-chrome` 监听 `nextCommand()`；底栏那份没东西可切换。
- Agent 模式下 Herdr 确实会新建分屏或标签并聚焦过去，但画面停在 Agent 模式，agent 块还会退回显示别的 agent：输入进了一个谁也看不到的窗格。`t3-tabs` 在 `render` 里发现新窗格和焦点变化（它始终在布局里），而不是逐个拦截命令，所以快捷键、命令面板和 `hc` 都一样覆盖。
- 窗口不重绘时（在后台）mod 的 `render` 不会执行：要在窗口位于前台时测试 Agent 模式的退出。
- 碰到 index 的 git 命令会再次唤醒目录监听：始终带上 `--no-optional-locks -c core.fsmonitor=false`。
- Settle 标签大约 0.65 秒后才出现在 `terminals()`：要保留待定值。
- pane mod 的自定义 props 不提供自身 pane id，要保存 `pane.split` 返回的 id。Core 不能原子地检查空闲并结束树，kill 前要复查；余下的短暂间隙仍可能收到新工作。其他布局可以接回占位，但不新释放。自带 agent 列表和外部工具不列出已释放的进程；手动恢复用 `hc get <旧地址> --json` → `t3.resume` → `pi --session <文件>`。
- macOS 无标题栏时，侧栏隐藏或很窄，标签栏要给窗口按钮留位置（`layout().traffic_lights`）。
- `mods/t3-spaces/check-sidebar.cjs` 和 `mods/t3-pane/check-pane.cjs` 用假的 `herdr` 加载 mod；要在已安装的 home 里用 `node` 运行，因为它们在那里找自带图标。

## 完成标准

- 每个 `mods/t3-*` 都通过 `herdr-app check`，`layout.switch {"name": "herdr-t3"}` 显示上面描述的窗口。
- `node mods/t3-spaces/check-sidebar.cjs` 和 `node mods/t3-pane/check-pane.cjs` 输出各自的通过行。
- `cmd-shift-b` 在 Spaces + Agents 和 Focus 之间切换侧栏。
- `cmd-shift-a` 只显示一个 agent；点侧栏卡片就显示那个；在其中分出一个 shell，会退回标签模式并聚焦到这个 shell。
- 在 Focus 里 Settle 一个已结束的 agent，它移入 Settled，标签上的完成圆点消失；再给它发提示，它回来。
- `node mods/t3-chrome/check-release.cjs` 通过。临时 Pi 的 Settle 满 30 分钟后释放，标签仍在；打开后只启动一个保留原对话的父 Pi，子 agent 继续保持已释放。kill 前出现工作中的子、新轮次、新子、置顶、打开标签或切布局，均取消释放。接回启动失败时旧记录保留，可以重试。
- worktree space 折叠显示在它的 checkout 下；远程机器有自己的分组标题。
