import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/index.js";
const { app, db } = createApp({ dbPath: ":memory:" });
let server, base, cookie;
async function request(path, body, session = cookie, method) {
  const r = await fetch(base + path, {
    method: method || (body ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Cookie: session } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: r.status,
    body: await r.json(),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
const login = async (name) =>
  (
    await request(
      "/auth/login",
      { email: name + "@dyvora.local", password: "Dyvora@2026" },
      "",
    )
  ).cookie;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = "http://127.0.0.1:" + server.address().port + "/api";
  cookie = await login("admin");
});
after(() => {
  server.close();
  db.close();
});
test("authentication and role-sensitive reads", async () => {
  assert.equal((await request("/bootstrap", null, "")).status, 401);
  const u = await request("/bootstrap");
  assert.equal(u.body.data.users.length, 5);
  assert.equal(u.body.data.users[0].passwordHash, undefined);
  const lab = await login("lab");
  const x = await request("/bootstrap", null, lab);
  assert.equal(x.body.data.invoices.length, 0);
  assert.equal(x.body.data.consultations.length, 0);
  assert.equal(
    (await request("/medicines", { name: "Unauthorized" }, lab)).status,
    403,
  );
});
test("registration, appointment conflicts, tokens and state transitions", async () => {
  const p = await request("/patients", {
    name: "Test Patient",
    age: 40,
    gender: "Other",
    phone: "9876543210",
    allergies: "None reported",
  });
  assert.equal(p.status, 201);
  const date = "2030-05-20";
  const a = await request("/appointments", {
    patientId: p.body.id,
    doctorId: "DR-101",
    date,
    time: "12:30",
    type: "New visit",
  });
  assert.equal(a.status, 201);
  assert.equal(a.body.token, 1);
  assert.equal(
    (
      await request("/appointments", {
        patientId: p.body.id,
        doctorId: "DR-101",
        date,
        time: "12:30",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/actions/appointment", {
        id: a.body.id,
        status: "Completed",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/actions/appointment", {
        id: a.body.id,
        status: "Waiting",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/actions/appointment", {
        id: a.body.id,
        status: "In consultation",
      })
    ).status,
    200,
  );
  const c = await request("/actions/consult", {
    patientId: p.body.id,
    doctorId: "DR-101",
    appointmentId: a.body.id,
    complaint: "Test",
    diagnosis: "Clinician assessment",
    items: [],
  });
  assert.equal(c.status, 200);
  assert.equal(
    (
      await request("/actions/consult", {
        patientId: p.body.id,
        doctorId: "DR-101",
        appointmentId: a.body.id,
        complaint: "Test",
        diagnosis: "Duplicate",
      })
    ).status,
    400,
  );
});
test("dispensing creates server-priced bill, deducts stock, and rejects duplicate processing", async () => {
  const before = (await request("/bootstrap")).body.data.batches.find(
    (b) => b.id === "BAT-501",
  ).quantity;
  const r = await request("/actions/dispense", { id: "RX-1001", amount: 1 });
  assert.equal(r.status, 200);
  assert.equal(r.body.amount, 72);
  assert.equal(
    (await request("/bootstrap")).body.data.batches.find(
      (b) => b.id === "BAT-501",
    ).quantity,
    before - 6,
  );
  assert.equal(
    (await request("/actions/dispense", { id: "RX-1001" })).status,
    400,
  );
  assert.equal(
    (
      await request("/actions/payment", {
        id: r.body.id,
        amount: 100,
        method: "UPI",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/actions/payment", {
        id: r.body.id,
        amount: 24,
        method: "UPI",
      })
    ).body.status,
    "Part paid",
  );
  const credit = await request("/actions/return", {
    invoiceId: r.body.id,
    medicineId: "MED-101",
    quantity: 2,
    reason: "Damaged packaging",
  });
  assert.equal(credit.body.amount, 24);
  assert.equal(credit.body.restocked, false);
  assert.equal(
    (
      await request("/actions/return", {
        invoiceId: r.body.id,
        medicineId: "MED-101",
        quantity: 5,
        reason: "Too many",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/actions/payment", {
        id: r.body.id,
        amount: 25,
        method: "UPI",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/actions/payment", {
        id: r.body.id,
        amount: 24,
        method: "UPI",
      })
    ).body.status,
    "Paid",
  );
});
test("insufficient stock rolls back every inventory allocation", async () => {
  const c = await request("/actions/consult", {
    patientId: "PT-1001",
    doctorId: "DR-101",
    complaint: "Test",
    diagnosis: "Test",
    items: [
      { medicineId: "MED-101", quantity: 1, instructions: "Test instructions" },
      { medicineId: "MED-107", quantity: 1, instructions: "Test instructions" },
    ],
  });
  assert.equal(c.status, 200);
  const data = (await request("/bootstrap")).body.data;
  const rx = data.prescriptions.find((x) => x.consultationId === c.body.id);
  const quantity = data.batches.find((x) => x.id === "BAT-501").quantity;
  assert.equal((await request("/actions/dispense", { id: rx.id })).status, 400);
  const after = (await request("/bootstrap")).body.data;
  assert.equal(
    after.batches.find((x) => x.id === "BAT-501").quantity,
    quantity,
  );
  assert.equal(
    after.prescriptions.find((x) => x.id === rx.id).status,
    "Pending",
  );
});
test("lab processing requires results and pathologist authorization", async () => {
  const order = await request("/labs", {
    patientId: "PT-1001",
    doctorId: "DR-101",
    testIds: ["TEST-101", "TEST-102"],
    amount: 1,
    status: "Released",
  });
  assert.equal(order.body.amount, 1000);
  assert.equal(order.body.status, "Ordered");
  const lab = await login("lab");
  for (const status of ["Sample collected", "Processing"])
    assert.equal(
      (await request("/actions/lab", { id: order.body.id, status }, lab))
        .status,
      200,
    );
  assert.equal(
    (
      await request(
        "/actions/lab",
        { id: order.body.id, status: "Pending approval" },
        lab,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/actions/lab",
        {
          id: order.body.id,
          status: "Pending approval",
          results: "Test result with units and reference ranges",
        },
        lab,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/actions/lab",
        { id: order.body.id, status: "Verified" },
        lab,
      )
    ).status,
    403,
  );
  const pathologist = await login("pathologist");
  assert.equal(
    (
      await request(
        "/actions/lab",
        { id: order.body.id, status: "Verified" },
        pathologist,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/actions/lab",
        { id: order.body.id, status: "Released" },
        pathologist,
      )
    ).body.verifiedBy,
    "Dr. Sana Khan",
  );
});
test("purchases update stock and reject duplicate supplier invoice", async () => {
  const p = {
    supplierId: "SUP-101",
    invoiceNo: "TEST-INV-01",
    items: [
      {
        medicineId: "MED-107",
        batchNo: "NEW-BATCH",
        expiry: "2030-10-01",
        quantity: 20,
        cost: 5,
      },
    ],
  };
  const r = await request("/actions/purchase", p);
  assert.equal(r.status, 200);
  assert.equal(r.body.amount, 100);
  assert.equal((await request("/actions/purchase", p)).status, 400);
  const rows = (await request("/bootstrap")).body.data;
  assert.equal(
    rows.batches.find((x) => x.batchNo === "NEW-BATCH").quantity,
    20,
  );
  assert.equal(
    (
      await request("/actions/adjust", {
        id: rows.batches.find((x) => x.batchNo === "NEW-BATCH").id,
        quantity: -21,
        reason: "Test",
      })
    ).status,
    400,
  );
});
test("invoices ignore supplied totals and credits; audit persists actor", async () => {
  const r = await request("/invoices", {
    patientId: "PT-1001",
    amount: 1,
    credit: 600,
    paid: 1000,
    items: [{ description: "Consultation", quantity: 2, price: 600 }],
  });
  assert.equal(r.body.amount, 1200);
  assert.equal(r.body.paid, 0);
  assert.equal(r.body.credit, undefined);
  assert.equal(
    (
      await request("/actions/payment", {
        id: r.body.id,
        amount: 1200,
        method: "Card",
      })
    ).body.status,
    "Paid",
  );
  const rows = (await request("/bootstrap")).body.data;
  assert.ok(rows.audit.length > 10);
  assert.ok(rows.audit.every((a) => a.actor && a.createdAt));
});
test("purchase orders are received once and stock transfers conserve quantities", async () => {
  const po = await request("/purchaseOrders", {
    supplierId: "SUP-102",
    items: [{ medicineId: "MED-101", quantity: 10, cost: 6 }],
  });
  assert.equal(po.status, 201);
  const wrong = await request("/actions/purchase", {
    supplierId: "SUP-102",
    purchaseOrderId: po.body.id,
    invoiceNo: "PO-WRONG",
    items: [
      {
        medicineId: "MED-101",
        batchNo: "PO-BATCH",
        expiry: "2030-01-01",
        quantity: 9,
        cost: 6,
      },
    ],
  });
  assert.equal(wrong.status, 400);
  const r = await request("/actions/purchase", {
    supplierId: "SUP-102",
    purchaseOrderId: po.body.id,
    invoiceNo: "PO-CORRECT",
    items: [
      {
        medicineId: "MED-101",
        batchNo: "PO-BATCH",
        expiry: "2030-01-01",
        quantity: 10,
        cost: 6,
      },
    ],
  });
  assert.equal(r.status, 200);
  const before = (await request("/bootstrap")).body.data;
  assert.equal(
    before.purchaseOrders.find((x) => x.id === po.body.id).status,
    "Received",
  );
  const source = before.batches.find((x) => x.batchNo === "PO-BATCH");
  const transfer = await request("/actions/transfer", {
    id: source.id,
    quantity: 4,
    destination: "Secondary counter",
  });
  assert.equal(transfer.status, 200);
  const after = (await request("/bootstrap")).body.data;
  assert.equal(
    after.batches
      .filter((x) => x.medicineId === "MED-101")
      .reduce((s, x) => s + x.quantity, 0),
    before.batches
      .filter((x) => x.medicineId === "MED-101")
      .reduce((s, x) => s + x.quantity, 0),
  );
  assert.equal(
    after.batches.find((x) => x.id === transfer.body.targetId).expiry,
    source.expiry,
  );
  assert.equal(
    (
      await request("/actions/transfer", {
        id: source.id,
        quantity: 40,
        destination: "Secondary counter",
      })
    ).status,
    400,
  );
});
test("credits create bounded refund settlements without restocking returns", async () => {
  const data = (await request("/bootstrap")).body.data;
  const inv = data.invoices.find((x) => x.prescriptionId === "RX-1001");
  assert.equal(
    (
      await request("/actions/return", {
        invoiceId: inv.id,
        medicineId: "MED-101",
        quantity: 4,
        reason: "Return remaining quantity",
      })
    ).status,
    200,
  );
  const credited = (await request("/bootstrap")).body.data.invoices.find(
    (x) => x.id === inv.id,
  );
  assert.equal(credited.refundDue, 48);
  assert.equal(
    (
      await request("/actions/refund", {
        id: inv.id,
        amount: 49,
        method: "UPI",
      })
    ).status,
    400,
  );
  const settled = await request("/actions/refund", {
    id: inv.id,
    amount: 48,
    method: "UPI",
  });
  assert.equal(settled.body.refundDue, 0);
  assert.equal(settled.body.paid, 0);
  assert.equal(
    (await request("/actions/refund", { id: inv.id, amount: 1, method: "UPI" }))
      .status,
    400,
  );
});
test("imaging reports support assigned-doctor review and authenticated attachments", async () => {
  const report = await request("/imaging", {
    patientId: "PT-1001",
    doctorId: "DR-101",
    modality: "X-ray",
    bodyPart: "Demo study",
    performedAt: "2026-10-17",
    reportingClinician: "Demo radiologist",
    reportText: "Synthetic findings for workflow testing only.",
  });
  assert.equal(report.status, 201);
  const content = Buffer.from(
    "%PDF-1.4\n%Synthetic attachment test fixture",
  ).toString("base64");
  const a = await request("/attachments", {
    collection: "imaging",
    recordId: report.body.id,
    name: "report.pdf",
    content,
  });
  assert.equal(a.status, 201);
  const noauth = await fetch(base + "/attachments/" + a.body.id);
  assert.equal(noauth.status, 401);
  const denied = await fetch(base + "/attachments/" + a.body.id, {
    headers: { Cookie: await login("pharmacy") },
  });
  assert.equal(denied.status, 403);
  const allowed = await fetch(base + "/attachments/" + a.body.id, {
    headers: { Cookie: cookie },
  });
  assert.equal(allowed.headers.get("content-type"), "application/pdf");
  assert.equal(await allowed.text(), Buffer.from(content, "base64").toString());
  assert.equal(
    (
      await request("/attachments", {
        collection: "imaging",
        recordId: report.body.id,
        name: "bad.html",
        content: Buffer.from("<html>bad</html>").toString("base64"),
      })
    ).status,
    400,
  );
  const doctor = await login("doctor");
  assert.equal(
    (
      await request(
        "/actions/imaging",
        { id: report.body.id, note: "Reviewed by clinician" },
        doctor,
      )
    ).body.status,
    "Reviewed",
  );
  assert.equal(
    (
      await request("/attachments", {
        collection: "imaging",
        recordId: report.body.id,
        name: "report.pdf",
        content,
      })
    ).status,
    400,
  );
});
test("counter sales enforce catalog policy, ignore client pricing and deduct first-expiring stock", async () => {
  const med = await request("/medicines", {
    name: "Synthetic counter item",
    price: 10,
    gst: 5,
    reorderLevel: 2,
    salePolicy: "Non-prescription",
  });
  const first = await request("/batches", {
    medicineId: med.body.id,
    batchNo: "FIRST",
    expiry: "2028-01-01",
    quantity: 3,
    cost: 5,
    location: "Main pharmacy",
  });
  const second = await request("/batches", {
    medicineId: med.body.id,
    batchNo: "SECOND",
    expiry: "2029-01-01",
    quantity: 10,
    cost: 5,
    location: "Main pharmacy",
  });
  const expired = {
    id: "TEST-EXPIRED",
    medicineId: med.body.id,
    batchNo: "EXPIRED",
    expiry: "2000-01-01",
    quantity: 100,
    cost: 5,
  };
  db.prepare("INSERT INTO records VALUES(?,?,?)").run(
    "batches",
    expired.id,
    JSON.stringify(expired),
  );
  const sale = await request("/actions/pos", {
    patientId: "PT-1001",
    items: [{ medicineId: med.body.id, quantity: 4, price: 1 }],
    amount: 1,
  });
  assert.equal(sale.status, 200);
  assert.equal(sale.body.amount, 42);
  const rows = (await request("/bootstrap")).body.data;
  assert.equal(rows.batches.find((x) => x.id === first.body.id).quantity, 0);
  assert.equal(rows.batches.find((x) => x.id === second.body.id).quantity, 9);
  assert.equal(rows.batches.find((x) => x.id === expired.id).quantity, 100);
  assert.equal(
    (
      await request("/actions/pos", {
        patientId: "PT-1001",
        items: [{ medicineId: "MED-102", quantity: 1 }],
      })
    ).status,
    400,
  );
});
