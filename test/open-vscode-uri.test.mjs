import { test } from "node:test";
import assert from "node:assert/strict";
import { folderUri, protocolUrl, resolveHost, sshAuthority, uriPath } from "../mods/open-vscode/uri.js";

const hex = (s) => Buffer.from(s).toString("hex");

test("encodes every shell-sensitive character", () => {
  assert.equal(uriPath("/a b/測試/(x)&'y"), "/a%20b/%E6%B8%AC%E8%A9%A6/%28x%29%26%27y");
});
test("keeps Windows drives", () => {
  assert.equal(uriPath("C:\\Users\\a b"), "/C:/Users/a%20b");
  assert.equal(uriPath("C:\\"), "/C:/");
  assert.equal(uriPath("c:"), "/c:/");
});
test("lowercase hosts stay readable", () => {
  assert.equal(sshAuthority("rick@10.0.0.2"), "ssh-remote+rick@10.0.0.2");
  assert.equal(sshAuthority("mac-mini"), "ssh-remote+mac-mini");
});
test("capitals are hex-encoded", () => {
  assert.equal(sshAuthority("MacStudio"), `ssh-remote+${hex('{"hostName":"MacStudio"}')}`);
});
test("hex is UTF-8, without TextEncoder", () => {
  const original = globalThis.TextEncoder;
  delete globalThis.TextEncoder;
  try {
    assert.equal(sshAuthority("Mäc"), `ssh-remote+${hex('{"hostName":"Mäc"}')}`);
  } finally {
    globalThis.TextEncoder = original;
  }
});
test("full URIs", () => {
  assert.equal(folderUri("/w/a b", "box"), "vscode-remote://ssh-remote+box/w/a%20b");
  assert.equal(folderUri("/w/a b", null), "file:///w/a%20b");
  assert.equal(folderUri("C:\\w", null), "file:///C:/w");
  assert.equal(protocolUrl("/w", "box"), "vscode://vscode-remote/ssh-remote+box/w");
  assert.equal(protocolUrl("C:\\w", null), "vscode://file/C:/w");
});
test("host comes from the override, then the target", () => {
  const ms = [{ name: "box", target: "rick@box" }, { name: "fly", target: "fly ssh console", via: true }];
  assert.equal(resolveHost("box", ms, {}), "rick@box");
  assert.equal(resolveHost("box", ms, { box: "other" }), "other");
  assert.equal(resolveHost("fly", ms, {}), null);
  assert.equal(resolveHost("gone", ms, {}), null);
});
