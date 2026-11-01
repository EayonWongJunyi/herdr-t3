# Herdr T3

English · [中文](README.zh-CN.md)

A [T3 Code](https://github.com/pingdotgg/t3code)-like layout for Herdr App: Spaces + Agents or a Focus sidebar with T3-style Settle, slim tabs, framed panes, and an agent view that shows one agent at a time.

![Herdr T3](preview.png)

Only want the Settle sidebar? It is also published alone: [herdr-t3-focus](https://github.com/JinJieBeWater/herdr-t3-focus).

## Features

- **Two sidebars, one key apart** (`cmd-shift-b`): Spaces + Agents, or Focus.
  - Spaces: repo, branch and ahead/behind only when they're unusual; worktrees folded under their checkout; grouped by machine once there's more than one.
  - Agents: grouped by space or by priority, pins, sub-agents nested under their parent.
  - Focus: T3-style Settle. Agents that need you stay up top as cards; finished ones are settled by hand into a quiet list and come back on new work. Busy agents fold into a Working shelf.
- **Release settled Pi processes** (off by default): enable **T3 → Behavior → Auto release**. After 30 minutes in Settle, a hidden, unpinned Pi and its idle sub-agents can stop running. Their sessions and any pane positions are saved. Opening the tab reconnects the parent; sub-agents have a manual Resume button.
- **Agent view** (`cmd-shift-a`, or the button left of `+`): the work area shows one agent full size instead of the active tab, and clicking in the sidebar picks which. The tab bar turns into a bar naming that agent; the scroll wheel walks agents. Anything that would land out of sight brings the tabs back: a new shell or split in this space (focused), starting something from `+`, moving focus to a shell. A new agent pane (often an agent starting another) doesn't take the view; it shows up in the sidebar.
- **One name everywhere**: Focus cards, the agents list, tabs and pane headers name a terminal the same way: its Pi session, then a tab you named, then a telling terminal title, else the program. Two Pis in one tab read as their own sessions.
- **The same status marks everywhere**: a spinner while working, `!` when blocked, a dot when done. While Focus shows, a settled agent's done dot leaves the tabs and pane headers too.
- **Slim tabs, framed panes**: 28px pill tabs; rounded panes with a 28px header (name, folder, status; split, zoom and close on hover).
- **New menu** (`+`): pick a space (or a new one), then a terminal or any installed agent.

## Install

Ask your Herdr agent to add `herdr.dev/layouts/JinJieBeWater/herdr-t3`. By hand: copy `layouts/herdr-t3.json`, `layouts/herdr-t3.svg` and every `mods/t3-*` into `~/.config/herdr-app/`, merge `keys.json` into yours. How it should look and behave: [RECIPE.md](RECIPE.md).

## Quick start

- **Sidebar**: the button at the top right of the sidebar (or `cmd-shift-b`) switches between Spaces + Agents and Focus; the one next to it hides the sidebar.
- **T3 settings**: the footer's `T3` button opens Focus border and Auto release settings. Auto release is off until you turn it on; turning it off stops new releases and keeps saved conversations reconnectable.
- **Focus**: hover a finished card and click `✓ Settle` to put it away; new work brings it back, or click the undo arrow on its row.
- **Released**: a dim `Released` label means the process has stopped. Click its card or tab to reconnect. Unsettle changes its place in the list; it reconnects when you open it. Working, blocked, pinned and visible conversations are kept running. Release runs only in this layout and only after you explicitly Settle; ordinary idle time does not count.
- **Agent view**: the button left of `+` (or `cmd-shift-a`) shows one agent full size; click a card to change which. A new shell, split or anything from `+` brings the tabs back.

## Update

Herdr doesn't update mods or layouts from others, and adding this again would install a renamed second copy (`t3-focus-2`), since an install never overwrites. Update by overwriting instead:

- Tell your Herdr agent: "Update Herdr T3 from github.com/JinJieBeWater/herdr-t3: overwrite my installed `mods/t3-*` and `layouts/herdr-t3.*` with the repo's latest, then run `herdr-app check` on each mod." If the first install renamed something because of a clash, overwrite under that name.
- By hand: copy the same files over the old ones. Mods reload by themselves on save; no restart.
- Kept: pins, folds, sort, the Settled shelf and settled agents. They live in `data/`, `shared.json` and terminal labels, not in the mod folders. Lost: your own edits to the overwritten files.
- `keys.json` and the extras stay as they are; compare them with the repo only if the commit log mentions them. Commits marked `!` rename things (for example `refactor!: rename the layout and theme to herdr-t3`); follow what they rename.

## What it runs

- `t3-spaces`: read-only `git status` / `git rev-parse` in your spaces' folders, watches those repos for changes (`watchFolder`), and `hc machine ls --json`.
- `t3-focus`: `hc label <agent> settled=<ms>:<turn>` when an agent is settled or unsettled.
- `t3-chrome`: checks once a minute; uses `hc ls/get/label/kill` to release eligible Pi trees, and `hc rm` to remove released records whose tabs were closed. It checks the whole tree again before ending the parent, then ends surviving children.
- `t3-released`: keeps the pane and last terminal output (`hc read`); starts `pi --session <saved-file>` when opened, and removes the old core record only after Pi reports that exact session. A short-lived Node.js process holds a Core-unique name during reconnection, so two clients cannot launch the same saved Pi at once; it is removed on completion and expires after a minute if the client exits. An error keeps the saved session and a Retry button. Launching Pi also loads your normal Pi extensions and settings.
- `t3-new-menu`: asks Herdr which agents are installed (`knownAgents`).
- `t3-tabs`: reads the optional pulls.review mod's metadata and watches the mods folder for its installation or removal.

No network requests.

## Recovering a released conversation

Released panes reconnect in other layouts too. Herdr's shipped agent list, `hc ls` and external tools show only live agents; the saved tab remains available.

Before uninstalling the layout, open the conversations you want to keep running. To recover without the mod, run `hc get <old-address> --json`, find the `t3.resume` label and start `pi --session '<saved-file>'`. Pane-less children also keep this label. Automatic release supports Pi only. Core cannot check idle state and end a process in one atomic operation, so a message can still arrive in the short gap after the final check.

## Extras (optional)

Not part of the layout and not copied by an install; add them by hand if you want them.

### pulls.review

`extras/mods/pulls-review/` opens the focused pane's repository in [pulls.review](https://github.com/antfu/pulls.review): its uncommitted changes when there are any, else what pulls.review opens by default (the current branch against the default branch).

- **Needs the CLI from [my fork](https://github.com/JinJieBeWater/pulls.review/tree/multi-repo)** (`multi-repo` branch). The mod runs `pulls.review -d`: `-d` hands the repo to one background server shared by every repo. Upstream pulls.review has no daemon mode.
- Local folders only: a pane on another machine shows an error.
- Install: copy `extras/mods/pulls-review/` into `~/.config/herdr-app/mods/`. A review button appears beside `+`; removing the extension hides it again. No restart needed.
- Reviews open in your browser by default. Use the button's small arrow to choose **Browser** or **Installed app (PWA)**. Install the app before choosing PWA; that option adds `--pwa`. The choice is remembered for both the button and the keyboard shortcut.
- Optional shortcut: add `"cmd-shift-r": "mod.open:pulls-review"` to `global` in `keys.json`.
- Runs read-only `git status --porcelain` and `pulls.review`.

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

In the `global` section of `keys.json`, besides the layout's own `cmd-shift-b` and `cmd-shift-a`:

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
