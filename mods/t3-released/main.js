import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { props, panes, terminals, focused, theme, run, hc, exec, shared, setShared } from "herdr";
import { releaseRecords, saveReleaseRecords, releaseBusy, localizeRecord } from "./released.js";

async function core(args) {
  const r = await hc([args[0], "--json", ...args.slice(1)]);
  if (r.code !== 0) {
    let kind;
    try { kind = JSON.parse(r.stdout || r.stderr).error?.kind; } catch {}
    throw Object.assign(new Error(r.stderr.trim() || r.stdout.trim()), { missing: r.code === 3 || kind === "not_found", busy: kind === "name_taken" });
  }
  return JSON.parse(r.stdout);
}

export default class Released extends View {
  init(_props, cx) {
    if (!props()?.record) return;
    this.error = null;
    this.starting = false;
    this.finished = false;
    this.preview = "";
    this.hydrate(cx);
    cx.timer.every(1000, (cx) => { if (!this.record) this.hydrate(cx); else this.check(cx); });
  }

  hydrate(cx) {
    const original = localizeRecord(props().record);
    if (!original) return;
    const cached = releaseRecords()[original.address];
    this.record = cached ?? original;
    if (cached) this.publish();
    cx.spawn(async (cx) => {
      const old = await core(["get", original.address]).catch(() => null);
      if (old?.labels?.["t3.record"]) {
        this.record = releaseRecords()[original.address] ?? localizeRecord({ ...JSON.parse(old.labels["t3.record"]), settled: old.labels.settled ?? "" });
        this.publish();
      }
      const r = await hc(["read", original.address, "--lines", "18"]).catch(() => null);
      this.preview = r?.code === 0 ? r.stdout : "";
      cx.notify();
    });
  }

  publish() {
    saveReleaseRecords({ ...releaseRecords(), [this.record.address]: this.record });
  }

  check(cx) {
    if (!this.record || this.finished || this.starting || this.error || releaseBusy(this.record.root)) return;
    this.record = releaseRecords()[this.record.address] ?? this.record;
    const p = panes().find((p) => p.pane === this.record.pane);
    const shown = focused();
    if (p && shown?.tab === p.tab && (this.record.root === this.record.address || this.record.replacement)) this.resume(cx);
  }

  resume(cx) {
    if (!this.record || this.starting || this.finished || releaseBusy(this.record.root)) return;
    const locks = shared("t3.resuming") ?? {};
    if (Date.now() - (locks[this.record.address] ?? 0) < 30000) return;
    setShared("t3.resuming", { ...locks, [this.record.address]: Date.now() });
    this.starting = true;
    this.error = null;
    cx.spawn(async (cx) => {
      let claim;
      try {
        this.record = releaseRecords()[this.record.address] ?? this.record;
        // Core enforces unique live names across clients; shared.json is only local to this screen.
        const name = `t3-resume-${this.record.address.split("/").at(-1)}`;
        claim = await core(["run", "--bg", "--no-parent", "--no-notify", "--rm", "--name", name,
          ...(this.record.machine ? ["--on", this.record.machine] : []), "--", "node", "-e", "setTimeout(()=>{},60000)"])
          .catch((e) => { if (e.busy) return null; throw e; });
        if (!claim) return;
        claim.address = localizeRecord({ ...this.record, address: claim.address }).address;
        if ((await core(["get", claim.address])).state !== "live") throw new Error("Could not hold the Pi reconnection lock");
        const old = await core(["get", this.record.address]);
        if (old.state !== "finished") throw new Error("The original Pi is still running. It has not been reconnected.");
        this.record.replacement ||= localizeRecord({ ...this.record, replacement: old.labels?.["t3.replacement"] }).replacement;
        if (!this.record.replacement) {
          const running = terminals().find((k) => k.state === "live" && k.address !== this.record.address
            && k.address.split("/").slice(0, -1).join("/") === this.record.address.split("/").slice(0, -1).join("/")
            && (k.labels?.["pi.session_file"] === this.record.resume || k.argv?.[k.argv.indexOf("--session") + 1] === this.record.resume));
          if (running) {
            if (!panes().some((p) => p.terminal === running.address && p.tab === this.record.tab)) throw new Error(`This conversation is already running at ${running.address}`);
            this.record.replacement = running.address;
          }
        }
        if (!this.record.replacement) {
          const made = await exec("herdr-app", ["do", "pane.split", JSON.stringify({ direction: "right", pane: this.record.pane,
            argv: ["pi", "--session", this.record.resume] })]);
          if (made.code !== 0) throw new Error(made.stderr.trim() || made.stdout.trim());
          const result = JSON.parse(made.stdout);
          if (!result.terminal) throw new Error(result.error || "Pi was not started");
          this.record.replacement = result.terminal;
          this.publish();
          await core(["label", this.record.address, `t3.replacement=${result.terminal}`]);
        }
        const next = await core(["get", this.record.replacement]).catch((e) => { if (e.missing) return null; throw e; });
        if (!next || next.state === "finished") {
          delete this.record.replacement;
          this.publish();
          await core(["label", this.record.address, "t3.replacement="]);
          throw new Error("Pi exited before it could resume. The saved session is still here.");
        }
        // The shell can be live before Pi reports readiness. Keep the placeholder and check next second.
        if (!next.labels?.["pi.session_file"]) return;
        if (next.labels["pi.session_file"] !== this.record.resume) throw new Error("Pi opened a different session. The saved conversation is still here.");
        const record = releaseRecords()[this.record.address] ?? this.record;
        const labels = Object.entries(record.labels ?? {}).filter(([key]) => !key.startsWith("pi.") && !key.startsWith("t3.") && !key.startsWith("herdr.") && key !== "settled")
          .map(([key, value]) => `${key}=${value}`);
        const settled = record.settled ? `${record.settled.split(":")[0]}:${next.turn ?? 0}` : "";
        await core(["label", this.record.replacement, ...labels, `settled=${settled}`]);
        // Remove the old core record only after the replacement has opened this exact session.
        await core(["rm", this.record.address]);
        const kept = { ...releaseRecords() }; delete kept[this.record.address]; saveReleaseRecords(kept);
        this.finished = true;
        run("pane.close", { pane: this.record.pane });
      } catch (e) {
        this.error = String(e);
      } finally {
        if (claim) await core(["kill", claim.address]).catch((e) => { if (!e.missing) console.log(`T3 resume lock: ${e}`); });
        const locks = { ...(shared("t3.resuming") ?? {}) }; delete locks[this.record.address]; setShared("t3.resuming", locks);
        this.starting = false;
        cx.notify();
      }
    });
  }

  render(cx) {
    if (!this.record) return div().size_full();
    const t = theme(), r = this.record;
    return v_flex().id("released").size_full().min_h(0).bg(t.background).p(20).gap(12).text_color(t.muted)
      .child(div().text_size(16).font_medium().child(r.session_name || r.title || "Pi"))
      .child(div().text_size(13).child(this.starting || r.replacement ? "Reconnecting Pi…" : "Released · session saved"))
      .when(Boolean(this.error), (el) => el.child(div().text_size(12).text_color(t.blocked).child(this.error)))
      .when(!this.starting, (el) => el.child(h_flex().id("resume").h(30).px(10).rounded(6).items_center().bg(t.hover)
        .role("button").accessibility_label("Resume Pi").on_click((_e, cx) => this.resume(cx)).child(this.error ? "Retry" : "Resume Pi")))
      .child(div().text_size(12).text_color(t.dim).child(r.root === r.address ? "Opening this tab reconnects the conversation." : "Sub-agent · reconnect manually when needed."))
      .child(div().text_size(12).text_color(t.dim).child(`pi --session ${r.resume}`))
      .child(div().id("last-output").flex_1().min_h(0).overflow_y_scroll().text_size(12).child(this.preview));
  }
}
