# Herdr T3

[English](README.md) · 中文

给 Herdr App 用的 [T3 Code](https://github.com/pingdotgg/t3code) 风格布局。侧栏可以在 Spaces + Agents 和带 T3 式 Settle 的 Focus 列表之间切换，另有窄标签栏和带圆角边框的窗格。

![Herdr T3](preview.png)

只想要 Settle 侧栏？它也单独发布了一份：[herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus)。

## 安装

让你的 Herdr agent 添加 `herdr.dev/layouts/JinJieBeWater/herdr-t3`。手动安装：把 `layouts/t3.json`、`layouts/t3.svg` 和所有 `mods/t3-*` 复制进 `~/.config/herdr-app/`，把 `keys.json` 合并进你自己的，然后按 `ctrl-shift-l` 切换（或运行 `layout.switch {"name": "t3"}`）。外观和行为见 [RECIPE.zh-CN.md](RECIPE.zh-CN.md)。

## 它会运行什么

- `t3-spaces`：在各 space 的目录里运行只读的 `git status` / `git rev-parse`，监听这些仓库的变化（`watchFolder`），运行 `hc machine ls --json`。
- `t3-focus`：Settle 或取消 Settle 时运行 `hc label <agent> settled=<ms>:<turn>`。
- `t3-new-menu`：向 Herdr 查询装了哪些 agent（`knownAgents`）。

不发网络请求。

## 致谢与许可证

`t3-chrome`、`t3-spaces`、`t3-agents`、`t3-tabs`、`t3-pane`、`t3-new-menu` 和布局本身，分别基于 Herdr App 自带的 `workspace-chrome`、`spaces`、`agents`、`tabs`、`pane`、`new-menu` 和 `main` 修改。Settle 参照 T3 Code 的设计。许可证与 Herdr App 相同，为 Apache-2.0。

## 更多

- [herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus)：本布局的 Focus 侧栏，单独作为 mod 发布。
- [herdling](https://github.com/JinJieBeWater/herdling)：Herdr 的 macOS 菜单栏伴侣。
- [pi-stuff](https://github.com/JinJieBeWater/pi-stuff)：我写的 Pi 扩展和 Skills。
