import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { createApp } from "../server/index.js";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.DYVORA_PLAYWRIGHT_MODULE || "playwright",
);
const { app, db } = createApp({ dbPath: ":memory:" });
const server = app.listen(4001, "127.0.0.1");
console.log("Launching isolated Chromium");
const browser = await chromium.launch({ headless: true, timeout: 25000 });
console.log("Browser launched");
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
mkdirSync("playwright-output", { recursive: true });
try {
  await page.goto("http://127.0.0.1:4001", { waitUntil: "domcontentloaded" });
  console.log("Page loaded");
  await page.screenshot({
    path: "playwright-output/login.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await page
    .getByRole("heading", { name: "Your clinic, at a glance" })
    .waitFor();
  await page.screenshot({
    path: "playwright-output/dashboard.png",
    fullPage: true,
  });
  for (const name of [
    "Patients",
    "Appointments",
    "Live queue",
    "Doctors",
    "Consultations",
    "Prescriptions",
    "Laboratory",
    "Pharmacy",
    "Billing & payments",
    "Reports & analytics",
    "Users & roles",
    "Communication",
    "Audit trail",
    "Settings",
  ]) {
    await page
      .locator("nav")
      .getByRole("button", { name, exact: name !== "Live queue" })
      .click();
    await page.waitForTimeout(70);
    console.log("Opened", name);
  }
  await page
    .locator("nav")
    .getByRole("button", { name: "Patients", exact: true })
    .click();
  const search = page.getByRole("textbox", {
    name: "Search records",
    exact: true,
  });
  await search.pressSequentially("Priya", { delay: 30 });
  if (
    (await search.inputValue()) !== "Priya" ||
    !(await search.evaluate((el) => el === document.activeElement))
  )
    throw Error("Search lost focus");
  if ((await page.locator("tbody tr").count()) !== 1)
    throw Error("Patient search incorrect");
  await search.fill("");
  await page
    .getByRole("button", { name: "Register patient", exact: true })
    .click();
  await page.getByLabel("Full name").fill("UI Test Patient");
  await page.getByLabel("Age", { exact: true }).fill("36");
  await page.getByLabel("Gender").selectOption("Female");
  await page.getByLabel("Mobile number").fill("9876509999");
  await page.getByLabel("Blood group").selectOption("O+");
  await page.getByLabel("Known allergies").fill("None reported");
  await page
    .getByRole("button", { name: "Create record", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Patient registered through UI");
  await page
    .locator("nav")
    .getByRole("button", { name: "Pharmacy", exact: true })
    .click();
  await page.getByRole("button", { name: "Add medicine", exact: true }).click();
  await page.getByLabel("Medicine name").fill("UI Test Medicine");
  await page.getByLabel("Category", { exact: true }).fill("Supplement");
  await page.getByLabel("Unit", { exact: true }).selectOption("Tablet");
  await page.getByLabel("Manufacturer").fill("Demo");
  await page.getByLabel("Sale policy").selectOption("Non-prescription");
  await page.getByLabel("Selling price").fill("15");
  await page
    .getByRole("button", { name: "Create record", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Medicine registered through UI");
  await page
    .locator("nav")
    .getByRole("button", { name: "Laboratory", exact: true })
    .click();
  await page.screenshot({
    path: "playwright-output/laboratory.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "New lab order", exact: true })
    .click();
  await page.getByLabel("Patient", { exact: true }).selectOption("PT-1001");
  await page.getByLabel("Referring doctor").selectOption("DR-101");
  await page.getByText("Complete blood count", { exact: true }).last().click();
  await page
    .getByRole("button", { name: "Create lab order", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Lab order created through UI");
  await page
    .getByRole("button", { name: "Imaging review", exact: true })
    .click();
  await page.getByRole("button", { name: "Add imaging report" }).click();
  await page.getByLabel("Patient", { exact: true }).selectOption("PT-1001");
  await page.getByLabel("Reviewing doctor").selectOption("DR-101");
  await page.getByLabel("Modality", { exact: true }).selectOption("X-ray");
  await page.getByLabel("Body part").fill("Synthetic study");
  await page.getByLabel("Study date").fill("2026-10-17");
  await page.getByLabel("Reporting radiologist").fill("Demo Radiologist");
  await page
    .getByLabel("Transcribed radiology findings")
    .fill("Synthetic findings for UI testing.");
  await page
    .getByRole("button", { name: "Create record", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Review report", exact: true })
    .click();
  await page
    .getByLabel("Clinician review and follow-up notes")
    .fill("Reviewed synthetic report.");
  await page.getByRole("button", { name: "Sign review", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Imaging report entered and reviewed through UI");
  await page
    .locator("nav")
    .getByRole("button", { name: "Pharmacy", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Purchase orders", exact: true })
    .click();
  await page
    .getByRole("button", { name: "New purchase order", exact: true })
    .click();
  await page.getByLabel("Supplier", { exact: true }).selectOption("SUP-101");
  await page.getByLabel("Medicine", { exact: true }).selectOption("MED-101");
  await page.getByLabel("Quantity", { exact: true }).fill("10");
  await page.getByLabel("Estimated unit cost").fill("5");
  await page
    .getByRole("button", { name: "Create purchase order", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Receive", exact: true }).click();
  await page.getByLabel("Supplier invoice number").fill("UI-PO-INV");
  await page.getByLabel("Batch number", { exact: true }).fill("UI-PO-BATCH");
  await page.getByLabel("Expiry", { exact: true }).fill("2030-10-01");
  await page
    .getByRole("button", { name: "Receive purchase", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Purchase order created and received through UI");
  for (const name of [
    "POS billing",
    "Batches & expiry",
    "Prescription queue",
    "Purchase entry",
    "Suppliers",
    "Stock ledger",
    "Returns",
    "Stock transfers",
  ])
    await page
      .getByRole("button", { name, exact: name !== "Prescription queue" })
      .click();
  await page
    .getByRole("button", { name: "Transfer stock", exact: true })
    .click();
  await page.getByLabel("Source batch").selectOption("BAT-501");
  await page.getByLabel("Destination location").fill("UI secondary counter");
  await page
    .getByRole("button", { name: "Transfer stock", exact: true })
    .last()
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Stock transfer recorded through UI");
  await page
    .getByRole("button", { name: "Batches & expiry", exact: true })
    .click();
  await page.getByRole("button", { name: "Add batch", exact: true }).click();
  await page
    .getByLabel("Medicine", { exact: true })
    .selectOption({ label: "UI Test Medicine" });
  await page
    .getByLabel("Batch number", { exact: true })
    .fill("UI-COUNTER-BATCH");
  await page.getByLabel("Expiry date").fill("2030-10-01");
  await page.getByLabel("Quantity", { exact: true }).fill("25");
  await page.getByLabel("Unit cost").fill("5");
  await page.getByLabel("Supplier", { exact: true }).selectOption("SUP-101");
  await page
    .getByRole("button", { name: "Create record", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "POS billing", exact: true }).click();
  await page
    .getByRole("button", { name: "New counter sale", exact: true })
    .click();
  await page.getByLabel("Patient", { exact: true }).selectOption("PT-1001");
  const selector = page.getByLabel("Medicine", { exact: true });
  const option = await selector
    .locator("option")
    .filter({ hasText: "UI Test Medicine" })
    .getAttribute("value");
  await selector.selectOption(option);
  await page.getByLabel("Quantity", { exact: true }).fill("2");
  await page
    .getByRole("button", { name: "Dispense & create invoice", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Counter sale completed through UI");
  await page
    .locator("nav")
    .getByRole("button", { name: "Prescriptions", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open prescription", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Dispense & create bill", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .locator("nav")
    .getByRole("button", { name: "Billing & payments", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Collect payment", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Prescription dispensing and payment recorded through UI");
  await page.locator("nav").getByRole("button", { name: "Live queue" }).click();
  await page.getByRole("button", { name: "Consult", exact: true }).click();
  await page
    .getByLabel("Clinician assessment / diagnosis")
    .fill("Synthetic assessment for UI validation");
  await page
    .getByRole("button", { name: "Sign consultation", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("Consultation signed through UI");
  await page
    .locator("nav")
    .getByRole("button", { name: "Laboratory", exact: true })
    .click();
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  for (const next of [
    "Collect sample",
    "Start processing",
    "Submit for approval",
    "Verify report",
    "Release report",
  ]) {
    await page
      .locator("tr")
      .filter({ hasText: "LAB-3001" })
      .getByRole("button", { name: "Open order", exact: true })
      .click();
    if (next === "Submit for approval")
      await page
        .getByLabel("Results and laboratory reference ranges")
        .fill("Synthetic results, units and reference information.");
    await page.getByRole("button", { name: next, exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  console.log("Lab collection through verified release completed through UI");

  await page
    .locator("nav")
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  if (await dismiss.count()) await dismiss.click();
  await page.screenshot({
    path: "playwright-output/mobile.png",
    fullPage: true,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw Error("Mobile horizontal overflow");
  await page.getByRole("button", { name: "Toggle menu" }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Patients", exact: true })
    .click();
  if (
    (await page
      .getByRole("heading", { name: "Patients", exact: true })
      .count()) !== 1
  )
    throw Error("Mobile navigation failed");
  console.log("Mobile layout and menu verified");
  await page.setViewportSize({ width: 1440, height: 1100 });
  for (const account of ["Doctor", "Pharmacy", "Laboratory", "Pathologist"]) {
    await page.request.post("http://127.0.0.1:4001/api/auth/logout");
    await page.goto("http://127.0.0.1:4001", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: account, exact: true }).click();
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await page
      .getByRole("heading", { name: "Your clinic, at a glance" })
      .waitFor();
    if (
      await page
        .locator("nav")
        .getByRole("button", { name: "Users & roles", exact: true })
        .count()
    )
      throw Error("Restricted admin navigation visible");
  }
  console.log("All role workspaces verified");

  if (errors.length) throw Error(errors.join("\n"));
  console.log("UI checks passed; zero runtime errors");
} catch (e) {
  await page
    .screenshot({ path: "playwright-output/failure.png", fullPage: true })
    .catch(() => {});
  console.log("Page errors:", errors);
  throw e;
} finally {
  await browser.close();
  server.close();
  db.close();
}
