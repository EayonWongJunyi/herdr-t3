import { agents, terminals, panes, spaces, machines, focused, shared, setShared, hc, exec, appHome, readTextFile, notify } from "herdr";
import { releaseRecords, saveReleaseRecords, pinKey } from "./released.js";

const DELAY = 30 * 60000;
const quiet = (k) => ["idle", "done"].includes(k.status?.state ?? k.status);
const qualify = (id, machine) => id && machine && !id.includes("/") ? `${machine}/${id}` : id;

async function core(args) {
  const r = await hc([args[0], "--json", ...args.slice(1)]);
  if (r.code !== 0) throw Object.assign(new Error(r.stderr.trim() || r.stdout.trim()), { missing: r.code === 3 });
  return JSON.parse(r.stdout);
}

async function app(name, args) {
  const r = await exec("herdr-app", ["do", name, JSON.stringify(args)]);
  if (r.code !== 0) throw new Error(r.stderr.trim() || r.stdout.trim());
  const result = JSON.parse(r.stdout);
  if (result.error) throw new Error(result.error);
  return result;
}

// Read the whole tree again: a newly spawned child must also prevent release.
async function snapshot(address, machine) {
  const r = await exec("hc", ["ls", "--all", "--json"], { on: machine });
  if (r.code !== 0) throw new Error(r.stderr.trim());
  const all = JSON.parse(r.stdout).terminals.map((k) => ({ ...k,
    address: qualify(k.address, machine), parent: qualify(k.parent, machine) }));
  const root = all.find((k) => k.address === address && k.state === "live");
  if (!root || (root.parent && all.find((k) => k.address === root.parent)?.state !== "finished")) return [];
  const tree = (k, seen = new Set()) => {
    if (seen.has(k.address)) throw new Error("Cyclic terminal tree");
    seen.add(k.address);
    return [k, ...all.filter((c) => c.parent === k.address && c.state === "live").flatMap((c) => tree(c, seen))];
  };
  const result = [];
  for (const k of tree(root)) result.push({ ...await core(["get", k.address]), address: k.address });
  return result;
}

export function eligible(tree, now, pins) {
  const root = tree[0];
  if (shared("t3.auto-release") !== true || shared("layout") !== "herdr-t3") return false;
  pins = shared("t3.pins") ?? pins;
  if (!root || tree.some((k) => k.state !== "live" || k.rm || k.status?.app !== "pi" || !quiet(k) || !k.labels?.["pi.session_file"] || pins.includes(pinKey(k)) || pins.includes(k.address))) return false;
  const settled = (root.labels?.settled ?? "").split(":").map(Number);
  if (settled.length !== 2 || !settled.every(Number.isFinite) || settled[0] <= 0 || now - settled[0] < DELAY || root.turn !== settled[1]) return false;
  // A reconnected Pi keeps its old Settle time; give it the same 30 minutes before releasing it again.
  if (now - (root.created_ms ?? 0) < DELAY) return false;
  const shown = focused();
  const ids = new Set(tree.map((k) => k.address));
  if (ids.has(shown?.agent) || ids.has(shown?.terminal) || ids.has(shown?.shown)) return false;
  const tabs = new Set(panes().filter((p) => ids.has(p.terminal)).map((p) => p.tab));
  return !tabs.has(shown?.tab) && tree.every((k) => {
    const ps = panes().filter((p) => p.terminal === k.address);
    return !ps.some((p) => p.focused) && (!k.keep || ps.length > 0);
  });
}

const stamp = (tree) => JSON.stringify(tree.map((k) => [k.address, k.turn, k.labels?.settled, k.labels?.["pi.session_file"]]));

export async function releaseTree(address, machine, pins) {
  if (shared("t3.auto-release") !== true) return;
  const before = await snapshot(address, machine);
  if (!eligible(before, Date.now(), pins)) return;
  const visible = agents(), ps = panes(), records = [], placeholders = [];
  // Save recoverable metadata before doing anything that can end a process.
  for (const k of before) {
    const header = await core(["file", "read", k.labels["pi.session_file"], "--limit", "1", ...(machine ? ["--on", machine] : [])]);
    const session = JSON.parse(header.text);
    if (session.type !== "session" || !session.id || !session.cwd) throw new Error(`No readable Pi session for ${k.address}`);
    const a = visible.find((a) => a.address === k.address);
    const p = ps.find((p) => p.terminal === k.address);
    if (p && !a) return;
    const root = visible.find((a) => a.address === address);
    records.push({ ...root, ...a, address: k.address, pane: p?.pane ?? null, root: address, machine, turn: k.turn,
      resume: k.labels["pi.session_file"], session_name: k.labels["pi.session"],
      settled: k.labels.settled ?? "", labels: k.labels, released_at: Date.now() });
  }
  if (!records.some((r) => r.address === address)) return;
  if (Date.now() - (shared("t3.releasing")?.at ?? 0) < 5 * 60000) return;
  setShared("t3.releasing", { root: address, at: Date.now() });
  try {
    for (const k of before) {
      const record = records.find((r) => r.address === k.address);
      await core(["label", k.address, `t3.resume=${k.labels["pi.session_file"]}`, `t3.released=${Date.now()}`,
        ...(record ? [`t3.record=${JSON.stringify(record)}`] : [])]);
    }
    for (const r of records.filter((r) => r.pane)) {
      const made = await app("pane.split", { direction: "right", pane: r.pane, mod: "t3-released", props: { record: r } });
      if (!made.pane) throw new Error("The release placeholder was not created");
      placeholders.push(made.pane);
      r.pane = made.pane;
      await core(["label", r.address, `t3.record=${JSON.stringify(r)}`]);
    }
    const after = await snapshot(address, machine);
    if (!eligible(after, Date.now(), pins) || stamp(before) !== stamp(after)) return;
    saveReleaseRecords({ ...releaseRecords(), ...Object.fromEntries(records.map((r) => [r.address, r])) });
    // shortcut: core has no atomic idle-and-kill command; recheck directly before the first kill.
    await core(["kill", address]);
    for (const k of before.slice(1)) {
      const current = await core(["get", k.address]);
      if (current.state === "finished") continue;
      if (!quiet(current) || current.turn !== k.turn) throw new Error(`Sub-agent ${k.address} became active; left running`);
      await core(["kill", k.address]);
    }
  } finally {
    try {
      for (const k of before) {
        // A failed kill can still have ended a terminal; keep its placeholder until confirmed live.
        const current = await core(["get", k.address]);
        if (current.state !== "live") continue;
        const r = records.find((r) => r.address === k.address);
        if (r && placeholders.includes(r.pane)) await app("pane.close", { pane: r.pane });
        const kept = { ...releaseRecords() }; delete kept[k.address]; saveReleaseRecords(kept);
        await core(["label", k.address, "t3.released=", "t3.record="]);
      }
    } finally { setShared("t3.releasing", null); }
  }
}

export async function sweep() {
  if (shared("layout") !== "herdr-t3" || Date.now() - (shared("t3.releasing")?.at ?? 0) < 5 * 60000) return;
  const ready = new Set(machines().filter((m) => m.layout === "ready").map((m) => m.name));
  const tabs = new Set(spaces().flatMap((s) => s.tabs.map((c) => c.id)));
  for (const r of Object.values(releaseRecords())) {
    const p = panes().find((p) => p.pane === r.pane);
    if (p && p.tab !== r.tab) {
      const s = spaces().find((s) => s.tabs.some((c) => c.id === p.tab));
      if (s) saveReleaseRecords({ ...releaseRecords(), [r.address]: { ...r, tab: p.tab, space: s.id, space_name: s.name } });
      continue;
    }
    if (!ready.has(r.machine) || (tabs.has(r.tab) && (!r.pane || p))) continue;
    try {
      const old = await core(["get", r.address]).catch((e) => { if (e.missing) return null; throw e; });
      if (old?.state === "finished") await core(["rm", r.address]);
      const kept = { ...releaseRecords() }; delete kept[r.address]; saveReleaseRecords(kept);
    } catch (e) { console.log(`T3 release cleanup: ${e}`); }
  }
  if (shared("t3.auto-release") !== true) return;
  // Pin state predates the shared release state; read its native store until the list publishes it.
  let pins = shared("t3.pins");
  if (!pins) {
    const text = await readTextFile(`${appHome()}/data/t3-agents/store.json`);
    pins = JSON.parse(JSON.parse(text ?? "{}").pins ?? "[]");
  }
  for (const a of agents()) {
    const k = terminals().find((k) => k.address === a.address);
    // Cheap local check first: the full tree read below costs several Core calls per agent.
    if (!(Date.now() - Number(k?.labels?.settled?.split(":")[0]) >= DELAY)) continue;
    const machine = spaces().find((s) => s.id === a.space)?.machine ?? null;
    try { await releaseTree(a.address, machine, pins); }
    catch (e) { notify({ title: "Couldn't release the agent", body: String(e), level: "error" }); }
  }
}
