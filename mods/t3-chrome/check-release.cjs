const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const now = Date.now();
const root = path.dirname(__dirname);
const read = (mod, file) => fs.readFileSync(path.join(root, mod, file), "utf8");
const source = (s) => s.replace(/^import .*;\r?\n/gm, "").replace(/export (async )?function /g, "$1function ")
  .replace(/export const /g, "const ").replace("export default class", "globalThis.Mod = class");

function fixture(change = () => {}) {
  const calls = [], state = { layout: "herdr-t3" };
  const record = (address, parent = null) => ({ address, parent, state: "live", status: { app: "pi", state: "idle" }, turn: 4,
    keep: address === "parent", labels: { "pi.session_file": `/sessions/${address}.jsonl`, "pi.session": address, settled: `${now - 1800001}:4` } });
  const core = [record("parent"), record("child", "parent"), record("grandchild", "child")];
  const agents = [{ address: "parent", pane: "p0", tab: "b0", space: "s0", title: "Parent", app: "pi" }];
  const panes = [{ pane: "p0", terminal: "parent", tab: "b0" }];
  const shown = { tab: "other", agent: "other" };
  const reply = (value) => ({ code: 0, stdout: JSON.stringify(value), stderr: "" });
  const env = { console, agents: () => agents, terminals: () => core, panes: () => panes,
    spaces: () => [{ id: "s0", tabs: [{ id: "b0" }] }], focused: () => shown,
    shared: (key) => state[key], setShared: (key, value) => { state[key] = value; },
    hc: async (args) => {
      if (args[0] === "run") assert.ok(args.indexOf("--json") < args.indexOf("--"), "Core flags must not become Node arguments");
      args = args.filter((a) => a !== "--json");
      calls.push([...args]);
      if (args[0] === "file") return reply({ text: JSON.stringify({ type: "session", id: args[2], cwd: "/work" }) });
      if (args[0] === "run") {
        const name = args[args.indexOf("--name") + 1];
        if (core.some(k => k.name === name && k.state === "live")) return { code: 1, stdout: JSON.stringify({ error: { kind: "name_taken" } }), stderr: "" };
        const k = { address: `lock-${calls.length}`, name, state: "live", rm: true, labels: {} };
        core.push(k); return reply(k);
      }
      const k = core.find((k) => k.address === args[1]);
      if (!k) return { code: 3, stdout: "", stderr: "not found" };
      if (args[0] === "label") for (const label of args.slice(2).filter((a) => a !== "--json")) {
        const at = label.indexOf("=");
        if (label.slice(at + 1)) k.labels[label.slice(0, at)] = label.slice(at + 1);
        else delete k.labels[label.slice(0, at)];
      }
      if (args[0] === "kill") { k.state = "finished"; delete k.labels["pi.session_file"]; if (k.rm) core.splice(core.indexOf(k), 1); }
      if (args[0] === "rm") core.splice(core.indexOf(k), 1);
      return reply(k);
    },
    exec: async (command, args) => {
      calls.push([command, ...args]);
      if (command === "hc") return reply({ terminals: core });
      if (args[1] === "pane.split") {
        const pane = { pane: `placeholder-${panes.length}`, terminal: null, tab: "b0", mod: "t3-released" };
        panes.push(pane);
        change({ core, state, shown, panes });
        return reply({ pane: pane.pane });
      }
      if (args[1] === "pane.close") {
        const id = JSON.parse(args[2]).pane;
        panes.splice(panes.findIndex((p) => p.pane === id), 1);
      }
      return reply({ ok: true });
    },
  };
  const context = vm.createContext(env);
  vm.runInContext(source(read("t3-focus", "released.js") + "\n" + read("t3-chrome", "release.js")) + "\nglobalThis.api = { eligible, releaseTree, pinKey };", context);
  return { core, state, calls, shown, panes, agents, env, api: context.api };
}

async function releaseChecks() {
  const fresh = () => fixture();
  for (const [label, mutate] of [
    ["29 minutes", (f) => { f.core[0].labels.settled = `${now - 29 * 60000}:4`; }],
    ["new turn", (f) => { f.core[0].turn++; }],
    ["working child", (f) => { f.core[1].status.state = "working"; }],
    ["blocked grandchild", (f) => { f.core[2].status.state = "error"; }],
    ["unreported child", (f) => { f.core[1].status = null; }],
    ["another program", (f) => { f.core[1].status.app = "codex"; }],
    ["auto-removed child record", (f) => { f.core[1].rm = true; }],
    ["missing child session", (f) => { delete f.core[1].labels["pi.session_file"]; }],
    ["shown tab", (f) => { f.shown.tab = "b0"; }],
    ["shown agent", (f) => { f.shown.agent = "parent"; }],
    ["pinned session", (f) => { f.state["t3.pins"] = ["/sessions/parent.jsonl"]; }],
    ["pinned old address", (f) => { f.state["t3.pins"] = ["parent"]; }],
    ["other layout", (f) => { f.state.layout = "main"; }],
    ["bad settle label", (f) => { f.core[0].labels.settled = "0:4:extra"; }],
  ]) {
    const f = fresh(); mutate(f);
    assert.equal(f.api.eligible(f.core, now, []), false, label);
  }
  {
    const f = fresh();
    f.core[0].labels.settled = `${now - 1800000}:4`;
    assert.equal(f.api.eligible(f.core, now, []), true, "30 minutes exactly");
    f.core[0].address = "vps/parent";
    assert.equal(f.api.pinKey(f.core[0]), "vps:/sessions/parent.jsonl", "machine scopes stable pins");
  }
  for (const [label, change] of [
    ["new work", ({ core }) => { core[1].status.state = "working"; }],
    ["new turn", ({ core }) => { core[0].turn++; }],
    ["unsettled", ({ core }) => { delete core[0].labels.settled; }],
    ["opened", ({ shown }) => { shown.tab = "b0"; }],
    ["pinned", ({ state }) => { state["t3.pins"] = ["/sessions/parent.jsonl"]; }],
    ["layout switch", ({ state }) => { state.layout = "main"; }],
    ["new child", ({ core }) => { core.push({ ...core[1], address: "new-child" }); }],
  ]) {
    const f = fixture(change);
    await f.api.releaseTree("parent", null, []);
    assert.equal(f.calls.some((c) => c[0] === "kill"), false, `${label} before kill cancels release`);
    assert.equal(f.panes.length, 1, `${label} keeps original pane only`);
    assert.equal(Object.keys(f.state["t3.released"] ?? {}).length, 0, label);
    assert.equal(f.state["t3.releasing"], null, label);
  }
  {
    const f = fresh();
    await f.api.releaseTree("parent", null, []);
    assert.deepEqual(f.calls.filter((c) => c[0] === "kill").map((c) => c[1]), ["parent", "child", "grandchild"]);
    assert.equal(f.panes.filter((p) => p.mod === "t3-released").length, 1);
    assert.equal(f.state["t3.released"].parent.resume, "/sessions/parent.jsonl");
    assert.equal(f.state["t3.released"].child.pane, null, "pane-less children remain recoverable without new panes");
    for (const k of f.core) assert.equal(k.labels["t3.resume"], `/sessions/${k.address}.jsonl`);
    const firstKill = f.calls.findIndex((c) => c[0] === "kill");
    assert.equal(f.calls.slice(0, firstKill).filter((c) => c[0] === "label" && c.some((v) => v.startsWith("t3.resume="))).length, 3, "all resume paths saved before first kill");
  }
  for (const kind of ["live", "missing", "finished"]) {
    const f = fresh();
    f.core[0].parent = "old-parent";
    if (kind !== "missing") f.core.push({ address: "old-parent", state: kind });
    await f.api.releaseTree("parent", null, []);
    assert.equal(f.calls.some((c) => c[0] === "kill"), kind === "finished", `${kind} historical parent`);
  }
}

async function resumeChecks() {
  const f = fixture();
  await f.api.releaseTree("parent", null, []);
  const original = f.state["t3.released"].parent;
  const jobs = [], closed = [];
  const cx = { notify() {}, timer: { every() {} }, spawn(fn) { jobs.push(fn(cx)); } };
  const flush = async () => { while (jobs.length) await Promise.all(jobs.splice(0)); };
  const program = source(read("t3-focus", "released.js") + "\n" + read("t3-released", "main.js"));
  const context = vm.createContext({ ...f.env, View: class {}, run: (name, args) => closed.push([name, args]),
    props: () => ({ record: original, pane: original.pane }),
    exec: async () => {
      f.core.push({ address: "new", state: "live", labels: {}, turn: 0 });
      return { code: 0, stdout: JSON.stringify({ terminal: "new" }), stderr: "" };
    },
  });
  vm.runInContext(program, context);
  const mod = new context.Mod(); mod.init({}, cx); await flush();
  mod.resume(cx); await flush();
  assert.equal(f.core.some((k) => k.address === "parent"), true, "startup keeps old record");
  assert.equal(closed.length, 0, "startup keeps placeholder");
  const next = f.core.find((k) => k.address === "new");
  next.state = "finished";
  mod.resume(cx); await flush();
  assert.ok(mod.error, "early Pi exit is visible");
  assert.equal(original.replacement, undefined, "early exit permits a fresh retry");
  assert.equal(f.core.find((k) => k.address === "parent").labels["t3.replacement"], undefined);
  f.core.splice(f.core.indexOf(next), 1);
  mod.resume(cx); await flush();
  f.state["t3.released"].parent.settled = "";
  f.core.find((k) => k.address === "new").labels["pi.session_file"] = original.resume;
  mod.resume(cx); await flush();
  assert.equal(mod.finished, true);
  assert.equal(f.core.some((k) => k.address === "parent"), false, "only a ready replacement permits old rm");
  assert.equal(f.core.find((k) => k.address === "new").labels.settled, undefined, "Unsettle during resume survives");
  assert.deepEqual(closed.map(([name]) => name), ["pane.close"]);
  assert.equal(f.state["t3.released"].parent, undefined);
  assert.ok(f.state["t3.released"].child, "parent resume doesn't discard child sessions");
  {
    const f = fixture(); await f.api.releaseTree("parent", null, []);
    const r = f.state["t3.released"].parent;
    const context = vm.createContext({ ...f.env, View: class {}, run() {}, props: () => ({ record: r }),
      exec: async () => {
        f.core.push({ address: "reset-turn", state: "live", turn: 0, labels: { "pi.session_file": r.resume } });
        return { code: 0, stdout: JSON.stringify({ terminal: "reset-turn" }) };
      },
    });
    vm.runInContext(program, context);
    const mod = new context.Mod(); mod.init({}, cx); await flush(); mod.resume(cx); await flush();
    assert.equal(f.core.find((k) => k.address === "reset-turn").labels.settled, `${r.settled.split(":")[0]}:0`, "Settle uses the replacement's counter, so its next turn brings it back");
  }
}

async function clientChecks() {
  const program = source(read("t3-focus", "released.js") + "\n" + read("t3-released", "main.js"));
  function client(f, original, screen, remote = false) {
    const jobs = [], state = {}, requests = [], launches = [];
    const cx = { notify() {}, timer: { every() {} }, spawn(fn) { jobs.push(fn(cx)); } };
    const element = new Proxy({}, { get: () => () => element });
    const env = { ...f.env, View: class {}, div: () => element, v_flex: () => element, h_flex: () => element, theme: () => ({}), run() {},
      props: () => ({ record: structuredClone(original) }),
      shared: key => structuredClone(state[key]), setShared: (key, value) => { state[key] = structuredClone(value); },
      hc: async args => { args = args.filter(a => a !== "--json"); requests.push([...args]); return f.env.hc(remote && ["get", "read", "label", "kill", "rm"].includes(args[0]) ? [args[0], args[1].replace(/^source\//, ""), ...args.slice(2)] : args); },
      exec: async (_command, args) => {
        launches.push(JSON.parse(args[2]));
        const address = `${screen}-${launches.length}`;
        f.core.push({ address, state: "live", turn: 0, labels: {} });
        return { code: 0, stdout: JSON.stringify({ terminal: remote ? `source/${address}` : address }), stderr: "" };
      },
    };
    if (remote) {
      env.spaces = () => [{ id: "source/s0", machine: "source", name: "Source", tabs: [{ id: "source/b0" }] }];
      env.panes = () => [{ pane: `source/${original.pane}`, tab: "source/b0", terminal: null, mod: "t3-released" }];
      env.terminals = () => f.core.map(k => ({ ...k, address: `source/${k.address}` }));
      env.focused = () => ({ tab: "source/b0" });
    }
    const context = vm.createContext(env); vm.runInContext(program, context);
    const mod = new context.Mod(); mod.init({}, cx);
    return { mod, cx, requests, launches, flush: async () => { while (jobs.length) await Promise.all(jobs.splice(0)); } };
  }
  {
    const f = fixture(); await f.api.releaseTree("parent", null, []);
    const original = structuredClone(f.state["t3.released"].parent);
    const a = client(f, original, "A"), b = client(f, original, "B");
    await Promise.all([a.flush(), b.flush()]);
    a.mod.resume(a.cx); b.mod.resume(b.cx);
    await Promise.all([a.flush(), b.flush()]);
    assert.equal(a.launches.length + b.launches.length, 1, "independent screens share a Core-unique resume claim");
    b.mod.resume(b.cx); await b.flush();
    assert.equal(a.launches.length + b.launches.length, 1, "the other screen reuses the saved replacement");
    const queried = a.requests.length;
    for (let i = 0; i < 6; i++) a.mod.render(a.cx);
    await a.flush();
    assert.equal(a.requests.length, queried, "repainting doesn't bypass one-second startup polling");
    assert.equal(f.core.some(k => k.name?.startsWith("t3-resume-") && k.state === "live"), false, "resume claims are cleaned up");
  }
  {
    const f = fixture(); await f.api.releaseTree("parent", null, []);
    const original = structuredClone(f.state["t3.released"].parent);
    const c = client(f, original, "remote", true); await c.flush();
    c.mod.check(c.cx); await c.flush();
    assert.equal(c.launches.length, 1, "unmodified props reconnect on a remote screen");
    assert.equal(c.launches[0].pane, `source/${original.pane}`);
    assert.ok(c.requests.some(args => args[0] === "get" && args[1] === "source/parent"));
    assert.equal(c.requests.some(args => args[0] === "get" && args[1] === "parent"), false, "never query a same-numbered local terminal");
    assert.equal(c.mod.record.replacement, "source/remote-1");
  }
}

(async () => {
  await releaseChecks(); await resumeChecks(); await clientChecks();
  console.log("ok: 30-minute/tree safety, recheck races, parent-first kills, saved paths, failed/ready resume, independent clients, remote addresses and timed polling.");
})().catch((e) => { console.error(e); process.exit(1); });
