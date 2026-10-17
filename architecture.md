# Architecture

## Components

```text
React browser (Vite in development; static production build)
    | same-origin /api, HttpOnly session cookie
Express application on 127.0.0.1:4000
    | role validation + workflow actions + audit records
Node built-in SQLite (WAL mode)
    records(collection, id, data JSON)
    sessions(token, userId, expires)
```

`client/main.jsx` contains stable React components, a workspace context, dashboard, specialized operational views and forms. `client/styles.css` supplies the visual system, responsive layouts and accessibility styles. `server/index.js` owns authentication, authorization, persistence and business rules. `server/seed.js` provides clearly labelled synthetic fixtures. `tests/workflows.test.js` exercises the HTTP API against an isolated database. `tests/browser-check.mjs` verifies rendered interactions and mobile layout.

SQLite is real persistent SQL storage. The MVP stores entity payloads as JSON in a keyed records table rather than deploying a separate database service. It simplifies local setup while supporting atomic workflow transactions. A larger installation should migrate entities to normalized tables with foreign keys, indexed reporting queries and migration/version management.

## Entities and relationships

- Patients are referenced by appointments, consultations, prescriptions, lab orders, imaging reports, invoices and communication drafts.
- Doctors are referenced by appointments and clinical records. A Doctor user links to a doctor profile for signing and assigned imaging reviews.
- Signed consultations can create prescriptions and consultation invoices. A visit cannot be signed twice.
- Prescriptions contain medicine IDs, quantities and clinician instructions. Dispensing creates an invoice and stock ledger movements.
- Medicine batches reference the medicine and supplier and carry expiry, quantity, unit cost and location. Transfers create a destination batch preserving expiry/cost and paired ledger movements.
- Purchase orders reference suppliers and medicine quantities. Receiving validates exact full-order quantities, adds stock and closes the order in one transaction.
- Lab orders reference catalog tests, patients and referring doctors. Catalog prices produce the invoice total. Report attachments reference the owning order or imaging report.
- Returns reference the original pharmacy invoice and medicine; credits affect the balance and may create a refund due. Refund settlement records reduce net collected payments. Returned medicines remain quarantined.
- Audit entries capture actor, role, action, affected reference and timestamp. The API provides no edit/delete endpoint for audit or signed clinical records.

## Workflow invariants

- Every authenticated request validates a nonexpired server-side session and an active user. Passwords use scrypt with per-user random salts; session tokens use cryptographic random bytes. Cookies are HttpOnly and SameSite=Strict. Login attempts are bounded per IP in memory.
- Bootstrap data is filtered by role. User password fields never leave the server. Laboratory roles do not receive billing or consultation records; pharmacy users do not receive consultation notes.
- Appointments cannot collide on doctor/date/time; daily token numbers are assigned centrally. Queue transitions are explicit: Scheduled -> Waiting -> In consultation -> Completed, or cancellation before consultation.
- Clinical signing requires complaint and clinician assessment. Medication instructions and positive integer quantities are mandatory; duplicate medicine lines are rejected. Assigned-doctor identity is validated.
- Stock issuance ignores expired batches, allocates earliest expiry first, rejects insufficient stock and rolls back every allocation on failure. Duplicate prescription processing is rejected. Client-submitted prices/totals are ignored for medicine sales and lab orders.
- Stock cannot become negative. Purchases require future expiry, valid quantities, batch and supplier invoice. Duplicate supplier invoices are rejected.
- Lab reports follow Ordered -> Sample collected -> Processing -> Pending approval -> Verified -> Released. Entered results are required for submission. Verification/release requires a pathologist or administrator, and doctors cannot execute technician transitions.
- Attachments are limited to 5 MB and PDF/JPEG/PNG magic signatures; finalized report attachments cannot be replaced. File content is fetched through authenticated routes, not exposed in static public directories.
- Payments cannot exceed outstanding balances after credits. Returns cannot exceed originally dispensed quantities less previous returns. Refunds cannot exceed the credited overpayment. External bank/payment transactions require separate integration.

## Operational limits

The local process is single-service and clinic-scoped. Session and records persist in SQLite; login throttling does not survive restarts. The synchronous SQLite driver is suitable for a local MVP, not high-throughput concurrent hospital workloads. Back up the database consistently with SQLite backup tooling; no backup job is configured. HTTP is for loopback development. Deployments need HTTPS, secure cookie settings, access governance, file scanning, observability, resilient backups and an approved clinical/security validation process.

Lab findings and prescriptions are entered by staff; there is no automated decision support. Imaging review is for transcribed reports and PDF/image attachments, not diagnostic rendering of DICOM studies. Communication channels save drafts only. No external communications or payment movements occur.
