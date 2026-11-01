#!/bin/sh
# After editing this repo: copy t3-focus to the standalone herdr-t3-focus repo and the layout to the local Herdr App.
# Real copies, not symlinks: Herdr App doesn't load a mod's own SVGs through a symlink.
set -eu
src=$(cd "$(dirname "$0")/.." && pwd)
focus=${HERDR_T3_FOCUS:-$src/../herdr-t3-focus}
app=${HERDR_APP_HOME:-$HOME/.config/herdr-app}
gen="--exclude gpui-kit.d.ts --exclude jsconfig.json"

# mod.json stays per repo: here the layout places it ("none"), alone it docks left.
rsync -a --delete $gen --exclude mod.json "$src/mods/t3-focus/" "$focus/mods/t3-focus/"
rsync -a --delete $gen --include 't3-*/***' --exclude '*' "$src/mods/" "$app/mods/"
cp "$src"/layouts/t3.* "$app/layouts/"
