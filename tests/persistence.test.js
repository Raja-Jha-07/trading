import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createApp } from "../server/index.js";
async function listen(app) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  return { server, url: "http://127.0.0.1:" + server.address().port };
}
const close = (server) => new Promise((resolve) => server.close(resolve));
test("patient records and authenticated sessions survive a database reopen without reseeding", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "dyvora-persistence-"));
  const dbPath = path.join(dir, "test.sqlite");
  let first, second;
  try {
    first = createApp({ dbPath });
    const a = await listen(first.app);
    const login = await fetch(a.url + "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@dyvora.local",
        password: "Dyvora@2026",
      }),
    });
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const registered = await fetch(a.url + "/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        name: "Persistent synthetic patient",
        age: 40,
        gender: "Other",
        phone: "9876509000",
      }),
    });
    const record = await registered.json();
    assert.equal(registered.status, 201);
    await close(a.server);
    first.db.close();
    first = null;
    second = createApp({ dbPath });
    const b = await listen(second.app);
    const response = await fetch(b.url + "/api/bootstrap", {
      headers: { Cookie: cookie },
    });
    const data = (await response.json()).data;
    assert.equal(response.status, 200);
    assert.equal(
      data.patients.find((p) => p.id === record.id).name,
      "Persistent synthetic patient",
    );
    assert.equal(data.patients.length, 9);
    assert.equal(data.users.length, 5);
    await close(b.server);
    second.db.close();
    second = null;
  } finally {
    first?.db.close();
    second?.db.close();
    for (const suffix of ["", "-wal", "-shm"])
      if (existsSync(dbPath + suffix)) unlinkSync(dbPath + suffix);
    rmdirSync(dir);
  }
});
test("clean initialization seeds only an administrator and clinic settings", () => {
  const original = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = "Synthetic-Strong-Password-2026";
  const { db } = createApp({ dbPath: ":memory:", demo: false });
  try {
    const rows = db
      .prepare(
        "SELECT collection,COUNT(*) AS count FROM records GROUP BY collection",
      )
      .all();
    assert.equal(rows.find((r) => r.collection === "users").count, 1);
    assert.equal(rows.find((r) => r.collection === "settings").count, 1);
    assert.equal(
      rows.find((r) => r.collection === "patients"),
      undefined,
    );
  } finally {
    db.close();
    if (original === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = original;
  }
});
