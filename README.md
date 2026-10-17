# Dyvora Health OS

A React and Node.js clinic management MVP connecting administration, patient registration, doctors, consultations, pharmacy, laboratory, imaging review, and billing in one responsive workspace.

This README is the implementation and handover guide for the **`medos` branch**. It explains what exists in the current source, how to run a cloned copy, what happens to its data, and what must be implemented or integrated next.

> **Current status:** executable local MVP with synthetic demonstration records, persistent SQLite storage, server-enforced roles, connected operational workflows, integration tests, and browser checks. It is not a certified clinical system or a production hospital deployment. Clinical assessments, prescription instructions, laboratory findings, and medicine sale policies are entered by staff.

## Contents

1. [Repository and branch](#1-repository-and-branch)
2. [What we have built](#2-what-we-have-built)
3. [Technology and architecture](#3-technology-and-architecture)
4. [Codebase map](#4-codebase-map)
5. [Clone and run](#5-clone-and-run)
6. [Demo accounts and permissions](#6-demo-accounts-and-permissions)
7. [Data, cloning, persistence, and backups](#7-data-cloning-persistence-and-backups)
8. [Environment configuration](#8-environment-configuration)
9. [Starting without demo data](#9-starting-without-demo-data)
10. [End-to-end operating guide](#10-end-to-end-operating-guide)
11. [API and data model](#11-api-and-data-model)
12. [Tests and verification](#12-tests-and-verification)
13. [What to add after cloning](#13-what-to-add-after-cloning)
14. [Troubleshooting](#14-troubleshooting)
15. [Development and contribution workflow](#15-development-and-contribution-workflow)

## 1. Repository and branch

- Repository: [Raja-Jha-07/trading](https://github.com/Raja-Jha-07/trading).
- Hospital application: [branch `medos`](https://github.com/Raja-Jha-07/trading/tree/medos).
- The repository's `main` branch contains a separate trading application. **Clone or switch to `medos` to get Dyvora.**
- The hospital app lives at the repository root on `medos`; it is not inside a `hospital/` subdirectory.
- This branch contains the application source, lockfile, tests, and documentation. Local databases, attachments, generated builds, installed dependencies, screenshots, and supplied reference documents are not published with it.

## 2. What we have built

The implementation follows the supplied admin and doctor flow charts and the pharmacy/laboratory screen references. The main experience uses a purple-and-white design with a persistent sidebar, module workspaces, searchable tables, focused forms, status badges, and mobile navigation.

### 2.1 Administration and overview

Implemented:

- Overview dashboard showing stored appointment counts, registered patients, collected payments, and the active queue.
- Seven-day appointment/completion chart derived from stored records.
- Doctor availability display and operational attention items.
- Shortcuts for patient registration, appointments, lab orders, and invoices, according to role.
- Patient registration and profile editing: name, age, gender, phone, blood group, allergies, and address.
- Patient search and an associated clinical timeline.
- Doctor registration, specialty, contact details, consultation fee, and manually maintained availability.
- Appointment booking, visit type, reason, date, time, and centrally assigned daily token.
- Duplicate booking prevention for the same doctor, date, and time, excluding cancelled bookings.
- Queue check-in, calling a patient, consultation completion, and pre-consultation cancellation.
- Consultation and prescription monitoring screens.
- User creation, roles, doctor-profile linking, account activation/deactivation, and clinic settings.
- Audit entries for record changes and workflow actions.
- Operational CSV exports and browser print views.

Boundaries:

- Availability is manually maintained; shift scheduling, leave calendars, slot duration planning, and automated rostering are not implemented.
- Dashboard and notification data refresh through application loading and successful actions. There is no WebSocket-based live broadcast or scheduled external alert service.
- Role access is scoped to this clinic application. Branch tenancy and comprehensive patient-assignment read restrictions are not implemented.

### 2.2 Doctor and clinical workspace

Implemented:

- Patient demographic and allergy review.
- Timeline of consultations, prescriptions, laboratory orders/results, and imaging reports.
- Consultation notes containing presenting complaint, manually entered vitals, clinician assessment/diagnosis, and care/follow-up notes.
- Signing a consultation and completing its associated active appointment.
- Multi-medicine prescriptions with quantities and explicit free-text dose, route, frequency, duration, and other instructions.
- Sending the signed prescription into the pharmacy queue.
- Automatic consultation invoice creation using the selected doctor's stored fee.
- Laboratory ordering and viewing results; printable prescriptions.
- Transcribed radiology findings, PDF/image report attachments, clinician review notes, and an assigned-doctor imaging review action.

Rules already enforced:

- Complaint and clinician assessment are required for signing.
- Medication quantity must be a positive integer; medicine instructions are required.
- Duplicate medicine lines must be combined.
- A visit cannot receive a second signed consultation through the signing workflow.
- Doctor accounts must match the doctor profile when signing or performing assigned imaging review.

Boundaries:

- Diagnosis, medication instructions, and clinical findings are staff-entered text.
- There is no automated diagnosis, drug-interaction engine, allergy matching engine, dose calculation, structured prescribing terminology, clinical guideline engine, or electronic prescribing network.
- Signing is an application workflow state, not a qualified digital signature or external regulatory certification.
- There is no dedicated radiologist login role; radiology report details are recorded for subsequent doctor review.

### 2.3 Pharmacy and inventory

Implemented:

| Workspace          | Current behavior                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Inventory          | Medicine name, category, unit, manufacturer, price, GST percentage, reorder threshold, and clinic-configured sale policy                    |
| Batches & expiry   | Batch numbers, quantities, costs, supplier references, location, expiry dates, and expiry attention statuses                                |
| Prescription queue | Review the patient, allergy information, prescriber, items, quantities, and instructions before dispensing                                  |
| Dispensing         | Validate stock, allocate unexpired batches by earliest expiry, deduct quantities, create stock movements, and generate an invoice           |
| POS billing        | Counter sales for medicines marked Non-prescription, or dispensing an existing pending signed prescription                                  |
| Suppliers          | Supplier and contact information, GSTIN, and active/inactive status                                                                         |
| Purchase orders    | Supplier-based orders with medicine quantities and estimated costs; cancel an open order or receive it                                      |
| Purchase entry     | Record supplier invoices, batches, future expiry, quantities, and costs; add stock and ledger entries                                       |
| Stock ledger       | Recorded purchases, opening stock added through the app, dispensing, counter sales, adjustments, and transfers                              |
| Stock adjustments  | Signed quantity changes with a required reason; prevent negative stock                                                                      |
| Stock transfers    | Move quantity between locations while preserving medicine, batch identity, expiry, and unit cost                                            |
| Returns            | Return previously invoiced pharmacy items within remaining eligible quantities; calculate invoice credits and quarantine returned medicines |
| Refunds            | Record an actual refund settlement against the credited overpayment, within the refund due                                                  |

Important behavior:

- Expired batches do not count as available stock for issuance. The expiry date must be strictly after the clinic's current date.
- Insufficient stock rolls back the whole sale/dispensing transaction, including earlier allocations.
- Dispensing an already processed prescription is rejected.
- Counter sales use server-side catalog prices/taxes and require the catalog's Non-prescription policy. An unconfigured policy does not qualify an item for a counter sale.
- Catalog sale policy is a staff configuration; the application does not determine the legal classification of a medicine.
- Supplier invoice duplicates are rejected for the same supplier.
- Receiving a linked purchase order requires its complete medicine quantities. Partial PO receiving and backorders are not implemented.
- Returned medicines are not automatically put back into saleable inventory.
- Refund recording does not initiate a bank or UPI transfer.

Not yet included: inventory spreadsheet imports, held/resumed POS carts, supplier-side purchase returns, exchanges, barcode scanner integration, automated procurement recommendations, dedicated category/unit master screens, and advanced tax filing reports.

### 2.4 Laboratory

Implemented:

- Test catalog with name, code, sample type, price, unit, and reference information.
- Multi-test orders linked to a patient and referring doctor.
- Routine/urgent priority, order totals calculated from catalog prices, and an automatically created laboratory invoice.
- Sample IDs and printable sample labels.
- Explicit collection, processing, result submission, verification, and release stages.
- Manually entered findings, units, reference information, and comments.
- Optional PDF, PNG, or JPEG report attachments, up to 5 MB each upload.
- Authenticated attachment viewing and printable released reports.

Workflow:

```text
Ordered -> Sample collected -> Processing -> Pending approval -> Verified -> Released
```

- Results are required before submission for approval.
- A laboratory technician cannot verify or release a report.
- A pathologist or administrator can verify and release it.
- Doctor users cannot execute the technician workflow actions.
- Verified/released report attachments cannot be replaced through the upload endpoint.

Boundaries:

- Printable sample labels currently contain identification text; encoded barcode generation is not implemented.
- Results are free text rather than a structured analyte-by-analyte laboratory information system.
- Analyzer connections, automatic reference ranges/abnormal flags, specimen rejection/recollection, critical-result escalation, and amended-report/version workflows require additional work.

### 2.5 Imaging review

Implemented:

- Record patient, reviewing doctor, modality, body part, study date, reporting radiologist name, and transcribed findings.
- Attach a PDF, JPEG, or PNG report/image.
- Review findings and record clinician follow-up notes.
- Mark the report Reviewed and print the review.
- Show the report in the patient timeline.

This supports report review. It does not implement diagnostic DICOM rendering, PACS/RIS connectivity, modality worklists, imaging acquisition, or diagnostic image measurements.

### 2.6 Billing and payments

Implemented:

- Consultation invoices generated when a consultation is signed.
- Laboratory invoices generated when an order is created.
- Medicine invoices generated by dispensing or a counter sale.
- Manually created service invoices with line descriptions, quantities, and entered unit prices.
- Partial/full payment recording using Cash, UPI, Card, or Bank transfer labels.
- Outstanding balances after credits, bounded payments, returns, refund due, and refund settlement recording.
- Invoice print views and CSV exports.

Medicine sale and laboratory totals use server-owned catalog values. Manual service invoices intentionally use staff-entered line prices. These are separate behaviors.

Payment methods are accounting labels. There is no connected payment gateway, QR payment confirmation, webhook reconciliation, bank integration, insurance claim submission, or automated GST return filing.

### 2.7 Communication, reports, and interface

- Communication supports preparing patient messages for SMS, WhatsApp, or email. Every saved message remains a **draft with no provider connected**; no message is sent.
- Reports include operational counts and CSV downloads for patient, stock, expiry, laboratory, sales/collections, and purchasing records.
- Browser print views cover prescriptions, invoices, sample labels, released lab reports, and imaging reviews. Browser Print to PDF can save them; there is no separate server-side PDF generation service.
- Search, status filters, table pagination, empty states, action feedback, role-aware menus, responsive layouts, modal focus handling, and accessible form labels are present.
- `/` focuses search and Escape closes dialogs/notifications.
- Advanced report builders, scheduled delivery, cross-branch analytics, and financial forecasting are not included.

## 3. Technology and architecture

| Area                            | Current implementation                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| Frontend                        | React 19 with React DOM; JavaScript/JSX                                              |
| Build/development server        | Vite 7 and the React Vite plugin                                                     |
| Styling                         | Custom CSS, responsive breakpoints, DM Sans/Manrope font request with fallback fonts |
| Icons                           | Lucide React                                                                         |
| Backend                         | Node.js, ES modules, Express 5                                                       |
| Database                        | Node's built-in `node:sqlite`, using `DatabaseSync` and WAL mode                     |
| Authentication                  | scrypt password hashes and random server-side session tokens in HttpOnly cookies     |
| Local development orchestration | concurrently                                                                         |
| Integration tests               | Built-in `node:test` and HTTP requests                                               |
| Browser checks                  | Playwright with Chromium, pinned in package-lock.json                                |
| Formatting                      | Prettier                                                                             |

There is **no MySQL/PostgreSQL server, Redis, Docker setup, cloud database, hosted model, or external API key required** to run the existing local MVP.

```text
Browser
  |
  | Same-origin HTTP /api requests + session cookie
  v
React UI <---- Vite in development
  |           dist/ static files in production-build mode
  v
Express API and workflow actions
  |
  | Authorization + validation + SQLite transactions
  v
SQLite database
  |- records(collection, id, data JSON)
  |- sessions(token, userId, expires)
  `- Base64 report attachments stored as records
```

In development, Vite proxies `/api` to the Node server. In production-build mode, Node serves the generated `dist/` directory and the API from the same local origin.

The data model is intentionally lightweight: entity payloads are JSON records inside a real SQL database, rather than a normalized table per entity. Application code enforces relationships and workflow rules. See [architecture.md](architecture.md) for more detail.

## 4. Codebase map

```text
.
|-- client/
|   |-- main.jsx                 React shell, context, views, forms, login and print helpers
|   `-- styles.css               Design system, component styles and responsive layouts
|-- server/
|   |-- index.js                 Express API, auth, persistence, permissions and workflow rules
|   `-- seed.js                  Synthetic demo fixtures
|-- tests/
|   |-- workflows.test.js        11 integration tests for access and operational workflows
|   |-- persistence.test.js      2 tests for database reopen and clean initialization
|   `-- browser-check.mjs        End-to-end UI checks and screenshots
|-- .gitignore                   Local database, dependencies and generated-file exclusions
|-- architecture.md              Architecture and workflow invariants
|-- index.html                   Vite/React entry document
|-- package.json                 Application dependencies and npm scripts
|-- package-lock.json            Resolved dependency versions
|-- vite.config.js               React plugin, development proxy and build output
`-- README.md                    This handover guide
```

Created locally or supplied separately, and ignored by Git:

```text
node_modules/       Installed packages
dist/              Generated frontend build
data/               Default persistent database and its WAL/SHM companions
playwright-output/  Generated UI screenshots
reference/          Locally extracted reference-document images
.env                Optional local environment file; not automatically loaded
*.log               Local log files
```

The reference PDFs/images are not required to run the app and are not bundled in the repository. Development is currently organized in relatively large UI/backend files; splitting features into modules and introducing stronger schemas is part of the next engineering phase.

## 5. Clone and run

### 5.1 Prerequisites

- Git and permission to clone this repository.
- Node.js **22.13 or newer with `node:sqlite` support**, plus npm. The implementation was exercised locally with Node 25.9.0.
- A modern browser.
- Network access for initial npm installation; Chromium download is needed only for browser testing. Font requests may use the network; system fallback fonts are available.
- A writable project/database location. Start commands below assume the repository root is the current directory.

Check your tools:

```powershell
git --version
node --version
npm --version
```

### 5.2 Clone the correct branch

```powershell
git clone --branch medos --single-branch https://github.com/Raja-Jha-07/trading.git medos
cd medos
git branch --show-current
npm ci
```

`git branch --show-current` should print `medos`. `npm ci` installs from the committed lockfile. A private repository may require your normal GitHub authentication.

### 5.3 Run the built application

```powershell
npm run build
npm start
```

Open [http://127.0.0.1:4000](http://127.0.0.1:4000).

- `npm run build` generates `dist/`.
- `npm start` launches Node/Express and serves that build.
- First launch creates a database and, by default, demo records.
- Leave the terminal running. Use Ctrl+C to stop the application.
- Rebuild after frontend changes; restarting Node alone does not regenerate `dist/`.

### 5.4 Development mode

```powershell
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

This starts the Node watcher on port 4000 and Vite on port 5173. Vite refreshes frontend changes during development. If Vite chooses another port because 5173 is occupied, free 5173 or update the backend origin policy deliberately; it currently allows the standard local development origins.

Do not run `npm start` and `npm run dev` simultaneously against the same backend port. Stop one before starting the other.

### 5.5 npm scripts

| Command           | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `npm ci`          | Reproduce the committed dependency installation                 |
| `npm run dev`     | Start Node watcher and Vite for development                     |
| `npm run build`   | Compile the frontend into `dist/`                               |
| `npm start`       | Start the Node API and serve an existing frontend build         |
| `npm test`        | Run integration and persistence tests                           |
| `npm run test:ui` | Run Chromium UI checks against an isolated test server          |
| `npm run format`  | Format application/test source and configuration using Prettier |

## 6. Demo accounts and permissions

### 6.1 Demo login

The login screen includes role shortcuts. For a normal fresh demo installation, the password for every account is:

```text
Dyvora@2026
```

| Email                    | User name       | Role           | Main workspace                                                           |
| ------------------------ | --------------- | -------------- | ------------------------------------------------------------------------ |
| admin@dyvora.local       | Rohit Sharma    | Admin          | Administration and all operational modules                               |
| doctor@dyvora.local      | Dr. Aditi Verma | Doctor         | Patient/appointment/consultation, prescription, lab and imaging review   |
| pharmacy@dyvora.local    | Rahul Sharma    | Pharmacist     | Inventory, pharmacy operations and billing                               |
| lab@dyvora.local         | Ravi Singh      | Lab technician | Test catalog, laboratory orders, sample processing and result submission |
| pathologist@dyvora.local | Dr. Sana Khan   | Pathologist    | Laboratory catalog/orders, verification and release                      |

These are deliberately public demo credentials, not production secrets. Setting `ADMIN_PASSWORD` before first initialization overrides the initial password; in demo mode this override applies to all seeded user accounts, even though the variable is named ADMIN_PASSWORD.

### 6.2 Permission behavior

| Capability                                  | Admin | Doctor                      | Pharmacist | Lab technician | Pathologist |
| ------------------------------------------- | ----- | --------------------------- | ---------- | -------------- | ----------- |
| User/role and clinic administration         | Yes   | No                          | No         | No             | No          |
| Patient registration/profile changes        | Yes   | Yes                         | No         | No             | No          |
| Doctor master/fee management                | Yes   | No                          | No         | No             | No          |
| Appointment/queue workflow                  | Yes   | Assigned doctor for actions | No         | No             | No          |
| Sign consultations                          | Yes   | Linked doctor profile       | No         | No             | No          |
| Review prescriptions                        | Yes   | Yes                         | Yes        | No             | No          |
| Dispense/counter sales and stock operations | Yes   | No                          | Yes        | No             | No          |
| Billing/payment/refund recording            | Yes   | No                          | Yes        | No             | No          |
| Create lab orders                           | Yes   | Yes                         | No         | Yes            | Yes         |
| Maintain test catalog                       | Yes   | No                          | No         | Yes            | Yes         |
| Collect/process/submit laboratory results   | Yes   | No                          | No         | Yes            | Yes         |
| Verify and release laboratory reports       | Yes   | No                          | No         | No             | Yes         |
| Imaging report workflow                     | Yes   | Assigned doctor for review  | No         | No             | No          |
| Communication drafts and audit UI           | Yes   | No                          | No         | No             | No          |

Menus are role-aware, and the API separately checks write/workflow access. Bootstrap data also differs by role: laboratory users do not receive invoices or consultation notes, and pharmacists do not receive consultation notes. Relevant patient/doctor information is shared where needed to operate each workspace. Doctor clinical reads currently cover clinic records; this is not a comprehensive per-patient authorization model.

A Doctor login and a doctor master record are different entities. Create the doctor profile first, then link the new Doctor user to it in Users & roles. Creating a doctor profile alone does not create a login.

Other current details:

- New-user passwords require at least 10 characters.
- An administrator cannot deactivate their own account or demote their own account through the current update API.
- Sessions last eight hours and are stored in SQLite; inactive users are rejected on subsequent authenticated requests.
- There is no password reset/change flow, MFA, SSO, or general session-management screen yet.

## 7. Data, cloning, persistence, and backups

### 7.1 What happens after cloning?

| Scenario                                                        | Result                                                                            |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Clone `medos`, install, build and start with default settings   | A new local database is created with demo data                                    |
| Restart the same checkout using the same database path          | Existing records remain; demo fixtures are not reinserted                         |
| Push/pull application code                                      | The ignored local database does not travel through Git                            |
| Clone onto another computer                                     | That computer gets a separate new database unless you transfer an existing one    |
| Set DEMO_MODE=false with a new database path and ADMIN_PASSWORD | Initialize only an administrator and clinic settings                              |
| Set DEMO_MODE=false against an existing populated database      | Existing data remains; this flag does not clean or migrate it                     |
| Rename the default data folder, then start in default demo mode | A fresh demo database is created; the renamed database stays in the backup folder |
| Delete the only copy of the database                            | User-entered records cannot be reconstructed from source code                     |

**Cloning the repository is enough to recreate the supplied synthetic fixtures. It does not recreate your subsequently entered records.**

### 7.2 Where records live

Default path:

```text
data/dyvora.sqlite
```

SQLite uses WAL mode, so these companion files can also exist while the app runs:

```text
data/dyvora.sqlite-wal
data/dyvora.sqlite-shm
```

The database includes patient and staff records, password hashes, server-side sessions, clinical notes, stock, invoices, audit records, and uploaded report contents. Attachments are base64 payloads in SQLite records, not separate public files.

The entire `data/` directory is ignored by Git. If you configure DB_PATH elsewhere, that new location is not automatically protected by the existing `data/` ignore rule; keep it outside the repository or explicitly ignore it before committing anything.

### 7.3 Default first-launch fixtures

These counts describe the source fixtures, not a running clinic after edits:

| Record type           | Seeded count |
| --------------------- | ------------ |
| User logins           | 5            |
| Patients              | 8            |
| Doctor profiles       | 3            |
| Appointments          | 8            |
| Medicines             | 8            |
| Stock batches         | 8            |
| Laboratory tests      | 5            |
| Laboratory orders     | 5            |
| Suppliers             | 2            |
| Signed consultations  | 1            |
| Pending prescriptions | 1            |
| Invoices              | 2            |
| Clinic settings       | 1            |

Purchases, purchase orders, returns, transfers, counter sales, imaging reports, messages, and activity logs are populated as you use their workflows. Demo opening batches are fixtures; their historical ledger is not reconstructed.

The demo appointment dates are assigned when seeding first runs. If you reopen an older database on a later day, the Today view may be empty. Check All appointments or book a new appointment; the old records have not disappeared.

Seed logic lives in [server/seed.js](server/seed.js). User initialization lives in [server/index.js](server/index.js). The initialization guard checks whether any users already exist. Editing seed.js does not automatically update an existing database, and there is no general fixture migration command.

### 7.4 Back up or transfer existing data

For this local MVP:

1. Stop the app normally, including any development Node process writing to the same database.
2. Copy the entire `data` folder, including any remaining SQLite companion files, to a secure location outside the repository.
3. To transfer the installation, clone/install the application on the destination and copy this folder into the cloned project before starting it.
4. If using DB_PATH, configure the destination to use the transferred database's actual path.
5. Start the app and check patient counts, a known record, and any attached report.

Example backup commands for the default folder, **after stopping the app**:

```powershell
$backupRoot = Join-Path $env:USERPROFILE 'DyvoraBackups'
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
$backupDestination = Join-Path $backupRoot ('dyvora-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item -LiteralPath .\data -Destination $backupDestination -Recurse
```

This example creates a backup outside the cloned repository. Protect database copies as sensitive data, including their staff/session information. A live single-file copy can omit committed data still in the WAL; use a proper SQLite backup procedure if the service cannot be stopped. An automated backup/restore service is not included.

CSV exports are reports, not a complete backup: there is no CSV import/restore pipeline, and they do not preserve all relationships, sessions, and attachments.

### 7.5 Generate a new demo safely

For the default `data` directory, stop the app, use a terminal without custom DEMO_MODE/DB_PATH/ADMIN_PASSWORD overrides, then:

```powershell
Rename-Item -LiteralPath .\data -NewName ('data-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
npm start
```

This generates new demo records; it does not recover previously lost records. Keep the renamed backup secure and out of Git: renamed folders such as `data-backup-*` are not covered by the current `data/` ignore rule. Move the backup outside the repository before staging changes.

## 8. Environment configuration

| Variable                 | Default                                            | When read / effect                                                                                                  |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| PORT                     | 4000                                               | Backend listening port; the host is hardcoded to 127.0.0.1                                                          |
| DB_PATH                  | Absolute project path ending in data/dyvora.sqlite | Selects persistent database storage; a relative override is resolved from the launching process's working directory |
| DEMO_MODE                | Enabled unless the value is exactly `false`        | Controls first-database initialization and demo labelling; does not erase populated data                            |
| ADMIN_PASSWORD           | Dyvora@2026 in demo mode                           | Initial user password; mandatory for fresh non-demo initialization; does not reset existing passwords               |
| SECURE_COOKIE            | Disabled unless the value is exactly `true`        | Adds the Secure attribute to session cookies; requires HTTPS for normal browser use                                 |
| DYVORA_PLAYWRIGHT_MODULE | playwright                                         | Optional UI-test module override; normal clones should leave this unset                                             |

No `.env` file is committed, no `.env.example` is supplied, and `npm start`/`npm run dev` do **not** automatically load `.env`. The backend does not use dotenv.

Use shell environment variables, your deployment's environment configuration, or explicitly load a local .env file with a compatible Node invocation:

```powershell
node --env-file=.env server/index.js
```

That command requires a file you have created locally; it is not needed for default demo operation. The existing .gitignore excludes `.env`, but not every possible `.env.*` filename. Do not commit secret-bearing files under other names.

A PORT override is not a complete development-port reconfiguration. The Vite proxy in [vite.config.js](vite.config.js) still targets port 4000, the backend origin allowlist includes local ports 4000/5173, and the UI-test server uses 4001. Update the relevant configuration together when changing ports.

Some calendar logic explicitly uses Asia/Kolkata and display formatting uses en-IN/INR. Clinic settings are not yet a complete timezone, internationalization, or multicurrency configuration system.

## 9. Starting without demo data

This initializes an empty database for development/configuration. It does not make the application production-ready.

In PowerShell from the repository root:

```powershell
$env:DEMO_MODE = 'false'
$env:ADMIN_PASSWORD = 'replace-with-a-long-unique-password'
$env:DB_PATH = Join-Path (Get-Location).Path 'data\clinic.sqlite'
npm run build
npm start
```

Replace the password placeholder before running. Ensure clinic.sqlite is new if you want an empty initialization. Existing databases are intentionally retained.

Initial result:

- One active administrator: admin@dyvora.local.
- Its password is your ADMIN_PASSWORD value.
- One basic clinic-settings record.
- No patients, doctor profiles, appointments, medicines, suppliers, tests, or clinical transactions.

Initial configuration order:

1. Sign in and complete clinic name, address, city, phone and email in Settings.
2. Add doctor profiles, specialties and fees.
3. Create staff users; link Doctor accounts to their doctor profiles.
4. Add pharmacy suppliers and medicine catalog entries. Configure price, tax, reorder level, unit and sale policy deliberately.
5. Record opening stock or received purchases with valid batches, costs, locations and future expiry.
6. Add laboratory catalog tests, prices, sample types, units and reference information.
7. Register patients and begin scheduling.
8. Exercise the complete clinical, lab, stock and billing workflows with synthetic records before any operational use.

The login UI still contains its demo shortcuts and prefilled demo credentials even when DEMO_MODE=false. Use the actual account credentials; removing those demo UI elements is a required deployment change. ADMIN_PASSWORD affects first initialization only; changing it later does not rotate a stored password.

## 10. End-to-end operating guide

Use synthetic data to explore these flows. Features enforce workflow order, so records should be created through their relevant screens rather than inserted directly into the database.

### 10.1 Patient to completed consultation

1. Sign in as Admin.
2. Open Patients and choose Register patient.
3. Enter demographic/contact details, blood group and known allergies. Save the profile.
4. Open Appointments and choose New appointment.
5. Select the patient and doctor, choose date/time and visit type, and enter the reason.
6. Check in the scheduled patient. The status changes to Waiting.
7. Open Live queue and call the patient. The status changes to In consultation.
8. Open Consult. Confirm patient identity, allergies and the correct doctor.
9. Enter presenting complaint, vitals with units, assessment and care/follow-up notes.
10. Add prescription items if needed. Enter medicine, quantity and explicit clinical instructions.
11. Sign the consultation. The visit completes, the consultation invoice is created, and any prescription enters the pharmacy queue.
12. Reopen the patient's timeline to review the signed information.

A Doctor login can perform the relevant clinical actions for its linked doctor profile. The seeded Doctor login is linked to DR-101; it is not a universal login for all three doctor profiles.

### 10.2 Prescription to payment

1. Sign in as Pharmacist or Admin.
2. Open Prescriptions, or Pharmacy > Prescription queue.
3. Open the pending prescription and review patient, allergies, prescriber, instructions and available quantities.
4. Choose Dispense & create bill.
5. The server allocates first-expiring valid stock, records movements and creates the medicine invoice in a transaction.
6. Open Billing & payments, choose Collect payment, and enter the amount/method actually collected.
7. Print the invoice if needed.

If stock is insufficient, receive valid stock or resolve the prescription with the clinician. The app does not automatically substitute a medicine or change a dose.

### 10.3 Counter sale

1. Ensure the medicine is explicitly configured as Non-prescription in Inventory and has valid available stock.
2. Open Pharmacy > POS billing and start a New counter sale.
3. Select the registered patient.
4. Choose an existing signed pending prescription, or select non-prescription medicines and quantities for a counter sale.
5. Create the invoice. Stock is deducted using the same expiry-aware allocation principles.
6. Record the actual payment in Billing & payments.

An unidentified walk-in customer record is not automatically created. Patient registration is handled through the patient workflow by an authorized user.

### 10.4 Purchasing and stock management

1. Create or select a supplier.
2. Create a purchase order with medicines, quantities and estimated costs if needed.
3. On receipt, open Receive from the order and enter the supplier invoice number, actual batch numbers, future expiry and costs.
4. Receive the complete ordered quantities. The purchase adds batches/stock and the order becomes Received.
5. A standalone Purchase entry can record a supplier invoice without a purchase order.
6. Use Stock ledger to inspect the recorded movements.
7. Use Adjust stock for a counted gain/loss, with a clear reason.
8. Use Stock transfers to move a quantity to a different location.
9. Review low-stock and expiry indicators manually; these do not automatically send messages or place orders.

Batch transfers change internal locations, not ownership between independent clinic tenants. Receiving an order does not send anything to a supplier or settle supplier accounts through a bank.

### 10.5 Laboratory order to released report

1. Create a lab order for a patient/referring doctor and select catalog tests.
2. Review the calculated amount. Saving the order also creates its invoice.
3. A technician opens the order and collects the sample; the app assigns a sample ID.
4. Print the sample label if required, then start processing.
5. Enter results with the appropriate test names, units, reference information and laboratory comments.
6. Optionally attach a PDF/JPEG/PNG report while the order remains editable.
7. Submit for approval.
8. A pathologist or administrator verifies the report, then releases it.
9. Open/print the released report and record any collected payment against its invoice separately.

The app does not calculate test findings or infer that a report is clinically normal. The approved laboratory workflow and competent staff remain responsible for results and reference information.

### 10.6 Imaging report review

1. Open Laboratory > Imaging review as Admin or Doctor.
2. Add the patient, reviewing doctor, modality, body part, study date and reporting radiologist name.
3. Enter the radiology findings as reported and attach a permitted report/image if available.
4. The assigned doctor reviews the report and enters follow-up notes.
5. Sign the review. The report is marked Reviewed and appears in the patient timeline.

This flow records a radiology report and review. It does not acquire scans or replace a diagnostic PACS viewer.

### 10.7 Return, credit and refund

1. Open Pharmacy > Returns and select the original pharmacy invoice.
2. Select the returned medicine, quantity and reason.
3. Process the return. The app validates previously returned quantities, records the return as quarantined, and credits the invoice.
4. If collected money now exceeds the credited invoice's net amount, a refund due appears in Billing & payments.
5. Return the money using the agreed real-world method outside this MVP.
6. Record the refund settlement in the app for the amount actually returned.

A return does not automatically restock medicine, and a refund action does not contact a bank. Original invoice, credit, paid amount, refund due and refund settlement are distinct values.

## 11. API and data model

### 11.1 API overview

All application routes use the `/api` prefix. Authentication uses the browser session cookie; no public JWT/token API key is required. Except for health and login, API access requires an active authenticated user.

| Method / route             | Purpose                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------- |
| GET /api/health            | Public local health response and demo flag                                              |
| POST /api/auth/login       | Authenticate email/password; set session cookie                                         |
| GET /api/auth/me           | Current user and demo flag                                                              |
| POST /api/auth/logout      | Delete the current session and clear its cookie                                         |
| GET /api/bootstrap         | Return role-filtered workspace collections and current user                             |
| POST /api/:collection      | Create supported master/operational records, subject to role and validation             |
| PATCH /api/:collection/:id | Update supported patient, doctor, medicine, supplier, catalog, settings or user records |
| POST /api/actions/:action  | Execute a validated workflow action                                                     |
| POST /api/attachments      | Upload a report's base64 content with collection, recordId and name                     |
| GET /api/attachments/:id   | Authenticated PDF/image retrieval with role checks                                      |

Workflow action names:

| Action        | Purpose                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| appointment   | Queue/check-in/cancel transitions                                              |
| consult       | Sign a consultation, create any prescription and its consultation invoice      |
| lab           | Move through sample/result/approval/release stages                             |
| imaging       | Record assigned-doctor review notes and finalize the review                    |
| dispense      | Issue a signed prescription, deduct batches and create its invoice             |
| pos           | Issue eligible non-prescription catalog medicines and create a counter invoice |
| purchase      | Receive supplier stock, optionally close a linked purchase order               |
| purchaseOrder | Cancel an open purchase order                                                  |
| adjust        | Apply a reasoned stock quantity change                                         |
| transfer      | Split/move a batch quantity to another location                                |
| payment       | Record a bounded payment against an invoice                                    |
| return        | Record a bounded pharmacy return and invoice credit                            |
| refund        | Record settlement against an existing refund due                               |

Actions use explicit server rules; the generic create/update routes do not provide unrestricted editing of signed prescriptions, clinical notes, stock ledgers, audit entries, or workflow states. There is no general DELETE API and no OpenAPI/Swagger specification yet. Review server/index.js before building an external client; payloads are currently defined in application code and forms rather than a published versioned API contract.

### 11.2 Persistent structures

```sql
CREATE TABLE records (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (collection, id)
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expires INTEGER NOT NULL
);
```

Important entity collections:

| Group              | Collections                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| People and access  | patients, doctors, users, settings                                                   |
| Clinical           | appointments, consultations, prescriptions, labs, imaging, catalog                   |
| Pharmacy           | medicines, batches, suppliers, purchases, purchaseOrders, ledger, transfers, returns |
| Financial          | invoices; payments/credits/refunds are represented on invoice records                |
| Supporting records | communications, audit, attachments                                                   |

Relationships use IDs stored inside JSON payloads. For example, an appointment links patientId and doctorId; a prescription links medicine IDs and may link a consultation; an invoice may reference its prescription, lab order or consultation. Attachments reference their owning lab/imaging record.

### 11.3 Existing safeguards and their limits

- Password hashing uses scrypt with per-user random salts; hashes/salts are removed from returned user objects.
- Cryptographically random session tokens are persisted in SQLite and expire after eight hours.
- Cookies are HttpOnly and SameSite=Strict; Secure is configurable for HTTPS.
- Login attempts are limited per IP to 20 failed attempts in a ten-minute window. The throttle is in process memory, not a distributed/persistent rate-limit service.
- Requests receive basic browser-protection headers and non-GET origin checks for the configured local/same-origin use case.
- Important inventory, prescribing, purchase and financial workflow mutations use SQLite transactions.
- Report uploads enforce a 5 MB decoded-file limit, PDF/JPEG/PNG signatures, a sanitized display filename, authenticated access and finalized-report replacement rules.
- Signed clinical records and audit/ledger records have no general edit/delete routes.

These controls do not establish production compliance. Audit data is not cryptographically tamper-evident; a database administrator can change it. File-signature checks are not antivirus scanning or full document validation. Permission checks need a broader record-access/security review. The current proxy/origin handling is designed for local operation, not an arbitrary hosted deployment.

## 12. Tests and verification

### 12.1 Integration and persistence tests

```powershell
npm test
```

There are currently **13 tests** across workflows.test.js and persistence.test.js. The implemented baseline passed these tests during development.

Coverage includes:

1. Authentication, role-filtered reads and prohibited writes.
2. Registration, booking conflicts, token assignment and queue transitions.
3. Consultation signing and duplicate signing prevention.
4. Server-priced dispensing, stock deduction and duplicate dispense rejection.
5. Full rollback when a later prescription item lacks stock.
6. Payments, credits and return quantity limits.
7. Lab results submission and pathologist-only verification/release permissions.
8. Purchases, supplier invoice uniqueness and negative-adjustment prevention.
9. Purchase-order quantity matching and location-transfer stock conservation.
10. Refunds bounded by credited overpayments.
11. Imaging review and authorized attachment reads/uploads.
12. Counter-sale policies, taxes, expiry exclusion and earliest-expiry allocation.
13. Database reopen/session persistence without reseeding, and clean non-demo initialization.

This list groups related assertions; several behaviors are checked inside one test. Workflow tests use an isolated in-memory database; the persistence test uses a temporary on-disk database and cleans it up. They do not intentionally reset your normal data/dyvora.sqlite.

### 12.2 Build verification

```powershell
npm run build
```

A successful build confirms the frontend bundles. It does not exercise clinical, stock or billing behavior by itself.

### 12.3 Browser checks

In a terminal using default demo settings, without custom DEMO_MODE/ADMIN_PASSWORD overrides:

```powershell
npm run build
npx playwright install chromium
npm run test:ui
```

The UI test serves an isolated in-memory app on port **4001** and opens headless Chromium. Keep that port free. It uses the built dist files, so rebuild first. A normal installation should use the project's installed Playwright package; DYVORA_PLAYWRIGHT_MODULE is an optional runtime override and is not needed.

Checks include:

- All navigation workspaces open.
- Search retains focus and filters patient records.
- Patient and medicine registration.
- Lab ordering, imaging report entry/review, and purchase-order receiving.
- Stock transfers, batch entry and counter billing.
- Prescription dispensing and payment recording.
- Consultation signing and lab workflow through verified release.
- Mobile layout/navigation and horizontal-overflow checks.
- Each of the five login roles.
- No captured browser runtime errors during these flows.

Screenshots are generated in playwright-output/ and ignored by Git. Printing dialogs, actual external message/payment delivery, high load, all accessibility criteria, and every malformed API input are not exhaustively covered. The test suite is useful regression evidence, not clinical certification or a full security assessment.

### 12.4 Documentation checks

```powershell
npx prettier --check README.md
git diff --check
```

For documentation-only changes these are appropriate checks; changes to API/workflow/UI code should also run the relevant automated tests and build.

## 13. What to add after cloning

### 13.1 Required only to run the existing demo

No additional feature implementation is necessary to explore the current local application. You need:

- The medos branch source.
- A compatible Node/npm installation.
- Installed npm dependencies.
- A generated frontend build for npm start.
- A writable SQLite path.

API keys, a MySQL setup, messaging accounts and payment credentials are **not** necessary for the existing demo.

### 13.2 Configure before evaluating an empty clinic installation

- Initialize a separate non-demo database and protect its administrator password.
- Complete clinic details.
- Create doctor profiles, fees and correctly linked staff accounts.
- Maintain the medicine, supplier, batch and lab-test catalogs.
- Configure medicine sale policy, tax and reorder levels deliberately.
- Establish a secure backup location and test a restore.
- Train users on the exact consultation, lab approval, dispensing, return and payment flows.

These are data/configuration tasks; the current code provides their main operational screens. They are separate from the engineering work below.

### 13.3 Priority 0: before handling real clinical data or public hosting

| Workstream          | What remains to implement or validate                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deployment          | Hosting/service configuration, HTTPS termination, explicit origin/proxy policy, secure cookies, process supervision and deployment configuration   |
| Authentication      | Remove demo login UI/defaults, password change/reset and recovery, suitable password policy, MFA/SSO if required, session revocation/cleanup       |
| Authorization       | Formal permission matrix, patient/department record-access rules, report-access review and regression tests                                        |
| API validation      | Consistent request schemas and field allowlists on all mutation paths; broader invalid-input and access-control testing                            |
| Privacy             | Consent, purpose/access restrictions, retention/deletion rules, secure export handling and jurisdiction-specific review                            |
| Encryption          | Storage/backup encryption with managed keys; transport security beyond loopback HTTP                                                               |
| File handling       | Antivirus/content validation, storage quotas, lifecycle/retention controls and stronger document-processing isolation                              |
| Audit               | Tamper-evident or externally retained audit evidence, privileged-access tracking and operational log review                                        |
| Resilience          | Scheduled consistent backups, encrypted offsite copies, proven restore procedures and disaster recovery targets                                    |
| Clinical governance | Clinician-approved workflows, prescription/result review, corrections/amendments, downtime procedures and validation by the deploying organization |
| Operations          | Structured logs, monitoring, alerting, deployment health/readiness, error reporting, capacity limits and incident response                         |

There is no production infrastructure-as-code, container deployment, automated backup scheduler, dedicated secret manager integration, or CI workflow on this branch at present. Do not assume these exist because the repository's other branch has its own deployment files.

### 13.4 Priority 1: external service integrations

| Integration                          | Current behavior                         | What must be added                                                                                                    |
| ------------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| SMS / WhatsApp / email               | Draft messages only                      | Provider account, credentials, templates/consent controls, send queue, retries, delivery callbacks and status history |
| Payments / UPI / cards               | Staff records money collected/refunded   | Provider checkout, payment webhooks, idempotency, reconciliation, actual refunds and failure recovery                 |
| Laboratory analyzers                 | Staff enters findings                    | Device/vendor interfaces, identifiers, structured analyte mappings, validation and result reconciliation              |
| PACS / RIS / DICOM                   | Transcribed findings plus PDF/images     | Diagnostic viewer/service, secure study access, identity matching and supported acquisition/worklist integration      |
| Clinical terminology/drug data       | Staff maintains catalog and instructions | Licensed/approved source where needed, versioning, terminology matching and clinician-validated decision support      |
| Electronic prescriptions / insurance | No connected external service            | Applicable systems, contracts, authentication, schemas, reconciliation and regulatory validation                      |

Provider-specific credentials should be added only when implementing that integration, through approved runtime secret configuration. There are no current code paths where merely pasting an SMS/payment key will activate delivery.

### 13.5 Priority 2: remaining product scope

**Administration and appointments**

- Doctor shift/leave calendars, configurable slots, holiday rules and rescheduling workflows.
- External patient booking, patient login and appointment reminders if required.
- More detailed queue routing, priority handling and multi-department/room assignment.
- Multibranch tenancy, clinic isolation and branch-specific permissions.

**Clinical**

- Structured vitals and longitudinal charts rather than free-text vitals.
- Structured diagnoses/procedures, versioned templates and attachments across clinical record types.
- Documented correction/amendment workflows for signed notes and reports.
- Clinician-validated allergy, interaction and dosing safeguards, with appropriate reference data.
- Qualified electronic signatures and external prescription formats where applicable.

**Pharmacy**

- Spreadsheet import/export with validation, preview and duplicate handling.
- Held/resumable POS carts, additional checkout controls and explicit discount policy.
- Partial PO receiving, backorders and supplier account settlement/reconciliation.
- Supplier-side returns, purchase returns and exchanges.
- Category/unit/manufacturer master management and barcode generation/scanner support.
- Replenishment planning and controlled stock-disposal/quarantine-release processes.
- Advanced GST/invoicing requirements and statutory reports validated for the deployment.

**Laboratory and imaging**

- Structured test panels and individual result fields with versioned units/reference ranges.
- Abnormal/critical flags and acknowledged escalation workflows.
- Specimen tracking, rejection/recollection and chain-of-custody requirements.
- Amended reports, verification history and additional specialist roles.
- Dedicated imaging workflows beyond recorded report review.

**Finance and reports**

- Refund/payment transaction history rather than relying primarily on invoice aggregate fields.
- Receipts, credit-note documents, reconciliation, supplier payables and insurance support.
- Validated reporting definitions, date ranges, scheduled reports and advanced analytics.

### 13.6 Priority 3: engineering scale and maintainability

- Split the large client and server files into feature modules, services and reusable components.
- Introduce TypeScript or explicit shared schemas/contracts and API documentation.
- Normalize entities into indexed SQL tables with foreign keys and versioned migrations as scale requires.
- Add server-side pagination/search and query-driven reporting instead of loading whole role-visible collections in bootstrap.
- Plan concurrent-user/load behavior; synchronous SQLite access and single-service operation need evaluation for larger workloads.
- Add job processing for external communications, imports and integrations.
- Expand tests for authorization boundaries, malformed payloads, concurrent operations, accessibility, recovery and deployment behavior.
- Add CI for dependency installation, integration tests, build and appropriate browser checks.
- Formalize offline behavior, localization, timezone and currency configuration if required.

This roadmap distinguishes missing implementation from completed local workflows. Prioritize it with the clinic's actual workflow, legal obligations, team size and deployment plan; it is not a promise that every reference mockup feature is already present.

## 14. Troubleshooting

| Symptom                                                                          | Likely cause / action                                                                                                                              |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| The clone contains tradingco-backend/tradingco-frontend instead of client/server | You are on main. Clone or switch to medos before installing this app                                                                               |
| node:sqlite cannot be imported                                                   | Use a compatible Node version with built-in SQLite; a separate npm sqlite package is not used here                                                 |
| npm ci fails because of a lockfile/dependency mismatch                           | Confirm the clone/branch is clean and use its committed package.json and package-lock.json together; do not mix files from another branch          |
| Backend reports EADDRINUSE on 4000                                               | Another service or a second copy of this app uses the port; stop the duplicate or deliberately reconfigure the relevant ports                      |
| Vite opens on another port and writes are rejected                               | The current origin policy expects the default local ports; free 5173 or update the origin/proxy configuration                                      |
| Browser shows no application after npm start                                     | Run npm run build first; Node serves dist only when it exists at startup, so restart after creating it                                             |
| Frontend changes are missing                                                     | Rebuild dist for npm start, or use npm run dev                                                                                                     |
| Demo login fails after setting ADMIN_PASSWORD                                    | On first initialization, that variable changes seeded passwords; use the configured password. Later changes do not reset existing credentials      |
| An empty-clinic launch fails requesting ADMIN_PASSWORD                           | DEMO_MODE=false requires a password when no users exist                                                                                            |
| An .env file appears to have no effect                                           | The npm scripts do not load it; set shell variables or explicitly use node --env-file=.env                                                         |
| Login works over local HTTP until SECURE_COOKIE=true                             | Secure cookies require HTTPS for normal use; keep local HTTP development configuration consistent                                                  |
| Today has no appointments                                                        | Existing demo bookings may belong to the database's first launch day; check All appointments or book a new visit                                   |
| A doctor cannot sign/review an assigned record                                   | Check the Doctor user's doctorId link and the doctor assigned to the appointment/report                                                            |
| A pharmacy sale is blocked                                                       | Check signed-prescription state or Non-prescription policy, stock quantity and batch expiry                                                        |
| A PO cannot be received                                                          | Check supplier, open status, exact full-order quantities, invoice uniqueness, batch details and expiry                                             |
| A technician cannot verify a lab report                                          | This is intentional; use a Pathologist or Admin account                                                                                            |
| A report upload is rejected                                                      | Check file signature/type, decoded size under 5 MB, role, target record and finalization state                                                     |
| Printing opens nothing                                                           | Allow popups/print windows for the application origin                                                                                              |
| A message is still a draft                                                       | No delivery provider is implemented; saving a draft does not send it                                                                               |
| Money did not move after Record payment/refund                                   | Those actions record accounting events; external payment processing is not connected                                                               |
| UI tests fail to launch a browser                                                | Run npx playwright install chromium for the installed Playwright version                                                                           |
| UI tests fail to bind 4001                                                       | Stop the service occupying the test port                                                                                                           |
| UI tests fail with configured production/demo credentials                        | Run tests in a separate default-demo terminal without custom DEMO_MODE or ADMIN_PASSWORD overrides                                                 |
| Data differs after cloning                                                       | Each clone creates its own database. Transfer a stopped/consistent database backup to share existing records                                       |
| The database is locked or cannot be opened                                       | Check DB_PATH, write permissions and other processes accessing that file; stop duplicate writers and investigate rather than deleting the database |

Health check:

```powershell
Invoke-RestMethod 'http://127.0.0.1:4000/api/health'
```

A healthy default-demo server returns a status of ok and demo=true. This confirms API reachability, not external integrations or complete clinical readiness.

## 15. Development and contribution workflow

1. Work on medos or a feature branch based on medos.
2. Install dependencies with npm ci.
3. Use npm run dev for implementation.
4. Run tests/build relevant to your changes. Rebuild before UI checks.
5. Keep documentation aligned with actual features and unresolved boundaries.
6. Review git status and the staged diff before committing.
7. Exclude databases, report contents, secrets, generated builds and local backups from Git.
8. Commit and push the intended branch; do not accidentally publish these changes to the separate trading application's main branch.

Useful commands:

```powershell
git branch --show-current
git status --short --branch
git diff --check
git diff --stat
git diff --cached --name-only
```

The current ignore rules cover data/, node_modules/, dist/, reference/, playwright-output/, .env and *.log. They do not automatically cover custom database paths, renamed backup directories or all secret-file naming conventions. Check the actual staged file list.

For deeper implementation details, start with [architecture.md](architecture.md), [server/index.js](server/index.js), [client/main.jsx](client/main.jsx), and the [tests](tests/). No separate deployment, migration or external-integration package is included yet.
