# Dyvora Health OS

A connected clinic operations MVP built from the supplied admin/doctor flow charts and pharmacy/laboratory PDF mockups. React 19, Vite, Node.js/Express, and SQLite. All included patient and clinical records are synthetic demonstration data.

## Run locally

Requires Node.js 22.13+ (Node 24 LTS recommended; verified here on Node 25.9).

```powershell
npm install
npm run build
npm start
```

Open http://127.0.0.1:4000. For development, use `npm run dev` and open http://127.0.0.1:5173. The Vite development server proxies `/api` to Node on port 4000.

### Demo access

Password for every demo account: `Dyvora@2026`.

| Account                  | Role                               |
| ------------------------ | ---------------------------------- |
| admin@dyvora.local       | Administration                     |
| doctor@dyvora.local      | Doctor (linked to Dr. Aditi Verma) |
| pharmacy@dyvora.local    | Pharmacist                         |
| lab@dyvora.local         | Laboratory technician              |
| pathologist@dyvora.local | Pathologist                        |

The login page has role shortcuts. Demo data is seeded only when the database has no users; subsequent restarts preserve changes. Data is stored in `data/dyvora.sqlite`, including uploaded report bytes. The directory is excluded from Git. Demo credentials are intentionally public and are for local demonstration only.

## Implemented workflows

- **Administration:** dashboard with actual stored counts and a seven-day activity chart; patient registration/search/editing; doctor registration, fees and availability; appointments with conflict prevention; daily tokens; queue check-in, calling and cancellation; consultation/prescription monitoring; billing; CSV reports; users, roles and account deactivation; clinic settings; audit trail; communication drafts.
- **Doctor:** patient history and unified timeline; allergies; recorded vitals; presenting complaint, clinician-entered diagnosis, care plan and follow-up; signed consultations; multi-medicine prescriptions with quantity and free-text dose/route/frequency/duration; lab ordering/review; transcribed radiology reports, image/PDF attachments and assigned-doctor review.
- **Pharmacy:** medicine catalog and clinic-defined sale policy; batch quantities, costs, location and expiry; stock/expiry alerts; prescription review and dispensing; counter billing; supplier management; purchase orders and full-order receiving; purchase invoices; stock ledger; signed adjustments; location transfers; sale returns with credits and quarantining; bounded refund settlement recording.
- **Laboratory:** test catalog and pricing; multi-test orders and urgency; sample IDs/printable labels; collection, processing, manually entered results and reference ranges; authenticated PDF/PNG/JPEG report attachments; approval, verification and release; printable released reports.
- **Billing:** consultation and laboratory invoices created from their workflows; medicine invoices priced on the server; partial and full payment recording; tax from medicine catalog; credits/refund balances; printable invoices and CSV exports. Payment recording does not move money through a payment gateway.
- **Interface:** responsive desktop/tablet/mobile layouts, keyboard search, paginated tables, status filters, empty states, modal focus management, accessible labels, notifications derived from data, print views and CSV downloads.

### Connected care journey

1. Register a patient and book a doctor appointment.
2. Check in from Appointments, then call the patient from Live queue.
3. Open Consult, enter the clinical assessment, add medicines with explicit instructions, and sign. A consultation invoice is created; the prescription appears in the pharmacy queue.
4. Review the prescription and allergies. Dispense to allocate first-expiring valid batches, deduct stock and create a medicine invoice atomically.
5. Record payment in Billing & payments. Counter sales only allow medicines explicitly configured as Non-prescription by clinic staff; prescription-required medicines need a signed prescription.
6. Create lab orders. The system prices selected tests and creates a lab invoice. A technician collects the sample, starts processing and submits entered results. A pathologist or administrator verifies and releases the report.
7. View the patient timeline to review consultations, prescriptions and released lab results. Review imaging reports in Laboratory > Imaging review.

## Validation

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:ui
```

Integration tests use isolated in-memory databases and exercise authorization, appointment transitions/conflicts, consultation signing, transactional stock rollback, duplicate dispensing, expiry-aware allocation, server pricing, payments/credits/refunds, laboratory approval permissions, purchasing, transfers, imaging review and authenticated attachments. UI checks launch an isolated browser against a separate in-memory server on port 4001. Screenshots go to `playwright-output/`.

## Configuration

| Variable       | Default            | Purpose                                                |
| -------------- | ------------------ | ------------------------------------------------------ |
| PORT           | 4000               | Local API/application port                             |
| DB_PATH        | data/dyvora.sqlite | SQLite database location                               |
| DEMO_MODE      | true               | Set to false for an empty clinic installation          |
| ADMIN_PASSWORD | demo password      | Required for first initialization with DEMO_MODE=false |
| SECURE_COOKIE  | false              | Set true only behind HTTPS                             |

To initialize without demonstration records, use a **new database path** and set `DEMO_MODE=false` and a strong `ADMIN_PASSWORD` before first launch. This does not erase an existing database. The initial account is admin@dyvora.local. The server binds to loopback; public hosting requires an explicitly configured HTTPS reverse proxy and deployment review. The public demo login shortcuts must also be removed/disabled before operational use.

## Current boundaries

This is an executable MVP, not a certified clinical system. Clinical decisions and medicine policies are entered by authorized staff. It does not generate medical advice, interaction checks, dose calculations or clinical reference ranges.

The following need additional implementation/integration: SMS/WhatsApp/email delivery; payment gateways; insurance, e-prescribing and regulatory integrations; barcode scanner hardware/encoded labels; DICOM/PACS diagnostic viewers; external lab analyzers; automated drug databases; automated backups/restore; multi-tenant branches; formal data retention, encryption-at-rest/key management, MFA/SSO, consent and jurisdiction-specific compliance. Communication drafts are explicitly labelled unsent. Inventory bulk import, held POS carts, supplier-side purchase returns/exchanges and advanced GST filing reports from the reference mockups remain future enhancements. Uploaded files have size/type checks and authenticated access; antivirus scanning is not included.

See [architecture.md](architecture.md) for the service/data design and important invariants.
