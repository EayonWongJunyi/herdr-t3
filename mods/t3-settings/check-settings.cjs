const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function element() {
  const node = { items: [], handlers: {}, style: {} };
  const proxy = new Proxy(node, { get(target, key) {
    if (key in target) return target[key];
    return (...args) => {
      if (key === "when") { if (args[0]) args[1](proxy); }
      else if (key === "child") node.items.push(args[0]);
      else if (key === "children") node.items.push(...args[0]);
      else if (key === "id") node.key = args[0];
      else if (key.startsWith("on_")) node.handlers[key] = args[0];
      else node.style[key] = args[0];
      return proxy;
    };
  } });
  return proxy;
}
function find(n, id) {
  if (n?.key === id || n?.id === id) return n;
  return (n?.items ?? n?.children ?? []).map(c => find(c, id)).find(Boolean);
}
const copy = x => JSON.parse(JSON.stringify(x));
const component = { new: id => element().id(id) };
const cx = { notify() {} };
let root = JSON.parse(fs.readFileSync(path.join(__dirname, "../../layouts/herdr-t3.json"), "utf8"));
const calls = [], overlays = [], closed = [];
const env = {
  View: class {}, div: element, svg: element, h_flex: element, v_flex: element,
  Switch: component, Button: component, props: () => ({ footer: true, overlay: "test-settings" }),
  theme: () => ({}), updates: () => ({ app: { ready: true } }),
  layout: () => copy(root),
  run: (name, args) => { calls.push(name); if (name === "layout.set") root = copy(args.layout); },
  openOverlay: spec => overlays.push(copy(spec)),
  closeOverlay: id => closed.push(id),
};
function load(file) {
  const source = fs.readFileSync(file, "utf8").replace(/^import .*;\r?\n/gm, "")
    .replace("export default class", "globalThis.Mod = class");
  const context = vm.createContext({ ...env });
  vm.runInContext(source, context, { filename: file });
  return new context.Mod();
}
const pane = r => find(r, "main").content.pane;
pane(root).focus.color = "accent";
const original = copy(root);
const settings = load(path.join(__dirname, "main.js"));
assert.equal(find(settings.render(), "focus-border").style.checked, true);
assert.deepEqual(calls, [], "render never writes the layout");
const toggle = enabled => find(settings.render(), "focus-border").handlers.on_change(enabled, cx);
toggle(false);
const expected = copy(original); pane(expected).focus.color = "background";
assert.deepEqual(root, expected, "only the focus color changes");
assert.equal(find(load(path.join(__dirname, "main.js")).render(), "focus-border").style.checked, false);
toggle(false);
assert.deepEqual(calls, ["layout.set"], "same state causes no extra write");
find(root, "sidebar").hidden = true;
toggle(true);
const restored = copy(original); find(restored, "sidebar").hidden = true;
assert.deepEqual(root, restored, "click uses the latest layout and preserves other changes");
assert.equal(pane(root).focus.width, 2);
assert.equal(pane(root).border.width, 2);
assert.equal(pane(root).lone, true);
const footer = load(path.join(__dirname, "../t3-chrome/main.js")).render();
find(footer, "t3-settings").handlers.on_click();
assert.equal(overlays[0].mod, "t3-settings");
assert.equal(overlays[0].kind, "dialog");
assert.deepEqual(calls, ["layout.set", "layout.set"]);
find(footer, "settings").handlers.on_click();
assert.equal(calls.at(-1), "app.settings");
find(settings.render(), "close-settings").handlers.on_click();
assert.deepEqual(closed, ["test-settings"]);
root = { id: "other" };
const count = calls.length;
assert.equal(find(settings.render(), "focus-border").style.disabled, true);
toggle(false);
assert.equal(calls.length, count);
console.log("ok: independent settings buttons; focus border preserves layout; render never writes; stale clicks preserve current layout.");
