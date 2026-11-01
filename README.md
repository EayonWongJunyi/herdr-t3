# Herdr T3

English · [中文](README.zh-CN.md)

A [T3 Code](https://github.com/pingdotgg/t3code)-like layout for Herdr App: Spaces + Agents or a Focus sidebar with T3-style Settle, slim tabs, framed panes.

![Herdr T3](preview.png)

Only want the Settle sidebar? It is also published alone: [herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus).

## Install

Ask your Herdr agent to add `herdr.dev/layouts/JinJieBeWater/herdr-t3`. By hand: copy `layouts/herdr-t3.json`, `layouts/herdr-t3.svg` and every `mods/t3-*` into `~/.config/herdr-app/`, merge `keys.json` into yours, then switch with `ctrl-shift-l` (or `layout.switch {"name": "herdr-t3"}`). How it should look and behave: [RECIPE.md](RECIPE.md).

## What it runs

- `t3-spaces`: read-only `git status` / `git rev-parse` in your spaces' folders, watches those repos for changes (`watchFolder`), and `hc machine ls --json`.
- `t3-focus`: `hc label <agent> settled=<ms>:<turn>` when an agent is settled or unsettled.
- `t3-new-menu`: asks Herdr which agents are installed (`knownAgents`).

No network requests.

## Extras (optional)

Not part of the layout and not copied by an install; add them by hand if you want them.

### pulls.review

`extras/mods/pulls-review/` opens the focused pane's repository in [pulls.review](https://github.com/antfu/pulls.review): its uncommitted changes when there are any, else what pulls.review opens by default (the current branch against the default branch).

- **Needs the CLI from [my fork](https://github.com/JinJieBeWater/pulls.review/tree/multi-repo)** (`multi-repo` branch). The mod runs `pulls.review -d --pwa`: `-d` hands the repo to one background server shared by every repo, `--pwa` opens the installed pulls.review app instead of a browser tab. Upstream pulls.review has neither flag.
- Local folders only: a pane on another machine shows an error.
- Install: copy `extras/mods/pulls-review/` into `~/.config/herdr-app/mods/`, then add a key to the `global` section of your `keys.json`: `"cmd-shift-r": "mod.open:pulls-review"`.
- Runs read-only `git status --porcelain` and `pulls.review`.
- This layout's tab bar has no button for it; use the key or the command palette.

### Theme and settings from the preview

`extras/themes/herdr-t3.json` is the dark theme in the screenshot: canvas and chrome `#141418`, accent and working `#6b93ff`, blocked `#f0a33a`. Copy it into `~/.config/herdr-app/themes/`. Named like the layout, it is the layout's own: Settings offers it only while you are in Herdr T3, so pick it there. The rest is in `settings.json`:

```json
{
  "appearance": "dark",
  "font": "Maple Mono NF CN",
  "ui_font": "Maple Mono NF CN",
  "font_size": 12,
  "minimum_contrast": 3
}
```

Herdr doesn't ship [Maple Mono NF CN](https://github.com/subframe7536/maple-font): install it, or leave the font lines out to keep Herdr's JetBrains Mono and Geist.

### Keys I use with it

In the `global` section of `keys.json`, besides the layout's own `cmd-shift-b`:

| Key | Command | Does |
| --- | --- | --- |
| `cmd-]` / `cmd-[` | `agent.next` / `agent.prev` | Walks agents in the Focus cards' order; settled ones come last |
| `cmd-p` | `mod.open:picker` | The same picker as Focus's Search |
| `cmd-shift-r` | `mod.open:pulls-review` | Review the focused repo (needs the extra above) |

## Credits and license

`t3-chrome`, `t3-spaces`, `t3-agents`, `t3-tabs`, `t3-pane`, `t3-new-menu` and the layout start from Herdr App's shipped `workspace-chrome`, `spaces`, `agents`, `tabs`, `pane`, `new-menu` and `main`. Settle follows T3 Code's design. Apache-2.0, as Herdr App.

## More

- [herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus): this layout's Focus sidebar as a standalone mod.
- [herdling](https://github.com/JinJieBeWater/herdling): a macOS menu bar companion for Herdr.
- [pi-stuff](https://github.com/JinJieBeWater/pi-stuff): my Pi extensions and skills.
