const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function fixture(options = {}, state = {}) {
  const calls = [], notices = [], closed = [], tasks = [], buttons = new Map();
  const focused = { pane: "p0", cwd: "/fallback", ...options.focused };
  const space = { active: true, folder: "/space", ...options.space };
  const props = { overlay: "review-overlay", configure: options.configure };
  function node() {
    const target = { children: [] };
    const proxy = new Proxy(target, { get(object, key) {
      if (key in object) return object[key];
      return (...args) => {
        if (key === "child") object.children.push(args[0]);
        else object[key] = args[0];
        return proxy;
      };
    } });
    return proxy;
  }
  const context = vm.createContext({
    View: class {}, div: node, h_flex: node, v_flex: node,
    Button: { new(id) { const button = node(); buttons.set(id, button); return button; } },
    spaces: () => [space], panes: () => [{ pane: "p0", cwd: options.cwd ?? "/repo" }], focused: () => focused,
    shared: key => state[key], setShared: (key, value) => { state[key] = value; },
    props: () => props, theme: () => ({}), closeOverlay: id => closed.push(id), notify: n => notices.push(n),
    exec: async (cmd, args, config) => {
      calls.push(JSON.parse(JSON.stringify({ cmd, args, ...config })));
      if (cmd === "git") return { code: options.gitCode ?? 0, stdout: options.dirty ? " M file" : "" };
      if (options.error) throw new Error(options.error);
      return { code: options.launchCode ?? 0, stderr: "launch error", stdout: "" };
    },
  });
  const source = fs.readFileSync(path.join(__dirname, "main.js"), "utf8")
    .replace(/^import .*;\r?\n/gm, "").replace("export default class", "globalThis.Mod = class");
  vm.runInContext(source, context);
  const mod = new context.Mod();
  mod.init(props, { spawn: task => tasks.push(task()) });
  return { mod, calls, notices, closed, buttons, state, done: () => Promise.all(tasks) };
}

(async () => {
  for (const [state, dirty, expected] of [
    [{}, false, ["-d"]],
    [{}, true, ["-d", "--worktree"]],
    [{ "pulls-review.pwa": true }, true, ["-d", "--pwa", "--worktree"]],
  ]) {
    const f = fixture({ dirty }, state); await f.done();
    assert.deepEqual(f.calls[1], { cmd: "pulls.review", args: expected, cwd: "/repo" });
    assert.deepEqual(f.closed, ["review-overlay"]);
    assert.equal(f.notices.length, 0);
  }
  const state = {};
  for (const pwa of [true, false]) {
    const settings = fixture({ configure: true }, state);
    settings.mod.render();
    assert.equal(settings.calls.length, 0, "opening settings never starts a review");
    settings.buttons.get(pwa ? "open-pwa" : "open-browser").on_click();
    assert.equal(state["pulls-review.pwa"], pwa);
    assert.deepEqual(settings.closed, ["review-overlay"]);
    const launch = fixture({}, state); await launch.done();
    assert.equal(launch.calls[1].args.includes("--pwa"), pwa, "the next launch uses the saved preference");
  }
  for (const options of [{ space: { machine: "vps" } }, { gitCode: 128 }]) {
    const f = fixture(options); await f.done();
    assert.ok(!f.calls.some(c => c.cmd === "pulls.review"));
    assert.equal(f.notices[0].level, "error");
    assert.deepEqual(f.closed, ["review-overlay"]);
  }
  for (const options of [{ error: "CLI not installed" }, { launchCode: 1 }]) {
    const f = fixture(options); await f.done();
    assert.equal(f.notices[0].level, "error");
    assert.deepEqual(f.closed, ["review-overlay"]);
  }
  const local = fixture({ space: { machine: "vps" }, focused: { pane: null, terminal: "t0", cwd: "/block" } });
  await local.done();
  assert.equal(local.calls[1].cwd, "/block", "a local layout terminal keeps its own location");
  console.log("ok: browser default, PWA preference shared by all launchers, dirty worktree, local/git validation, launch failures.");
})().catch(error => { console.error(error); process.exitCode = 1; });
