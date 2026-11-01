const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function element() {
  const node = { items: [], handlers: {} };
  const proxy = new Proxy(node, { get(target, key) {
    if (key in target) return target[key];
    return (...args) => {
      if (key === "when") { if (args[0]) args[1](proxy); }
      else if (key === "child") node.items.push(args[0]);
      else if (key === "children") node.items.push(...args[0]);
      else if (key === "on_click") node.handlers.click = args[0];
      else if (key === "on_mouse_down") node.handlers[args[0]] = args[1];
      else if (key === "id") node.key = args[0];
      return proxy;
    };
  } });
  return proxy;
}

function find(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.key === id) return node;
  for (const child of node.items) { const found = find(child, id); if (found) return found; }
  return null;
}

const calls = [];
const program = { name: "Pi", agent: true };
const pane = { pane: "p2", tab: "b", cwd: "/home/me/project", program, status: "working" };
let props = { pane: "p2" };
const env = {
  View: class {}, div: element, svg: element, image: element, h_flex: element,
  theme: () => ({}), props: () => props, panes: () => [pane], home: () => "/home/me",
  run: (name, args) => calls.push([name, args]),
};
const cx = { notify() {}, stop_propagation() {} };
function load(file) {
  const src = fs.readFileSync(file, "utf8")
    .replace(/^import .*;\r?\n/gm, "").replace(/export function /g, "function ").replace("export default class", "globalThis.Mod = class");
  const context = vm.createContext({ ...env });
  vm.runInContext(src, context, { filename: file });
  const mod = new context.Mod(); mod.init(); return mod;
}
const take = () => JSON.parse(JSON.stringify(calls.splice(0)));
const header = load(path.join(__dirname, "main.js"));
header.hovered = true;
find(header.render(), "pane-head-p2").handlers.click({}, cx);
assert.deepEqual(take(), [["pane.focus", { pane: "p2" }]]);
find(header.render(), "ph-r-p2").handlers.click({}, cx);
assert.deepEqual(take(), [["pane.split", { direction: "right", pane: "p2" }]]);
find(header.render(), "ph-d-p2").handlers.click({}, cx);
assert.deepEqual(take(), [["pane.split", { direction: "down", pane: "p2" }]]);
find(header.render(), "ph-z-p2").handlers.click({}, cx);
assert.deepEqual(take(), [["pane.zoom", { pane: "p2" }]]);
find(header.render(), "ph-x-p2").handlers.click({}, cx);
assert.deepEqual(take(), [["pane.close", { pane: "p2" }]]);
props = { pane: "missing" };
assert.equal(find(header.render(), "pane-head-p2"), null);
console.log("ok: a lone pane keeps zoom and close; focus, both splits and close target their own pane; a missing pane renders nothing.");
