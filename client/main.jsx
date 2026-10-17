import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Pill,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  TrendingUp,
  Users,
  Wallet,
  X,
  AlertTriangle,
  Mail,
  Building2,
  Printer,
  Eye,
} from "lucide-react";
import "./styles.css";
const currency = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dayLabel = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
}).format(new Date());
const humanDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";
const initials = (n) =>
  (n || "?")
    .replace("Dr. ", "")
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
const API = async (path, body, method) => {
  const r = await fetch("/api" + path, {
    credentials: "same-origin",
    method: method || (body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Request failed");
  return data;
};
const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      ["dashboard", "Overview", LayoutDashboard],
      ["patients", "Patients", Users],
      ["appointments", "Appointments", CalendarDays],
      ["queue", "Live queue", Clock3],
    ],
  },
  {
    label: "CLINICAL",
    items: [
      ["doctors", "Doctors", Stethoscope],
      ["consultations", "Consultations", ClipboardList],
      ["prescriptions", "Prescriptions", FileText],
      ["labs", "Laboratory", FlaskConical],
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      ["pharmacy", "Pharmacy", Pill],
      ["billing", "Billing & payments", Wallet],
      ["reports", "Reports & analytics", TrendingUp],
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      ["users", "Users & roles", ShieldCheck],
      ["communications", "Communication", Mail],
      ["audit", "Audit trail", Activity],
      ["settings", "Settings", Settings],
    ],
  },
];
const allowed = {
  Admin: navGroups.flatMap((g) => g.items.map((i) => i[0])),
  Doctor: [
    "dashboard",
    "patients",
    "appointments",
    "queue",
    "consultations",
    "prescriptions",
    "labs",
  ],
  Pharmacist: ["dashboard", "pharmacy", "prescriptions", "billing"],
  "Lab technician": ["dashboard", "labs"],
  Pathologist: ["dashboard", "labs"],
};
const descriptions = {
  patients: "Every patient. One connected record.",
  appointments: "Keep your day organized and your patients informed.",
  queue: "A clear view of every patient waiting for care.",
  doctors: "Your care team, schedules, and availability.",
  consultations: "Thoughtful care starts with a complete clinical picture.",
  prescriptions: "From the consultation room to the pharmacy counter.",
  labs: "Track samples, review results, and release verified reports.",
  pharmacy: "The right medicines, in the right place, at the right time.",
  billing: "Clear invoices. Seamless payments.",
  reports: "Turn everyday activity into a clearer picture.",
  users: "Give your team the right access.",
  communications: "Prepare patient messages for your communication channels.",
  audit: "A traceable record of changes across your clinic.",
  settings: "Make Dyvora work for your clinic.",
};
function Badge({ children }) {
  const s = String(children || "");
  const color =
    /Paid|Completed|Released|Available|Active|Verified|Dispensed|In stock|Signed|Received/.test(
      s,
    )
      ? "green"
      : /Urgent|Expired|Cancelled|Out of stock|Inactive/.test(s)
        ? "red"
        : /Waiting|Pending|Low stock|Unpaid|Expiring|Quarantined/.test(s)
          ? "amber"
          : "purple";
  return (
    <span className={"badge " + color}>
      <i />
      {s}
    </span>
  );
}
function Avatar({ name, index = 0 }) {
  return <span className={"avatar av" + (index % 5)}>{initials(name)}</span>;
}
function Empty() {
  return (
    <div className="empty">
      <div>
        <ClipboardList size={25} />
      </div>
      <h3>No records yet</h3>
      <p>New records will appear here.</p>
    </div>
  );
}
const WorkspaceContext = React.createContext(null);
function Chart() {
  const { chartDays } = React.useContext(WorkspaceContext);
  const max = Math.max(5, ...chartDays.map((x) => x.count));
  return (
    <div className="chart">
      <div className="chart-y">
        {[
          max,
          Math.round(max * 0.75),
          Math.round(max * 0.5),
          Math.round(max * 0.25),
          0,
        ].map((v, i) => (
          <span key={i}>{v}</span>
        ))}
      </div>
      <div className="chart-plot">
        <div className="chart-grid">
          {[1, 2, 3, 4, 5].map((i) => (
            <i key={i} />
          ))}
        </div>
        <div className="chart-bars">
          {chartDays.map((x, i) => (
            <div
              className={"chart-column " + (i === 6 ? "current" : "")}
              key={x.label}
            >
              <div
                className="bar-pair"
                title={`${x.label}: ${x.count} visits, ${x.completed} completed`}
              >
                <div style={{ height: `${(x.count / max) * 150}px` }} />
                <div style={{ height: `${(x.completed / max) * 150}px` }} />
              </div>
              <span>{x.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Stat({ label, value, icon: Icon, note, color = "purple" }) {
  const {} = React.useContext(WorkspaceContext);
  return (
    <article className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <div className={"stat-icon " + color}>
          <Icon size={19} />
        </div>
      </div>
      <strong>{value}</strong>
      <div className="stat-note">{note}</div>
    </article>
  );
}
function PatientCell({ id }) {
  const { data, lookup, open } = React.useContext(WorkspaceContext);
  const p = lookup("patients", id);
  return (
    <button className="patient-cell" onClick={() => open("patient", p)}>
      <Avatar
        name={p?.name}
        index={data.patients.findIndex((x) => x.id === id)}
      />
      <span>
        <b>{p?.name || "Unknown patient"}</b>
        <small>
          {p?.id} · {p?.age} yrs, {p?.gender}
        </small>
      </span>
    </button>
  );
}
function Table({ columns, rows, render, pageSize = 8 }) {
  const { page, tab, query, filter } = React.useContext(WorkspaceContext);
  const [slice, setSlice] = useState(1);
  useEffect(() => setSlice(1), [query, filter, tab, rows.length]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)),
    n = Math.min(slice, pages);
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice((n - 1) * pageSize, n * pageSize).map((r, i) => (
              <tr key={r.id || i}>
                {render(r, i).map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? (
        <Empty />
      ) : (
        <div className="pagination">
          <span>
            Showing {(n - 1) * pageSize + 1}–
            {Math.min(n * pageSize, rows.length)} of {rows.length} records
          </span>
          <div>
            <button
              disabled={n === 1}
              onClick={() => setSlice(n - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <button className="selected">{n}</button>
            <span>of {pages}</span>
            <button
              disabled={n === pages}
              onClick={() => setSlice(n + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
function AppointmentTable({ rows }) {
  const { user, busy, lookup, dname, open, action, iconButton } =
    React.useContext(WorkspaceContext);
  return (
    <Table
      rows={rows}
      columns={["Patient", "Doctor", "Time", "Visit type", "Status", "Action"]}
      render={(a) => [
        <PatientCell id={a.patientId} />,
        <span className="doctor-name">
          {dname(a.doctorId)}
          <small>{lookup("doctors", a.doctorId)?.specialty}</small>
        </span>,
        <span className="time-text">
          {a.time}
          <small>Token #{String(a.token).padStart(2, "0")}</small>
        </span>,
        a.type,
        <Badge>{a.status}</Badge>,
        <div className="row-actions">
          {a.status === "Scheduled" && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                action(
                  "appointment",
                  { id: a.id, status: "Waiting" },
                  "Patient checked in",
                )
              }
            >
              Check in <ArrowRight size={13} />
            </button>
          )}
          {a.status === "Waiting" && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                action(
                  "appointment",
                  { id: a.id, status: "In consultation" },
                  "Consultation started",
                )
              }
            >
              Call patient
            </button>
          )}
          {a.status === "In consultation" &&
            ["Admin", "Doctor"].includes(user.role) && (
              <button
                className="text-button"
                onClick={() => open("consult", a)}
              >
                Consult <ArrowRight size={13} />
              </button>
            )}
          {["Scheduled", "Waiting"].includes(a.status) &&
            iconButton(
              X,
              () =>
                action(
                  "appointment",
                  { id: a.id, status: "Cancelled" },
                  "Appointment cancelled",
                ),
              "Cancel appointment",
            )}
          {["Completed", "Cancelled"].includes(a.status) &&
            iconButton(
              Eye,
              () => open("patient", lookup("patients", a.patientId)),
              "Patient record",
            )}
        </div>,
      ]}
    />
  );
}
function Toolbar({
  placeholder = "Search records…",
  statuses = [],
  rows = [],
  name = "export",
}) {
  const { query, setQuery, filter, setFilter, exportCSV } =
    React.useContext(WorkspaceContext);
  return (
    <div className="toolbar">
      <div className="input-search">
        <Search size={17} />
        <input
          aria-label="Search records"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
      </div>
      <div className="toolbar-end">
        {statuses.length > 0 && (
          <label className="filter-select">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Filter by status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <button
          className="button secondary"
          onClick={() => exportCSV(rows, name)}
        >
          <Download size={15} />
          Export
        </button>
      </div>
    </div>
  );
}
function Dashboard() {
  const {
    user,
    data,
    page,
    filter,
    range,
    setRange,
    open,
    navigate,
    exportCSV,
    todayApts,
    activeQueue,
    totalReceived,
    lowStock,
    pendingLabs,
    chartDays,
  } = React.useContext(WorkspaceContext);
  return (
    <>
      <div className="page-heading">
        <div className="breadcrumb">
          Workspace <ChevronRight size={12} /> Overview
        </div>
        <div className="heading-line">
          <div>
            <h1>
              Your clinic, at a glance <span className="greeting-dot">✦</span>
            </h1>
            <p>A little more clarity. A little more room to care.</p>
          </div>
          <div className="heading-actions">
            <button
              className="button secondary"
              onClick={() => exportCSV(todayApts, "daily-appointments")}
            >
              <Download size={16} />
              Export report
            </button>
            {allowed[user.role].includes("appointments") && (
              <button
                className="button primary"
                onClick={() => open("appointment")}
              >
                <Plus size={17} />
                New appointment
              </button>
            )}
          </div>
        </div>
      </div>
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">CONNECTED CARE, SIMPLIFIED</span>
          <h2>
            Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
            {user.name.replace("Dr. ", "").split(" ")[0]} <span>☀</span>
          </h2>
          <p>
            You have{" "}
            <b>
              {
                todayApts.filter(
                  (a) => !["Cancelled", "Completed"].includes(a.status),
                ).length
              }{" "}
              appointments
            </b>{" "}
            lined up today. Let’s make every visit count.
          </p>
          <div className="banner-meta">
            <span>
              <i />
              Clinic is open
            </span>
            <span>
              <CalendarDays size={13} />
              {dayLabel}
            </span>
          </div>
        </div>
        <div className="banner-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="medical-cross">+</div>
          <div className="floating-card heart">
            <HeartPulse size={23} />
            <span>
              Care comes first<small>Every patient. Every day.</small>
            </span>
          </div>
          <div className="floating-card shield">
            <ShieldCheck size={19} />
            <span>Connected & secure</span>
          </div>
          <span className="star s1">✦</span>
          <span className="star s2">✧</span>
        </div>
      </section>
      <div className="section-caption">
        <h3>
          Today’s snapshot{" "}
          <span className="live-label">
            <i />
            Live overview
          </span>
        </h3>
        <button
          className="subtle"
          onClick={() => setRange(range === "Today" ? "All time" : "Today")}
        >
          <CalendarDays size={14} />
          {range}
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="stats-grid">
        <Stat
          label="Appointments today"
          value={todayApts.length}
          icon={CalendarDays}
          note={`${todayApts.filter((a) => a.status === "Completed").length} visits completed`}
        />
        <Stat
          label="Patients registered"
          value={data.patients.length}
          icon={Users}
          note="Total patient records"
          color="blue"
        />
        <Stat
          label="Revenue collected"
          value={currency(totalReceived)}
          icon={Wallet}
          note={range === "Today" ? "Collected today" : "All recorded payments"}
          color="green"
        />
        <Stat
          label="Patients in queue"
          value={activeQueue.length}
          icon={Clock3}
          note={`${todayApts.filter((a) => a.status === "In consultation").length} currently in consultation`}
          color="orange"
        />
      </div>
      <div className="dashboard-middle">
        <section className="card activity-card">
          <div className="card-heading">
            <div>
              <h3>Patient activity</h3>
              <p>A view of your clinic’s rhythm</p>
            </div>
            <span className="subtle">
              <CalendarDays size={14} />
              Last 7 days
            </span>
          </div>
          <div className="chart-summary">
            <strong>
              {chartDays.reduce((s, d) => s + d.count, 0)}
              <small>appointments</small>
            </strong>
            <div className="legend">
              <span>
                <i />
                Scheduled visits
              </span>
              <span>
                <i className="light" />
                Completed
              </span>
            </div>
          </div>
          <Chart />
        </section>
        <section className="card care-team">
          <div className="card-heading">
            <div>
              <h3>On duty today</h3>
              <p>Your people behind the care</p>
            </div>
            {allowed[user.role].includes("doctors") && (
              <button
                className="text-button"
                onClick={() => navigate("doctors")}
              >
                View all <ArrowRight size={14} />
              </button>
            )}
          </div>
          {data.doctors.slice(0, 3).map((d, i) => (
            <div className="team-row" key={d.id}>
              <Avatar name={d.name} index={i + 1} />
              <div>
                <b>{d.name}</b>
                <small>{d.specialty}</small>
              </div>
              <span
                className={
                  "availability " + (d.status === "Available" ? "" : "occupied")
                }
                title={d.status}
              />
            </div>
          ))}
          <div className="team-footer">
            <span className="pulse-dot" />
            {data.doctors.filter((d) => d.status === "Available").length}{" "}
            doctors available now
          </div>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="card appointment-card">
          <div className="card-heading">
            <div>
              <h3>
                Today’s appointments{" "}
                <span className="count-chip">{todayApts.length}</span>
              </h3>
              <p>A smooth day starts with a clear schedule</p>
            </div>
            <button
              className="text-button"
              onClick={() =>
                navigate(
                  allowed[user.role].includes("appointments")
                    ? "appointments"
                    : "labs",
                )
              }
            >
              View workspace <ArrowRight size={14} />
            </button>
          </div>
          <AppointmentTable rows={todayApts} />
        </section>
        <aside className="right-rail">
          <section className="card quick-card">
            <h3>Quick actions</h3>
            <p>A shortcut to what matters</p>
            <div className="quick-grid">
              {[
                ["patients", "patient", Users, "Register patient", "purple"],
                [
                  "appointments",
                  "appointment",
                  CalendarDays,
                  "Book appointment",
                  "blue",
                ],
                ["labs", "lab", FlaskConical, "Create lab order", "orange"],
                ["billing", "invoice", Wallet, "Create invoice", "green"],
              ]
                .filter(([p]) => allowed[user.role].includes(p))
                .map(([p, t, I, label, c]) => (
                  <button key={t} onClick={() => open(t)}>
                    <span className={c}>
                      <I size={20} />
                    </span>
                    {label}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
            </div>
          </section>
          <section className="attention-card">
            <div className="attention-icon">
              <Bell size={18} />
            </div>
            <div>
              <h3>A little attention needed</h3>
              <p>
                {pendingLabs.length} lab reports need approval and{" "}
                {lowStock.length} medicines need restocking.
              </p>
              <button
                onClick={() =>
                  navigate(
                    allowed[user.role].includes("pharmacy")
                      ? "pharmacy"
                      : "labs",
                  )
                }
              >
                Review items <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
function MainPage() {
  const {
    user,
    data,
    page,
    filter,
    range,
    setRange,
    lookup,
    pname,
    dname,
    open,
    action,
    exportCSV,
    todayApts,
    filtered,
  } = React.useContext(WorkspaceContext);
  const title =
    navGroups.flatMap((g) => g.items).find((i) => i[0] === page)?.[1] || page;
  const create = {
    patients: ["Register patient", "patient"],
    appointments: ["New appointment", "appointment"],
    doctors: ["Add doctor", "doctor"],
    consultations: ["New consultation", "consult"],
    labs: ["New lab order", "lab"],
    users: ["Add team member", "user"],
    communications: ["Draft message", "message"],
    billing: ["New invoice", "invoice"],
  };
  return (
    <>
      <div className="page-heading">
        <div className="breadcrumb">
          Workspace <ChevronRight size={12} />
          {title}
        </div>
        <div className="heading-line">
          <div>
            <h1>
              {title}
              {page === "queue" && (
                <span className="live-label">
                  <i />
                  Live
                </span>
              )}
            </h1>
            <p>{descriptions[page]}</p>
          </div>
          <div className="heading-actions">
            {["reports", "audit"].includes(page) && (
              <button
                className="button secondary"
                onClick={() =>
                  exportCSV(page === "audit" ? data.audit : data.invoices, page)
                }
              >
                <Download size={16} />
                Export report
              </button>
            )}
            {create[page] && (
              <button
                className="button primary"
                onClick={() => open(create[page][1])}
              >
                <Plus size={17} />
                {create[page][0]}
              </button>
            )}
          </div>
        </div>
      </div>
      {page === "patients" && (
        <section className="card">
          <Toolbar
            placeholder="Search patient name, UHID, or phone…"
            rows={data.patients}
          />
          <Table
            columns={[
              "Patient",
              "Contact",
              "Blood group",
              "Allergies",
              "Registered",
              "Action",
            ]}
            rows={filtered(data.patients)}
            render={(p) => [
              <PatientCell id={p.id} />,
              p.phone,
              <span className="blood-type">{p.bloodGroup || "—"}</span>,
              <span
                className={
                  p.allergies && p.allergies !== "None reported"
                    ? "allergy"
                    : ""
                }
              >
                {p.allergies || "Not recorded"}
              </span>,
              humanDate(p.createdAt),
              <button
                className="text-button"
                onClick={() => open("patient", p)}
              >
                Open record <ArrowRight size={14} />
              </button>,
            ]}
          />
        </section>
      )}
      {["appointments", "queue"].includes(page) && (
        <>
          <div className="mini-stats">
            {["Scheduled", "Waiting", "In consultation", "Completed"].map(
              (s) => (
                <div key={s}>
                  <span>{s}</span>
                  <strong>
                    {todayApts.filter((a) => a.status === s).length}
                  </strong>
                </div>
              ),
            )}
          </div>
          <section className="card">
            <div className="tabs">
              {["Today", "All appointments"].map((t) => (
                <button
                  className={
                    (
                      range === "Today"
                        ? t === "Today"
                        : t === "All appointments"
                    )
                      ? "active"
                      : ""
                  }
                  onClick={() => setRange(t === "Today" ? "Today" : "All time")}
                  key={t}
                >
                  {t}
                </button>
              ))}
            </div>
            <Toolbar
              rows={data.appointments}
              statuses={[
                "Scheduled",
                "Waiting",
                "In consultation",
                "Completed",
                "Cancelled",
              ]}
            />
            <AppointmentTable
              rows={filtered(
                (range === "Today" ? todayApts : data.appointments).filter(
                  (a) =>
                    page !== "queue" ||
                    ["Waiting", "In consultation"].includes(a.status),
                ),
              ).filter((a) => filter === "All" || a.status === filter)}
            />
          </section>
        </>
      )}
      {page === "doctors" && (
        <div className="doctor-grid">
          {filtered(data.doctors).map((d, i) => (
            <section className="card doctor-card" key={d.id}>
              <div className="doctor-card-top">
                <Avatar name={d.name} index={i + 1} />
                <Badge>{d.status}</Badge>
              </div>
              <h3>{d.name}</h3>
              <p>{d.specialty}</p>
              <div className="doctor-card-info">
                <span>
                  Consultation fee<strong>{currency(d.fee)}</strong>
                </span>
                <span>
                  Appointments today
                  <strong>
                    {todayApts.filter((a) => a.doctorId === d.id).length}
                  </strong>
                </span>
              </div>
              <button
                className="button secondary"
                onClick={() => open("doctor", d)}
              >
                Manage doctor <ArrowRight size={15} />
              </button>
            </section>
          ))}
        </div>
      )}
      {page === "consultations" && (
        <section className="card">
          <Toolbar rows={data.consultations} />
          <Table
            columns={[
              "Patient",
              "Doctor",
              "Assessment",
              "Date",
              "Status",
              "Action",
            ]}
            rows={filtered(data.consultations)}
            render={(c) => [
              <PatientCell id={c.patientId} />,
              dname(c.doctorId),
              c.diagnosis,
              humanDate(c.createdAt),
              <Badge>{c.status}</Badge>,
              <button
                className="text-button"
                onClick={() => open("patient", lookup("patients", c.patientId))}
              >
                View timeline <ArrowRight size={14} />
              </button>,
            ]}
          />
        </section>
      )}
      {page === "prescriptions" && (
        <>
          <div className="mini-stats">
            {["Pending", "Dispensed"].map((s) => (
              <div key={s}>
                <span>{s} prescriptions</span>
                <strong>
                  {data.prescriptions.filter((r) => r.status === s).length}
                </strong>
              </div>
            ))}
          </div>
          <section className="card">
            <Toolbar
              statuses={["Pending", "Dispensed"]}
              rows={data.prescriptions}
            />
            <Table
              columns={[
                "Prescription",
                "Patient",
                "Prescriber",
                "Medicines",
                "Status",
                "Action",
              ]}
              rows={filtered(data.prescriptions).filter(
                (r) => filter === "All" || r.status === filter,
              )}
              render={(r) => [
                <b className="record-id">{r.id}</b>,
                <PatientCell id={r.patientId} />,
                dname(r.doctorId),
                `${r.items.length} medicine(s)`,
                <Badge>{r.status}</Badge>,
                <button
                  className="text-button"
                  onClick={() => open("prescription", r)}
                >
                  Open prescription <ArrowRight size={14} />
                </button>,
              ]}
            />
          </section>
        </>
      )}
      {page === "labs" && <Laboratory />}
      {page === "pharmacy" && <Pharmacy />}
      {page === "billing" && <Billing />}
      {page === "reports" && <Reports />}
      {page === "users" && (
        <section className="card">
          <Toolbar rows={data.users} />
          <Table
            columns={["Team member", "Email", "Role", "Status", "Action"]}
            rows={filtered(data.users)}
            render={(u, i) => [
              <div className="patient-cell">
                <Avatar name={u.name} index={i} />
                <b>{u.name}</b>
              </div>,
              u.email,
              <span className="role-chip">{u.role}</span>,
              <Badge>{u.status}</Badge>,
              <button className="text-button" onClick={() => open("user", u)}>
                Manage access
              </button>,
            ]}
          />
          <div className="info-strip">
            <ShieldCheck size={17} />
            Access is enforced by the server. Pathologists and administrators
            can verify laboratory reports.
          </div>
        </section>
      )}
      {page === "audit" && (
        <section className="card">
          <Toolbar rows={data.audit} />
          <Table
            columns={["Activity", "Actor", "Role", "Reference", "Timestamp"]}
            rows={filtered([...data.audit].reverse())}
            render={(a) => [
              <div className="audit-action">
                <Activity size={16} />
                {a.action}
              </div>,
              a.actor,
              a.role,
              <span className="record-id">{a.reference}</span>,
              new Date(a.createdAt).toLocaleString("en-IN"),
            ]}
          />
        </section>
      )}
      {page === "communications" && (
        <>
          <div className="info-strip standalone">
            <Mail size={19} />
            Messages are saved as drafts. Connect an SMS, WhatsApp, or email
            provider to send communications.
          </div>
          <section className="card">
            <Toolbar rows={data.communications} />
            <Table
              columns={["Patient", "Channel", "Message", "Status", "Created"]}
              rows={filtered(data.communications)}
              render={(m) => [
                pname(m.patientId),
                m.channel,
                m.message,
                <Badge>{m.status}</Badge>,
                humanDate(m.createdAt),
              ]}
            />
          </section>
        </>
      )}
      {page === "settings" && (
        <section className="card settings-card">
          <div>
            <div className="settings-symbol">
              <Building2 size={30} />
            </div>
            <h3>Clinic profile</h3>
            <p>These details identify your clinic across the workspace.</p>
          </div>
          <GenericForm type="settings" record={data.settings[0]} inline />
        </section>
      )}
    </>
  );
}
function Laboratory() {
  const { user, data, tab, setTab, filter, lookup, open, filtered } =
    React.useContext(WorkspaceContext);
  const statuses = [
    "Ordered",
    "Sample collected",
    "Processing",
    "Pending approval",
    "Verified",
    "Released",
  ];
  return (
    <>
      <div className="mini-stats lab-stats">
        {statuses.map((s) => (
          <div key={s}>
            <span>{s}</span>
            <strong>{data.labs.filter((l) => l.status === s).length}</strong>
          </div>
        ))}
      </div>
      <div className="tabs outside">
        {[
          "Orders",
          "Test catalog",
          ...(["Admin", "Doctor"].includes(user.role)
            ? ["Imaging review"]
            : []),
        ].map((t) => (
          <button
            key={t}
            className={
              (
                tab === "Test catalog"
                  ? t === "Test catalog"
                  : tab === "Imaging review"
                    ? t === "Imaging review"
                    : t === "Orders"
              )
                ? "active"
                : ""
            }
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Imaging review" ? (
        <ImagingWorkspace />
      ) : tab === "Test catalog" ? (
        <section className="card">
          <div className="card-heading">
            <h3>Test catalog</h3>
            {user.role !== "Doctor" && (
              <button className="button secondary" onClick={() => open("test")}>
                <Plus size={15} />
                Add test
              </button>
            )}
          </div>
          <Table
            columns={["Test", "Code", "Sample", "Price", "Action"]}
            rows={data.catalog}
            render={(t) => [
              <b>{t.name}</b>,
              t.code,
              t.sample,
              currency(t.price),
              <button className="text-button" onClick={() => open("test", t)}>
                Edit test
              </button>,
            ]}
          />
        </section>
      ) : (
        <section className="card">
          <Toolbar
            placeholder="Search patient or order ID…"
            statuses={statuses}
            rows={data.labs}
          />
          <Table
            columns={[
              "Order ID",
              "Patient",
              "Tests",
              "Sample",
              "Priority",
              "Status",
              "Action",
            ]}
            rows={filtered(data.labs).filter(
              (l) => filter === "All" || l.status === filter,
            )}
            render={(l) => [
              <span className="record-id">
                {l.id}
                <small>{humanDate(l.date)}</small>
              </span>,
              <PatientCell id={l.patientId} />,
              l.testIds.map((id) => lookup("catalog", id)?.name).join(", "),
              l.sampleId || "Not collected",
              <Badge>{l.priority}</Badge>,
              <Badge>{l.status}</Badge>,
              <button
                className="text-button"
                onClick={() => open("labDetail", l)}
              >
                Open order <ArrowRight size={14} />
              </button>,
            ]}
          />
        </section>
      )}
    </>
  );
}
function Pharmacy() {
  const {
    data,
    busy,
    action,
    tab,
    setTab,
    filter,
    lookup,
    mname,
    stock,
    open,
    navigate,
    lowStock,
    iconButton,
    filtered,
  } = React.useContext(WorkspaceContext);
  const tabs = [
    "Inventory",
    "POS billing",
    "Batches & expiry",
    "Prescription queue",
    "Purchase entry",
    "Suppliers",
    "Stock ledger",
    "Returns",
    "Purchase orders",
    "Stock transfers",
  ];
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="Medicines in catalog"
          value={data.medicines.length}
          icon={Pill}
          note="Across all categories"
        />
        <Stat
          label="Low stock items"
          value={lowStock.length}
          icon={AlertTriangle}
          color="orange"
          note="At or below reorder level"
        />
        <Stat
          label="Expiring in 30 days"
          value={
            data.batches.filter(
              (b) =>
                b.expiry > today() &&
                new Date(b.expiry) - new Date(today()) <= 30 * 86400000 &&
                b.quantity > 0,
            ).length
          }
          icon={Clock3}
          color="red"
          note="Batches needing attention"
        />
        <Stat
          label="Inventory value"
          value={currency(
            data.batches.reduce((s, b) => s + b.cost * b.quantity, 0),
          )}
          icon={Package}
          color="green"
          note="At purchase cost"
        />
      </div>
      <div className="tabs outside scroll-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
            {t === "Prescription queue" && (
              <span>
                {
                  data.prescriptions.filter((r) => r.status === "Pending")
                    .length
                }
              </span>
            )}
          </button>
        ))}
      </div>
      <section className="card">
        <div className="card-heading">
          <div>
            <h3>{tab}</h3>
            <p>
              {tab === "Inventory"
                ? "Visibility from shelf to prescription."
                : tab === "Returns"
                  ? "Returned medicines are quarantined; no automatic restocking."
                  : "Every movement, accounted for."}
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => {
              if (tab === "Prescription queue") {
                navigate("prescriptions");
                return;
              }
              open(
                {
                  Inventory: "medicine",
                  "Batches & expiry": "batch",
                  "Purchase entry": "purchase",
                  Suppliers: "supplier",
                  Returns: "return",
                  "Stock ledger": "adjust",
                  "Purchase orders": "purchaseOrder",
                  "Stock transfers": "transfer",
                  "POS billing": "pos",
                }[tab],
              );
            }}
          >
            <Plus size={16} />
            {
              {
                Inventory: "Add medicine",
                "Batches & expiry": "Add batch",
                "Purchase entry": "Record purchase",
                Suppliers: "Add supplier",
                Returns: "New return",
                "Stock ledger": "Adjust stock",
                "Prescription queue": "View prescriptions",
                "Purchase orders": "New purchase order",
                "Stock transfers": "Transfer stock",
                "POS billing": "New counter sale",
              }[tab]
            }
          </button>
        </div>
        <Toolbar
          placeholder={`Search ${tab.toLowerCase()}…`}
          rows={
            tab === "Inventory"
              ? data.medicines
              : tab === "Batches & expiry"
                ? data.batches
                : tab === "Suppliers"
                  ? data.suppliers
                  : tab === "Purchase entry"
                    ? data.purchases
                    : tab === "Returns"
                      ? data.returns
                      : tab === "Prescription queue"
                        ? data.prescriptions
                        : data.ledger
          }
        />
        {tab === "Inventory" && (
          <Table
            columns={[
              "Medicine",
              "Category",
              "Manufacturer",
              "Stock",
              "Unit price",
              "Status",
              "Action",
            ]}
            rows={filtered(data.medicines)}
            render={(m) => [
              <div className="medicine-cell">
                <span>
                  <Pill size={17} />
                </span>
                <b>
                  {m.name}
                  <small>
                    {m.unit} · {m.id}
                  </small>
                </b>
              </div>,
              m.category,
              m.manufacturer,
              <b>
                {stock(m.id)} <small>units</small>
              </b>,
              currency(m.price),
              <Badge>
                {stock(m.id) === 0
                  ? "Out of stock"
                  : stock(m.id) <= m.reorderLevel
                    ? "Low stock"
                    : "In stock"}
              </Badge>,
              iconButton(
                MoreHorizontal,
                () => open("medicine", m),
                "Edit medicine",
              ),
            ]}
          />
        )}
        {tab === "Batches & expiry" && (
          <Table
            columns={[
              "Medicine",
              "Batch number",
              "Expiry date",
              "Quantity",
              "Location",
              "Status",
              "Action",
            ]}
            rows={filtered(
              data.batches.map((b) => ({
                ...b,
                medicine: mname(b.medicineId),
              })),
            )}
            render={(b) => [
              <b>{mname(b.medicineId)}</b>,
              b.batchNo,
              humanDate(b.expiry),
              b.quantity,
              b.location,
              <Badge>
                {b.expiry <= today()
                  ? "Expired"
                  : new Date(b.expiry) - new Date(today()) <= 30 * 86400000
                    ? "Expiring soon"
                    : "Active"}
              </Badge>,
              <button className="text-button" onClick={() => open("adjust", b)}>
                Adjust stock
              </button>,
            ]}
          />
        )}
        {tab === "Prescription queue" && (
          <Table
            columns={[
              "Prescription",
              "Patient",
              "Medicines",
              "Status",
              "Action",
            ]}
            rows={filtered(data.prescriptions)}
            render={(r) => [
              r.id,
              <PatientCell id={r.patientId} />,
              r.items.map((i) => mname(i.medicineId)).join(", "),
              <Badge>{r.status}</Badge>,
              <button
                className="text-button"
                onClick={() => open("prescription", r)}
              >
                Review & dispense
              </button>,
            ]}
          />
        )}
        {tab === "Suppliers" && (
          <Table
            columns={[
              "Supplier",
              "Contact",
              "Phone",
              "Email",
              "Status",
              "Action",
            ]}
            rows={filtered(data.suppliers)}
            render={(s) => [
              <b>{s.name}</b>,
              s.contact,
              s.phone,
              s.email,
              <Badge>{s.status}</Badge>,
              <button
                className="text-button"
                onClick={() => open("supplier", s)}
              >
                Edit supplier
              </button>,
            ]}
          />
        )}
        {tab === "Purchase entry" && (
          <Table
            columns={[
              "Purchase ID",
              "Supplier",
              "Supplier invoice",
              "Items",
              "Amount",
              "Status",
              "Date",
            ]}
            rows={filtered(data.purchases)}
            render={(p) => [
              p.id,
              lookup("suppliers", p.supplierId)?.name,
              p.invoiceNo,
              p.items.length,
              currency(p.amount),
              <Badge>{p.status}</Badge>,
              humanDate(p.createdAt),
            ]}
          />
        )}
        {tab === "Stock ledger" && (
          <Table
            columns={[
              "Medicine",
              "Batch",
              "Movement",
              "Quantity",
              "Reference",
              "Date",
            ]}
            rows={filtered([...data.ledger].reverse())}
            render={(s) => [
              s.medicine,
              s.batch,
              <Badge>{s.type}</Badge>,
              <b className={s.quantity > 0 ? "green-text" : "red-text"}>
                {s.quantity > 0 ? "+" : ""}
                {s.quantity}
              </b>,
              s.reference,
              humanDate(s.createdAt),
            ]}
          />
        )}
        {tab === "POS billing" && (
          <>
            <div className="info-strip">
              <Pill size={17} />
              Counter sales support medicines marked Non-prescription by your
              clinic. Prescription medicines are dispensed from a signed
              prescription.
            </div>
            <Table
              columns={["Invoice", "Patient", "Amount", "Status", "Date"]}
              rows={data.invoices.filter(
                (i) => i.saleType === "Counter sale" || i.prescriptionId,
              )}
              render={(i) => [
                i.id,
                <PatientCell id={i.patientId} />,
                currency(i.amount),
                <Badge>{i.status}</Badge>,
                humanDate(i.createdAt),
              ]}
            />
          </>
        )}
        {tab === "Purchase orders" && (
          <Table
            columns={[
              "Order",
              "Supplier",
              "Items",
              "Estimated amount",
              "Status",
              "Action",
            ]}
            rows={filtered(data.purchaseOrders)}
            render={(r) => [
              r.id,
              lookup("suppliers", r.supplierId)?.name,
              r.items.length,
              currency(r.amount),
              <Badge>{r.status}</Badge>,
              r.status === "Ordered" && (
                <div className="row-actions">
                  <button
                    className="text-button"
                    onClick={() => open("purchase", r)}
                  >
                    Receive
                  </button>
                  <button
                    className="text-button red-text"
                    disabled={busy}
                    onClick={() =>
                      action(
                        "purchaseOrder",
                        { id: r.id, status: "Cancelled" },
                        "Purchase order cancelled",
                      )
                    }
                  >
                    Cancel
                  </button>
                </div>
              ),
            ]}
          />
        )}
        {tab === "Stock transfers" && (
          <Table
            columns={[
              "Transfer",
              "Medicine",
              "Batch",
              "From",
              "To",
              "Quantity",
            ]}
            rows={filtered(data.transfers)}
            render={(r) => [
              r.id,
              mname(r.medicineId),
              r.batchNo,
              r.from,
              r.to,
              r.quantity,
            ]}
          />
        )}
        {tab === "Returns" && (
          <Table
            columns={[
              "Return ID",
              "Invoice",
              "Medicine",
              "Quantity",
              "Credit",
              "Status",
            ]}
            rows={filtered(data.returns)}
            render={(r) => [
              r.id,
              r.invoiceId,
              mname(r.medicineId),
              r.quantity,
              currency(r.amount),
              <Badge>{r.status}</Badge>,
            ]}
          />
        )}
      </section>
    </>
  );
}
function Billing() {
  const {
    data,
    filter,
    pname,
    outstanding,
    open,
    printRecord,
    iconButton,
    filtered,
  } = React.useContext(WorkspaceContext);
  return (
    <>
      <div className="stats-grid three">
        <Stat
          label="Total invoiced"
          value={currency(
            data.invoices.reduce((s, i) => s + i.amount - (i.credit || 0), 0),
          )}
          icon={FileText}
          note="After credit adjustments"
        />
        <Stat
          label="Payments collected"
          value={currency(data.invoices.reduce((s, i) => s + i.paid, 0))}
          icon={Wallet}
          note="All recorded payments"
          color="green"
        />
        <Stat
          label="Outstanding balance"
          value={currency(
            data.invoices.reduce((s, i) => s + outstanding(i), 0),
          )}
          icon={Clock3}
          note="Awaiting payment"
          color="orange"
        />
      </div>
      <section className="card">
        <Toolbar
          statuses={["Paid", "Unpaid", "Part paid", "Credited"]}
          rows={data.invoices}
        />
        <Table
          columns={[
            "Invoice",
            "Patient",
            "Amount",
            "Paid",
            "Balance",
            "Status",
            "Action",
          ]}
          rows={filtered(data.invoices).filter(
            (i) => filter === "All" || i.status === filter,
          )}
          render={(i) => [
            <span className="record-id">
              {i.id}
              <small>{humanDate(i.createdAt)}</small>
            </span>,
            <PatientCell id={i.patientId} />,
            currency(i.amount - (i.credit || 0)),
            currency(i.paid),
            currency(outstanding(i)),
            <Badge>{i.status}</Badge>,
            <div className="row-actions">
              {i.refundDue > 0 && (
                <button
                  className="text-button red-text"
                  onClick={() => open("refund", i)}
                >
                  Refund {currency(i.refundDue)}
                </button>
              )}
              {outstanding(i) > 0 && (
                <button
                  className="text-button"
                  onClick={() => open("payment", i)}
                >
                  Collect payment
                </button>
              )}
              {iconButton(
                Printer,
                () =>
                  printRecord("Invoice " + i.id, [
                    pname(i.patientId),
                    ...i.items.map(
                      (x) =>
                        `${x.description} × ${x.quantity} — ${currency(x.price * x.quantity)}`,
                    ),
                    `Gross: ${currency(i.amount)}\nCredit: ${currency(i.credit || 0)}\nPaid: ${currency(i.paid)}\nBalance: ${currency(outstanding(i))}`,
                    i.refundDue
                      ? `Refund due: ${currency(i.refundDue)} — settlement pending`
                      : "",
                  ]),
                "Print invoice",
              )}
            </div>,
          ]}
        />
      </section>
    </>
  );
}
function Reports() {
  const { data, filter, stock, exportCSV } = React.useContext(WorkspaceContext);
  return (
    <>
      <div className="stats-grid">
        <Stat
          label="Patients"
          value={data.patients.length}
          icon={Users}
          note="Registered patients"
        />
        <Stat
          label="Consultations"
          value={data.consultations.length}
          icon={ClipboardList}
          color="blue"
          note="Signed by clinicians"
        />
        <Stat
          label="Collected revenue"
          value={currency(data.invoices.reduce((s, i) => s + i.paid, 0))}
          icon={Wallet}
          color="green"
          note="Recorded payments"
        />
        <Stat
          label="Lab reports released"
          value={data.labs.filter((l) => l.status === "Released").length}
          icon={FlaskConical}
          color="orange"
          note="Verified and released"
        />
      </div>
      <div className="dashboard-middle">
        <section className="card activity-card">
          <div className="card-heading">
            <div>
              <h3>Clinic activity</h3>
              <p>Appointments over the last 7 days</p>
            </div>
          </div>
          <Chart />
        </section>
        <section className="card">
          <div className="card-heading">
            <h3>Operational reports</h3>
          </div>
          {[
            ["Patient register", data.patients],
            ["Pharmacy stock", data.batches],
            [
              "Expiry report",
              data.batches.filter(
                (b) => new Date(b.expiry) - new Date(today()) < 90 * 86400000,
              ),
            ],
            ["Laboratory register", data.labs],
            ["Sales & collections", data.invoices],
            ["Purchase report", data.purchases],
          ].map(([label, rows]) => (
            <button
              className="report-link"
              key={label}
              onClick={() => exportCSV(rows, label)}
            >
              <span>
                <FileText size={17} />
                {label}
              </span>
              <Download size={16} />
            </button>
          ))}
        </section>
      </div>
    </>
  );
}
function Select({ label, value, onChange, source, options, required = true }) {
  const { data } = React.useContext(WorkspaceContext);
  return (
    <label className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      <select
        aria-label={label}
        required={required}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {(source
          ? data[source].map((r) => [r.id, r.name || r.batchNo || r.id])
          : options.map((o) => [o, o])
        ).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}
function GenericForm({ type, record, inline = false }) {
  const { user, mutate } = React.useContext(WorkspaceContext);

  const mapping = {
    patient: "patients",
    patientEdit: "patients",
    doctor: "doctors",
    appointment: "appointments",
    medicine: "medicines",
    batch: "batches",
    supplier: "suppliers",
    test: "catalog",
    user: "users",
    message: "communications",
    settings: "settings",
    imagingReport: "imaging",
  };
  const configs = {
    imagingReport: [
      ["patientId", "Patient", "@patients"],
      ["doctorId", "Reviewing doctor", "@doctors"],
      ["modality", "Modality", ["X-ray", "Ultrasound", "CT", "MRI", "Other"]],
      ["bodyPart", "Body part"],
      ["performedAt", "Study date", "date"],
      ["reportingClinician", "Reporting radiologist"],
      ["reportText", "Transcribed radiology findings", "textarea"],
    ],
    patient: [
      ["name", "Full name"],
      ["age", "Age", "number"],
      ["gender", "Gender", ["Female", "Male", "Other"]],
      ["phone", "Mobile number", "tel"],
      [
        "bloodGroup",
        "Blood group",
        ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"],
      ],
      ["allergies", "Known allergies"],
      ["address", "Address"],
    ],
    doctor: [
      ["name", "Doctor name"],
      ["specialty", "Specialty"],
      ["phone", "Phone", "tel"],
      ["fee", "Consultation fee (₹)", "number"],
      ["status", "Availability", ["Available", "In consultation", "Off duty"]],
    ],
    appointment: [
      ["patientId", "Patient", "@patients"],
      ["doctorId", "Doctor", "@doctors"],
      ["date", "Appointment date", "date"],
      ["time", "Time", "time"],
      ["type", "Visit type", ["New visit", "Follow-up"]],
      ["reason", "Reason for visit"],
    ],
    medicine: [
      ["name", "Medicine name"],
      ["category", "Category"],
      [
        "unit",
        "Unit",
        ["Tablet", "Capsule", "Sachet", "Bottle", "Vial", "Tube"],
      ],
      ["manufacturer", "Manufacturer"],
      ["price", "Selling price (₹)", "number"],
      ["gst", "GST (%)", "number"],
      ["reorderLevel", "Reorder level", "number"],
      [
        "salePolicy",
        "Sale policy",
        ["Prescription required", "Non-prescription"],
      ],
    ],
    batch: [
      ["medicineId", "Medicine", "@medicines"],
      ["batchNo", "Batch number"],
      ["expiry", "Expiry date", "date"],
      ["quantity", "Quantity", "number"],
      ["cost", "Unit cost (₹)", "number"],
      ["location", "Location"],
      ["supplierId", "Supplier", "@suppliers"],
    ],
    supplier: [
      ["name", "Supplier name"],
      ["contact", "Contact person"],
      ["phone", "Phone", "tel"],
      ["email", "Email", "email"],
      ["gst", "GSTIN"],
      ["status", "Status", ["Active", "Inactive"]],
    ],
    test: [
      ["name", "Test name"],
      ["code", "Test code"],
      ["sample", "Sample type", ["Blood", "Urine", "Stool", "Swab", "Other"]],
      ["price", "Price (₹)", "number"],
      ["unit", "Result unit"],
      ["reference", "Reference information"],
    ],
    user: [
      ["name", "Full name"],
      ["email", "Email", "email"],
      [
        "role",
        "Role",
        ["Admin", "Doctor", "Pharmacist", "Lab technician", "Pathologist"],
      ],
      ["doctorId", "Doctor profile", "@doctors"],
      ...(!record
        ? [["password", "Password (10+ characters)", "password"]]
        : [["status", "Status", ["Active", "Inactive"]]]),
    ],
    message: [
      ["patientId", "Patient", "@patients"],
      ["channel", "Channel", ["SMS", "WhatsApp", "Email"]],
      ["message", "Message", "textarea"],
    ],
    settings: [
      ["name", "Clinic name"],
      ["city", "City"],
      ["phone", "Contact phone", "tel"],
      ["email", "Contact email", "email"],
      ["address", "Address"],
    ],
  };
  const [v, setV] = useState({
    ...{
      date: today(),
      type: "New visit",
      status: type === "doctor" ? "Available" : "Active",
      location: "Main pharmacy",
      gst: 0,
      reorderLevel: 30,
      salePolicy: "Prescription required",
    },
    ...record,
  });
  const config = configs[type === "patientEdit" ? "patient" : type] || [];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate(
          () =>
            API(
              "/" + mapping[type] + (record ? "/" + record.id : ""),
              v,
              record ? "PATCH" : "POST",
            ),
          record ? "Changes saved" : "Record created",
        );
      }}
    >
      <div className="form-grid">
        {config.map(([key, label, kind]) => {
          const required = ![
            "address",
            "unit",
            "reference",
            "gst",
            "doctorId",
          ].includes(key);
          if (Array.isArray(kind) || kind?.startsWith("@"))
            return (
              <Select
                key={key}
                label={label}
                value={v[key]}
                onChange={(value) => setV({ ...v, [key]: value })}
                source={kind?.startsWith?.("@") ? kind.slice(1) : undefined}
                options={Array.isArray(kind) ? kind : undefined}
                required={required}
              />
            );
          return (
            <label
              className={"field " + (kind === "textarea" ? "full" : "")}
              key={key}
            >
              <span>
                {label}
                {required && <em>*</em>}
              </span>
              {kind === "textarea" ? (
                <textarea
                  aria-label={label}
                  required={required}
                  rows={4}
                  value={v[key] || ""}
                  onChange={(e) => setV({ ...v, [key]: e.target.value })}
                />
              ) : (
                <input
                  aria-label={label}
                  required={required}
                  type={kind || "text"}
                  min={kind === "number" ? 0 : undefined}
                  step={
                    ["price", "fee", "cost", "gst"].includes(key)
                      ? ".01"
                      : undefined
                  }
                  value={v[key] ?? ""}
                  onChange={(e) => setV({ ...v, [key]: e.target.value })}
                />
              )}
            </label>
          );
        })}
      </div>
      {type === "user" && (
        <p className="form-hint">
          Doctor accounts must be linked to a doctor profile to sign
          consultations.
        </p>
      )}
      <FormFooter
        label={record ? "Save changes" : "Create record"}
        inline={inline}
      />
    </form>
  );
}
function FormFooter({ label = "Save", inline = false }) {
  const { setModal, busy } = React.useContext(WorkspaceContext);
  return (
    <div className="form-footer">
      {!inline && (
        <button
          type="button"
          className="button secondary"
          onClick={() => setModal(null)}
        >
          Cancel
        </button>
      )}
      <button type="submit" className="button primary" disabled={busy}>
        {busy ? "Saving…" : label}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
function LabForm() {
  const { data, filter, lookup, mutate } = React.useContext(WorkspaceContext);
  const [v, setV] = useState({ priority: "Routine", testIds: [] });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate(() => API("/labs", v), "Lab order created");
      }}
    >
      <div className="form-grid">
        <Select
          label="Patient"
          source="patients"
          value={v.patientId}
          onChange={(patientId) => setV({ ...v, patientId })}
        />
        <Select
          label="Referring doctor"
          source="doctors"
          value={v.doctorId}
          onChange={(doctorId) => setV({ ...v, doctorId })}
        />
        <Select
          label="Priority"
          options={["Routine", "Urgent"]}
          value={v.priority}
          onChange={(priority) => setV({ ...v, priority })}
        />
      </div>
      <h4 className="form-section-title">Select tests</h4>
      <div className="test-list">
        {data.catalog.map((t) => (
          <label key={t.id}>
            <input
              type="checkbox"
              checked={v.testIds.includes(t.id)}
              onChange={(e) =>
                setV({
                  ...v,
                  testIds: e.target.checked
                    ? [...v.testIds, t.id]
                    : v.testIds.filter((id) => id !== t.id),
                })
              }
            />
            <span>
              <b>{t.name}</b>
              <small>
                {t.code} · {t.sample}
              </small>
            </span>
            <strong>{currency(t.price)}</strong>
          </label>
        ))}
      </div>
      <div className="form-total">
        Estimated total{" "}
        <strong>
          {currency(
            v.testIds.reduce((s, id) => s + lookup("catalog", id).price, 0),
          )}
        </strong>
      </div>
      <FormFooter label="Create lab order" />
    </form>
  );
}
function LabDetail({ r }) {
  const { user, busy, range, lookup, pname, dname, action, printRecord } =
    React.useContext(WorkspaceContext);
  const [results, setResults] = useState(r.results || "");
  const transitions = {
    Ordered: ["Sample collected", "Collect sample"],
    "Sample collected": ["Processing", "Start processing"],
    Processing: ["Pending approval", "Submit for approval"],
    "Pending approval": ["Verified", "Verify report"],
    Verified: ["Released", "Release report"],
  };
  const next = transitions[r.status],
    canApprove = ["Admin", "Pathologist"].includes(user.role),
    canChange =
      user.role !== "Doctor" &&
      (canApprove || !["Pending approval", "Verified"].includes(r.status));
  return (
    <div>
      <div className="detail-summary">
        <PatientCell id={r.patientId} />
        <Badge>{r.status}</Badge>
      </div>
      <div className="detail-grid">
        <div>
          <small>Referring doctor</small>
          <b>{dname(r.doctorId)}</b>
        </div>
        <div>
          <small>Sample ID</small>
          <b>{r.sampleId || "Awaiting collection"}</b>
        </div>
        <div>
          <small>Priority</small>
          <b>{r.priority}</b>
        </div>
        <div>
          <small>Tests</small>
          <b>{r.testIds.map((id) => lookup("catalog", id)?.name).join(", ")}</b>
        </div>
      </div>
      <label className="field">
        <span>Results and laboratory reference ranges</span>
        <textarea
          aria-label="Results and laboratory reference ranges"
          rows={7}
          value={results}
          readOnly={r.status !== "Processing"}
          onChange={(e) => setResults(e.target.value)}
          placeholder="Enter test name, result, units, reference range and any laboratory comments…"
        />
      </label>
      <ReportAttachment
        collection="labs"
        record={r}
        editable={
          !["Verified", "Released"].includes(r.status) && user.role !== "Doctor"
        }
      />
      {r.verifiedBy && (
        <div className="info-strip">
          <ShieldCheck size={16} />
          Verified by {r.verifiedBy}
        </div>
      )}
      <div className="form-footer">
        {r.status === "Released" && (
          <button
            className="button secondary"
            onClick={() =>
              printRecord("Laboratory report " + r.id, [
                pname(r.patientId),
                r.testIds.map((id) => lookup("catalog", id)?.name).join(", "),
                r.results,
                "Verified by " + r.verifiedBy,
              ])
            }
          >
            <Printer size={16} />
            Print report
          </button>
        )}
        {r.sampleId && (
          <button
            className="button secondary"
            onClick={() =>
              printRecord("Sample label", [
                r.sampleId,
                r.id,
                pname(r.patientId),
                r.testIds.map((id) => lookup("catalog", id)?.sample).join(", "),
              ])
            }
          >
            <Printer size={15} />
            Print label
          </button>
        )}
        {next && canChange && (
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              action(
                "lab",
                {
                  id: r.id,
                  status: next[0],
                  ...(r.status === "Processing" ? { results } : {}),
                },
                "Laboratory order updated",
              )
            }
          >
            {next[1]}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
function ConsultForm({ r }) {
  const { user, filter, lookup, action } = React.useContext(WorkspaceContext);
  const [v, setV] = useState({
      patientId: r?.patientId || "",
      doctorId: r?.doctorId || user.doctorId || "",
      appointmentId: r?.id,
      complaint: r?.reason || "",
      vitals: "",
      diagnosis: "",
      notes: "",
    }),
    [items, setItems] = useState([]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        action(
          "consult",
          { ...v, items },
          "Consultation signed; prescription sent to pharmacy",
        );
      }}
    >
      <div className="form-grid">
        <Select
          label="Patient"
          source="patients"
          value={v.patientId}
          onChange={(patientId) => setV({ ...v, patientId })}
        />
        <Select
          label="Doctor"
          source="doctors"
          value={v.doctorId}
          onChange={(doctorId) => setV({ ...v, doctorId })}
        />
      </div>
      {v.patientId && (
        <div className="allergy-panel">
          <AlertTriangle size={16} />
          Allergies:{" "}
          {lookup("patients", v.patientId)?.allergies ||
            "Not recorded — confirm with patient"}
        </div>
      )}
      <div className="form-grid">
        {[
          ["complaint", "Presenting complaint", true],
          ["vitals", "Vitals (include units)", false],
          ["diagnosis", "Clinician assessment / diagnosis", true],
          ["notes", "Care plan and follow-up instructions", false],
        ].map(([key, label, required]) => (
          <label className="field full" key={key}>
            <span>
              {label}
              {required && <em>*</em>}
            </span>
            <textarea
              rows={2}
              required={required}
              value={v[key]}
              onChange={(e) => setV({ ...v, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <h4 className="form-section-title">
        Prescription{" "}
        <button
          type="button"
          className="text-button"
          onClick={() =>
            setItems([
              ...items,
              { medicineId: "", quantity: 1, instructions: "" },
            ])
          }
        >
          <Plus size={14} />
          Add medicine
        </button>
      </h4>
      {items.map((i, n) => (
        <div className="prescription-line" key={n}>
          <Select
            label="Medicine"
            source="medicines"
            value={i.medicineId}
            onChange={(medicineId) =>
              setItems(
                items.map((x, j) => (j === n ? { ...x, medicineId } : x)),
              )
            }
          />
          <label className="field">
            <span>Quantity</span>
            <input
              aria-label="Quantity"
              type="number"
              min="1"
              required
              value={i.quantity}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === n ? { ...x, quantity: Number(e.target.value) } : x,
                  ),
                )
              }
            />
          </label>
          <label className="field full">
            <span>
              Dose, route, frequency, duration & instructions <em>*</em>
            </span>
            <input
              aria-label="Dose, route, frequency, duration & instructions"
              required
              value={i.instructions}
              onChange={(e) =>
                setItems(
                  items.map((x, j) =>
                    j === n ? { ...x, instructions: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="text-button red-text"
            onClick={() => setItems(items.filter((_, j) => j !== n))}
          >
            Remove medicine
          </button>
        </div>
      ))}
      <p className="form-hint">
        Signing records your clinical assessment. Confirm patient identity,
        allergies, medications and dosing before signing.
      </p>
      <FormFooter label="Sign consultation" />
    </form>
  );
}
function PrescriptionDetail({ r }) {
  const {
    user,
    busy,
    lookup,
    pname,
    dname,
    mname,
    stock,
    action,
    printRecord,
  } = React.useContext(WorkspaceContext);
  return (
    <>
      <div className="detail-summary">
        <PatientCell id={r.patientId} />
        <Badge>{r.status}</Badge>
      </div>
      <div className="allergy-panel">
        <AlertTriangle size={16} />
        Allergies:{" "}
        {lookup("patients", r.patientId)?.allergies || "Not recorded"}
      </div>
      <p className="muted">Prescribed by {dname(r.doctorId)}</p>
      {r.items.map((i, n) => (
        <div className="rx-item" key={n}>
          <div className="rx-mark">℞</div>
          <div>
            <h4>{mname(i.medicineId)}</h4>
            <p>{i.instructions}</p>
            <small>
              Quantity: {i.quantity} · Available stock: {stock(i.medicineId)}
            </small>
          </div>
        </div>
      ))}
      <p className="form-hint">{r.notes}</p>
      <div className="form-footer">
        <button
          className="button secondary"
          onClick={() =>
            printRecord("Prescription " + r.id, [
              pname(r.patientId),
              dname(r.doctorId),
              ...r.items.map(
                (i) =>
                  `${mname(i.medicineId)}\n${i.instructions}\nQuantity: ${i.quantity}`,
              ),
              r.notes,
            ])
          }
        >
          <Printer size={15} />
          Print
        </button>
        {r.status === "Pending" &&
          ["Admin", "Pharmacist"].includes(user.role) && (
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                action(
                  "dispense",
                  { id: r.id },
                  "Medicines dispensed and invoice created",
                )
              }
            >
              Dispense & create bill <ArrowRight size={15} />
            </button>
          )}
      </div>
    </>
  );
}
function TransactionForm({ type, r }) {
  const { data, filter, lookup, pname, mname, outstanding, mutate, action } =
    React.useContext(WorkspaceContext);
  const [v, setV] = useState({
      id: r?.id,
      invoiceId: "",
      medicineId: "",
      quantity: 1,
      reason: "",
      amount: r ? outstanding(r) : 0,
      method: "UPI",
      supplierId: r?.supplierId || "",
      purchaseOrderId: r?.id?.startsWith("PO-") ? r.id : "",
      invoiceNo: "",
      patientId: "",
    }),
    [items, setItems] = useState(
      type === "invoice"
        ? [{ description: "Consultation", quantity: 1, price: 600 }]
        : r?.items?.map((i) => ({ ...i, batchNo: "", expiry: "" })) || [
            { medicineId: "", batchNo: "", quantity: 1, cost: 0, expiry: "" },
          ],
    );
  const change = (key, value) => setV({ ...v, [key]: value });
  const update = (n, key, value) =>
    setItems(items.map((x, j) => (j === n ? { ...x, [key]: value } : x)));
  const submit = (e) => {
    e.preventDefault();
    if (type === "invoice")
      mutate(
        () => API("/invoices", { patientId: v.patientId, items }),
        "Invoice created",
      );
    else
      action(
        type,
        { ...v, items },
        type === "purchase"
          ? "Purchase received; inventory updated"
          : type === "return"
            ? "Return credited; medicines quarantined"
            : type === "adjust"
              ? "Stock adjusted"
              : "Payment recorded",
      );
  };
  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        {type === "invoice" && (
          <Select
            label="Patient"
            source="patients"
            value={v.patientId}
            onChange={(x) => change("patientId", x)}
          />
        )}
        {type === "purchase" && (
          <>
            <Select
              label="Supplier"
              source="suppliers"
              value={v.supplierId}
              onChange={(x) => change("supplierId", x)}
            />
            <label className="field">
              <span>
                Supplier invoice number <em>*</em>
              </span>
              <input
                aria-label="Supplier invoice number"
                required
                value={v.invoiceNo}
                onChange={(e) => change("invoiceNo", e.target.value)}
              />
            </label>
          </>
        )}
        {type === "return" && (
          <>
            <label className="field full">
              <span>
                Pharmacy invoice <em>*</em>
              </span>
              <select
                aria-label="Pharmacy invoice"
                required
                value={v.invoiceId}
                onChange={(e) =>
                  setV({ ...v, invoiceId: e.target.value, medicineId: "" })
                }
              >
                <option value="">Select invoice</option>
                {data.invoices
                  .filter((i) => i.prescriptionId)
                  .map((i) => (
                    <option value={i.id} key={i.id}>
                      {i.id} · {pname(i.patientId)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>
                Returned medicine <em>*</em>
              </span>
              <select
                aria-label="Returned medicine"
                required
                value={v.medicineId}
                onChange={(e) => change("medicineId", e.target.value)}
              >
                <option value="">Select medicine</option>
                {lookup("invoices", v.invoiceId)?.items.map((i) => (
                  <option value={i.medicineId} key={i.medicineId}>
                    {i.description}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {type === "adjust" && (
          <label className="field full">
            <span>
              Stock batch <em>*</em>
            </span>
            <select
              aria-label="Stock batch"
              required
              value={v.id || ""}
              onChange={(e) => change("id", e.target.value)}
            >
              <option value="">Select batch</option>
              {data.batches.map((b) => (
                <option value={b.id} key={b.id}>
                  {mname(b.medicineId)} · {b.batchNo} · {b.quantity} units
                </option>
              ))}
            </select>
          </label>
        )}
        {["return", "adjust"].includes(type) && (
          <>
            <label className="field">
              <span>
                {type === "adjust"
                  ? "Quantity change (+ / −)"
                  : "Return quantity"}{" "}
                <em>*</em>
              </span>
              <input
                type="number"
                required
                min={type === "return" ? 1 : undefined}
                value={v.quantity}
                onChange={(e) => change("quantity", e.target.value)}
              />
            </label>
            <label className="field full">
              <span>
                Reason <em>*</em>
              </span>
              <textarea
                aria-label="Reason"
                required
                rows={3}
                value={v.reason}
                onChange={(e) => change("reason", e.target.value)}
              />
            </label>
          </>
        )}
        {type === "payment" && (
          <>
            <div className="payment-summary full">
              <small>
                {r.id} · {pname(r.patientId)}
              </small>
              <span>Outstanding balance</span>
              <strong>{currency(outstanding(r))}</strong>
            </div>
            <label className="field">
              <span>
                Payment amount (₹) <em>*</em>
              </span>
              <input
                aria-label="Payment amount (₹)"
                type="number"
                required
                min="0.01"
                max={outstanding(r)}
                step="0.01"
                value={v.amount}
                onChange={(e) => change("amount", e.target.value)}
              />
            </label>
            <Select
              label="Payment method"
              options={["Cash", "UPI", "Card", "Bank transfer"]}
              value={v.method}
              onChange={(x) => change("method", x)}
            />
          </>
        )}
      </div>
      {["invoice", "purchase"].includes(type) && (
        <>
          <h4 className="form-section-title">
            {type === "invoice" ? "Invoice items" : "Purchase items"}
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setItems([
                  ...items,
                  type === "invoice"
                    ? { description: "", quantity: 1, price: 0 }
                    : {
                        medicineId: "",
                        batchNo: "",
                        quantity: 1,
                        cost: 0,
                        expiry: "",
                      },
                ])
              }
            >
              <Plus size={14} />
              Add item
            </button>
          </h4>
          {items.map((i, n) => (
            <div className="prescription-line" key={n}>
              {type === "purchase" ? (
                <Select
                  label="Medicine"
                  source="medicines"
                  value={i.medicineId}
                  onChange={(x) => update(n, "medicineId", x)}
                />
              ) : (
                <label className="field">
                  <span>Description</span>
                  <input
                    aria-label="Description"
                    required
                    value={i.description}
                    onChange={(e) => update(n, "description", e.target.value)}
                  />
                </label>
              )}
              <label className="field">
                <span>Quantity</span>
                <input
                  aria-label="Quantity"
                  required
                  type="number"
                  min="1"
                  value={i.quantity}
                  onChange={(e) =>
                    update(n, "quantity", Number(e.target.value))
                  }
                />
              </label>
              <label className="field">
                <span>
                  {type === "invoice" ? "Unit price (₹)" : "Unit cost (₹)"}
                </span>
                <input
                  type="number"
                  min="0"
                  step=".01"
                  required
                  value={i.price ?? i.cost}
                  onChange={(e) =>
                    update(
                      n,
                      type === "invoice" ? "price" : "cost",
                      Number(e.target.value),
                    )
                  }
                />
              </label>
              {type === "purchase" && (
                <>
                  <label className="field">
                    <span>Batch number</span>
                    <input
                      aria-label="Batch number"
                      required
                      value={i.batchNo}
                      onChange={(e) => update(n, "batchNo", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Expiry</span>
                    <input
                      aria-label="Expiry"
                      required
                      type="date"
                      value={i.expiry}
                      onChange={(e) => update(n, "expiry", e.target.value)}
                    />
                  </label>
                </>
              )}
              {items.length > 1 && (
                <button
                  className="text-button red-text"
                  type="button"
                  onClick={() => setItems(items.filter((_, j) => j !== n))}
                >
                  Remove item
                </button>
              )}
            </div>
          ))}
          <div className="form-total">
            Total
            <strong>
              {currency(
                items.reduce((s, i) => s + i.quantity * (i.price ?? i.cost), 0),
              )}
            </strong>
          </div>
        </>
      )}
      {type === "return" && (
        <div className="info-strip">
          <Package size={16} />
          Returned medicines are quarantined. Credits reduce the bill; any
          refund remains due for settlement.
        </div>
      )}
      <FormFooter
        label={
          {
            invoice: "Create invoice",
            purchase: "Receive purchase",
            payment: "Record payment",
            return: "Process return",
            adjust: "Apply adjustment",
          }[type]
        }
      />
    </form>
  );
}
function PatientDetail({ r }) {
  const { user, data, filter, lookup, dname, mname, open } =
    React.useContext(WorkspaceContext);
  const timeline = [
    ...data.consultations
      .filter((c) => c.patientId === r.id)
      .map((c) => ({
        ...c,
        kind: "Consultation",
        title: c.diagnosis,
        body: `${c.complaint}\n${c.vitals}\n${c.notes}`,
        by: dname(c.doctorId),
      })),
    ...data.prescriptions
      .filter((c) => c.patientId === r.id)
      .map((c) => ({
        ...c,
        kind: "Prescription",
        title: c.status,
        body: c.items
          .map((i) => mname(i.medicineId) + " · " + i.instructions)
          .join("\n"),
        by: dname(c.doctorId),
      })),
    ...data.imaging
      .filter((c) => c.patientId === r.id)
      .map((c) => ({
        ...c,
        kind: "Imaging",
        title: c.modality + " - " + c.bodyPart,
        body: c.reportText + (c.reviewNote ? "\nReview: " + c.reviewNote : ""),
        by: c.reportingClinician,
      })),
    ...data.labs
      .filter((c) => c.patientId === r.id)
      .map((c) => ({
        ...c,
        kind: "Laboratory",
        title: c.testIds.map((id) => lookup("catalog", id)?.name).join(", "),
        body: c.status === "Released" ? c.results : c.status,
        by: dname(c.doctorId),
      })),
  ].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return (
    <>
      <div className="patient-profile">
        <Avatar name={r.name} />
        <div>
          <h2>{r.name}</h2>
          <p>
            {r.id} · {r.age} years · {r.gender} · {r.bloodGroup}
          </p>
        </div>
        {["Admin", "Doctor"].includes(user.role) && (
          <button
            className="button secondary"
            onClick={() => open("patientEdit", r)}
          >
            Edit profile
          </button>
        )}
      </div>
      <div className="detail-grid">
        <div>
          <small>Phone</small>
          <b>{r.phone}</b>
        </div>
        <div>
          <small>Address</small>
          <b>{r.address || "Not recorded"}</b>
        </div>
      </div>
      <div className="allergy-panel">
        <AlertTriangle size={17} />
        Allergies: {r.allergies || "Not recorded"}
      </div>
      <h4 className="form-section-title">
        Patient timeline <span className="count-chip">{timeline.length}</span>
      </h4>
      <div className="timeline">
        {!timeline.length ? (
          <Empty />
        ) : (
          timeline.map((t, i) => (
            <article key={t.id}>
              <span className="timeline-dot" />
              <small>
                {t.kind} · {humanDate(t.createdAt)} · {t.by}
              </small>
              <h4>{t.title}</h4>
              <p>{t.body}</p>
            </article>
          ))
        )}
      </div>
    </>
  );
}
function App() {
  const [user, setUser] = useState(null),
    [data, setData] = useState(null),
    [demo, setDemo] = useState(true),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState("dashboard"),
    [tab, setTab] = useState("Inventory"),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [mobile, setMobile] = useState(false),
    [notifications, setNotifications] = useState(false),
    [range, setRange] = useState("Today");
  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 4500);
  };
  async function refresh() {
    const r = await API("/bootstrap");
    setData(r.data);
    setUser(r.user);
    setDemo(r.demo);
  }
  useEffect(() => {
    API("/auth/me")
      .then((r) => {
        setUser(r.user);
        setDemo(r.demo);
        return refresh();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    setQuery("");
    setFilter("All");
    setRange("Today");
    setMobile(false);
  }, [page, tab]);
  useEffect(() => {
    function key(e) {
      if (e.key === "Escape") {
        setModal(null);
        setNotifications(false);
      }
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement.tagName,
        )
      ) {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const lookup = (c, id) => data?.[c]?.find((r) => r.id === id),
    pname = (id) => lookup("patients", id)?.name || "Unknown patient",
    dname = (id) => lookup("doctors", id)?.name || "Unassigned",
    mname = (id) => lookup("medicines", id)?.name || "Unknown medicine";
  const stock = (id) =>
    data.batches
      .filter((b) => b.medicineId === id && b.expiry > today())
      .reduce((s, b) => s + b.quantity, 0);
  const outstanding = (i) => Math.max(0, i.amount - (i.credit || 0) - i.paid);
  const open = (type, record) => {
    setError("");
    setModal({ type, record });
  };
  async function mutate(fn, message = "Saved successfully") {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
      setModal(null);
      notify(message);
    } catch (e) {
      setError(e.message);
      notify(e.message);
    } finally {
      setBusy(false);
    }
  }
  const action = (a, b, m) => mutate(() => API("/actions/" + a, b), m);
  const navigate = (p) => {
    setPage(p);
    if (p === "pharmacy") setTab("Inventory");
  };
  function exportCSV(rows, name) {
    const cols = Object.keys(rows[0] || {}).filter(
      (k) => !["salt", "passwordHash"].includes(k),
    );
    const quote = (v) =>
      '"' +
      String(typeof v === "object" ? JSON.stringify(v) : (v ?? "")).replaceAll(
        '"',
        '""',
      ) +
      '"';
    const csv = [
      cols.map(quote).join(","),
      ...rows.map((r) => cols.map((c) => quote(r[c])).join(",")),
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Report exported");
  }
  function printRecord(title, lines) {
    const w = window.open("", "_blank", "width=850,height=850");
    if (!w) {
      notify("Allow pop-ups to print");
      return;
    }
    const escape = (s) =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    w.document.write(
      "<!doctype html><html><head><title>" +
        escape(title) +
        "</title><style>body{font:15px Arial;padding:50px;color:#263044}h1{color:#7148db}p{line-height:1.8;white-space:pre-wrap}</style></head><body><h1>Dyvora Health OS</h1><h2>" +
        escape(title) +
        "</h2>" +
        lines.map((l) => "<p>" + escape(l) + "</p>").join("") +
        "<hr><small>" +
        (demo
          ? "Synthetic demonstration document. Not for clinical use."
          : "Generated " + escape(new Date().toISOString())) +
        "</small></body></html>",
    );
    w.document.close();
    w.focus();
    w.print();
  }
  if (loading)
    return (
      <div className="loading">
        <div className="brandmark">
          <HeartPulse />
        </div>
        <h2>Opening your workspace…</h2>
      </div>
    );
  if (!user || !data)
    return (
      <Login
        onLogin={async (email, password) => {
          await API("/auth/login", { email, password });
          await refresh();
        }}
      />
    );
  const todayApts = data.appointments.filter((a) => a.date === today()),
    activeQueue = todayApts.filter((a) =>
      ["Waiting", "In consultation"].includes(a.status),
    ),
    totalReceived = data.invoices
      .filter((i) => range === "All time" || i.createdAt?.startsWith(today()))
      .reduce((s, i) => s + i.paid, 0),
    lowStock = data.medicines.filter((m) => stock(m.id) <= m.reorderLevel),
    pendingLabs = data.labs.filter((l) => l.status === "Pending approval");
  const chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      count: data.appointments.filter((a) => a.date === key).length,
      completed: data.appointments.filter(
        (a) => a.date === key && a.status === "Completed",
      ).length,
    };
  });

  const iconButton = (Icon, onClick, label) => (
    <button
      className="icon-button"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Icon size={16} />
    </button>
  );

  const filtered = (rows) =>
    rows.filter(
      (r) =>
        JSON.stringify(r).toLowerCase().includes(query.toLowerCase()) ||
        (r.patientId &&
          pname(r.patientId).toLowerCase().includes(query.toLowerCase())) ||
        (r.doctorId &&
          dname(r.doctorId).toLowerCase().includes(query.toLowerCase())),
    );

  const modalTitles = {
    patient: "Patient record",
    patientEdit: "Edit patient profile",
    appointment: "New appointment",
    doctor: "Doctor profile",
    medicine: "Medicine details",
    batch: "Add stock batch",
    supplier: "Supplier profile",
    test: "Test catalog entry",
    user: "Team member access",
    message: "Draft patient message",
    lab: "New laboratory order",
    labDetail: "Laboratory order",
    consult: "Consultation workspace",
    prescription: "Prescription review",
    purchase: "Receive a purchase",
    invoice: "Create invoice",
    payment: "Collect payment",
    return: "Process a return",
    adjust: "Stock adjustment",
    purchaseOrder: "New purchase order",
    transfer: "Transfer stock",
    refund: "Record refund settlement",
    imagingReport: "Record imaging report",
    imagingDetail: "Imaging report review",
    pos: "Pharmacy counter sale",
  };
  return (
    <WorkspaceContext.Provider
      value={{
        user,
        setUser,
        data,
        setData,
        demo,
        setDemo,
        loading,
        setLoading,
        page,
        setPage,
        tab,
        setTab,
        query,
        setQuery,
        filter,
        setFilter,
        modal,
        setModal,
        toast,
        setToast,
        busy,
        setBusy,
        error,
        setError,
        mobile,
        setMobile,
        notifications,
        setNotifications,
        range,
        setRange,
        notify,
        refresh,
        lookup,
        pname,
        dname,
        mname,
        stock,
        outstanding,
        open,
        mutate,
        action,
        navigate,
        exportCSV,
        printRecord,
        todayApts,
        activeQueue,
        totalReceived,
        lowStock,
        pendingLabs,
        chartDays,
        iconButton,
        filtered,
        modalTitles,
      }}
    >
      <div className="app-shell">
        <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("dashboard");
            }}
          >
            <span className="brandmark">
              <HeartPulse size={25} />
            </span>
            <span>
              Dyvora<small>HEALTH OS</small>
            </span>
            <span className="brand-spark">✦</span>
          </a>
          <div className="workspace-tag">
            <Building2 size={16} />
            <span>
              {data.settings[0]?.name || "Dyvora Clinic"}
              <small>{data.settings[0]?.city || "Clinic workspace"}</small>
            </span>
            <ChevronDown size={13} />
          </div>
          <nav>
            {navGroups.map((g) => {
              const items = g.items.filter((i) =>
                allowed[user.role].includes(i[0]),
              );
              return (
                items.length > 0 && (
                  <div className="nav-group" key={g.label}>
                    <span className="nav-label">{g.label}</span>
                    {items.map(([p, label, I]) => (
                      <button
                        key={p}
                        className={"nav-item " + (page === p ? "active" : "")}
                        onClick={() => navigate(p)}
                      >
                        <I size={18} />
                        <span>{label}</span>
                        {p === "queue" && (
                          <b className="nav-count">{activeQueue.length}</b>
                        )}
                        {p === "labs" && pendingLabs.length > 0 && (
                          <i className="nav-dot" />
                        )}
                      </button>
                    ))}
                  </div>
                )
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="help-card">
              <span className="help-symbol">✧</span>
              <h4>A little help, anytime.</h4>
              <p>Your guide to a smoother day.</p>
              <button onClick={() => open("help")}>
                Explore workspace <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="system-status">
              <span className="pulse-dot" />
              System operational <span>v1.0</span>
            </div>
          </div>
        </aside>
        {mobile && (
          <div className="sidebar-scrim" onClick={() => setMobile(false)} />
        )}
        <div className="main-shell">
          <header className="topbar">
            <div className="topbar-left">
              <button
                className="icon-button menu-toggle"
                onClick={() => setMobile(!mobile)}
                aria-label="Toggle menu"
              >
                <Menu size={21} />
              </button>
              <span className="clinic-location">
                <Building2 size={15} />
                {data.settings[0]?.name || "Dyvora Clinic"}
                <ChevronDown size={13} />
              </span>
              <span className="top-divider" />
              <div className="global-search">
                <Search size={16} />
                <input
                  id="global-search"
                  placeholder="Search patients, UHID…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (page === "dashboard")
                      setPage(
                        allowed[user.role].includes("patients")
                          ? "patients"
                          : allowed[user.role].includes("prescriptions")
                            ? "prescriptions"
                            : "labs",
                      );
                  }}
                />
                <kbd>/</kbd>
              </div>
            </div>
            <div className="topbar-right">
              {demo && <span className="demo-label">Demo workspace</span>}
              <button
                className="notification-button icon-button"
                onClick={() => setNotifications(!notifications)}
                aria-label="Notifications"
              >
                <Bell size={19} />
                <i />
              </button>
              <span className="top-divider" />
              <button
                className="profile-button"
                onClick={() => open("account")}
              >
                <Avatar name={user.name} index={2} />
                <span>
                  {user.name}
                  <small>{user.role}</small>
                </span>
                <ChevronDown size={13} />
              </button>
            </div>
            {notifications && (
              <div className="notifications">
                <h3>Workspace notifications</h3>
                <button
                  onClick={() => {
                    setNotifications(false);
                    navigate("labs");
                  }}
                >
                  <FlaskConical size={18} />
                  <span>
                    <b>{pendingLabs.length} reports awaiting approval</b>
                    <small>Review the laboratory workspace</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
                <button
                  onClick={() => {
                    setNotifications(false);
                    navigate(
                      allowed[user.role].includes("pharmacy")
                        ? "pharmacy"
                        : "labs",
                    );
                  }}
                >
                  <Package size={18} />
                  <span>
                    <b>{lowStock.length} medicines at reorder level</b>
                    <small>Review available pharmacy stock</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </header>
          <main className="main-content">
            {page === "dashboard" ? <Dashboard /> : <MainPage />}
            <footer className="footer">
              <span>
                © {new Date().getFullYear()} Dyvora Health OS <i />
                Made for better care.
              </span>
              <span>
                <ShieldCheck size={13} />
                {demo
                  ? "Synthetic demo data · Not for clinical use"
                  : "Connected clinic workspace"}
              </span>
            </footer>
          </main>
        </div>
        {toast && (
          <div className="toast" role="status">
            <Check size={17} />
            {toast}
            <button
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
        {modal && (
          <Modal
            title={
              modalTitles[modal.type] ||
              (modal.type === "help"
                ? "Welcome to your workspace"
                : "Your account")
            }
            onClose={() => setModal(null)}
            wide={["consult", "patient", "lab"].includes(modal.type)}
          >
            <div className="modal-subtitle">
              {modal.record?.id || "Connected care starts here."}
            </div>
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
            {[
              "patientEdit",
              "appointment",
              "doctor",
              "medicine",
              "batch",
              "supplier",
              "test",
              "user",
              "message",
              "imagingReport",
            ].includes(modal.type) && (
              <GenericForm type={modal.type} record={modal.record} />
            )}{" "}
            {modal.type === "patient" &&
              (modal.record ? (
                <PatientDetail r={modal.record} />
              ) : (
                <GenericForm type="patient" />
              ))}
            {modal.type === "lab" && <LabForm />}
            {modal.type === "imagingDetail" && (
              <ImagingDetail r={modal.record} />
            )}{" "}
            {modal.type === "labDetail" && <LabDetail r={modal.record} />}{" "}
            {modal.type === "consult" && <ConsultForm r={modal.record} />}{" "}
            {modal.type === "prescription" && (
              <PrescriptionDetail r={modal.record} />
            )}{" "}
            {["purchase", "invoice", "payment", "return", "adjust"].includes(
              modal.type,
            ) && <TransactionForm type={modal.type} r={modal.record} />}{" "}
            {["purchaseOrder", "transfer", "refund"].includes(modal.type) && (
              <OperationsForm type={modal.type} r={modal.record} />
            )}{" "}
            {modal.type === "pos" && <POSForm />}
            {modal.type === "account" && (
              <>
                <div className="patient-profile">
                  <Avatar name={user.name} />
                  <div>
                    <h2>{user.name}</h2>
                    <p>
                      {user.email} · {user.role}
                    </p>
                  </div>
                </div>
                <button
                  className="button secondary"
                  onClick={async () => {
                    await API("/auth/logout", {});
                    setUser(null);
                    setData(null);
                    setModal(null);
                    setPage("dashboard");
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            )}
            {modal.type === "help" && (
              <div className="help-content">
                <h3>One record. Connected workflows.</h3>
                <p>
                  Register a patient, book an appointment, and check them in.
                  Call them from the queue to begin a consultation.
                </p>
                <p>
                  Signing a consultation sends its prescription to the pharmacy.
                  Dispensing deducts unexpired stock and creates a bill.
                </p>
                <p>
                  Lab orders move from sample collection to processing, then
                  pathologist verification and report release. Each change is
                  recorded in the audit trail.
                </p>
                <div className="info-strip">
                  Use the / key to search. Escape closes a dialog. Export
                  reports as CSV and print invoices, prescriptions and released
                  lab reports.
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </WorkspaceContext.Provider>
  );
}
function OperationsForm({ type, r }) {
  const { data, busy, mutate, action, stock, mname } =
    React.useContext(WorkspaceContext);
  const [v, setV] = useState({
      id: r?.id || "",
      quantity: 1,
      destination: "",
      amount: r?.refundDue || 0,
      method: "UPI",
      supplierId: "",
      notes: "",
    }),
    [items, setItems] = useState([{ medicineId: "", quantity: 1, cost: 0 }]);
  const input = (key, value) => setV({ ...v, [key]: value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (type === "purchaseOrder")
          mutate(
            () => API("/purchaseOrders", { ...v, items }),
            "Purchase order created",
          );
        else
          action(
            type,
            v,
            type === "transfer"
              ? "Stock transferred"
              : "Refund settlement recorded",
          );
      }}
    >
      <div className="form-grid">
        {type === "transfer" && (
          <>
            <label className="field full">
              <span>Source batch</span>
              <select
                aria-label="Source batch"
                required
                value={v.id}
                onChange={(e) => input("id", e.target.value)}
              >
                <option value="">Select batch</option>
                {data.batches
                  .filter((b) => b.quantity > 0)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {mname(b.medicineId)} - {b.batchNo} - {b.location} (
                      {b.quantity})
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>Destination location</span>
              <input
                aria-label="Destination location"
                required
                value={v.destination}
                onChange={(e) => input("destination", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Transfer quantity</span>
              <input
                aria-label="Transfer quantity"
                type="number"
                min="1"
                required
                value={v.quantity}
                onChange={(e) => input("quantity", Number(e.target.value))}
              />
            </label>
          </>
        )}
        {type === "refund" && (
          <>
            <div className="payment-summary full">
              <span>Refund due on {r.id}</span>
              <strong>{currency(r.refundDue)}</strong>
            </div>
            <label className="field">
              <span>Amount refunded (INR)</span>
              <input
                aria-label="Amount refunded (INR)"
                type="number"
                min=".01"
                step=".01"
                max={r.refundDue}
                required
                value={v.amount}
                onChange={(e) => input("amount", e.target.value)}
              />
            </label>
            <Select
              label="Refund method"
              options={["Cash", "UPI", "Card", "Bank transfer"]}
              value={v.method}
              onChange={(x) => input("method", x)}
            />
            <div className="info-strip full">
              Record this settlement after you have returned the money to the
              patient. This action records the transaction; it does not initiate
              a bank transfer.
            </div>
          </>
        )}
        {type === "purchaseOrder" && (
          <>
            <Select
              label="Supplier"
              source="suppliers"
              value={v.supplierId}
              onChange={(x) => input("supplierId", x)}
            />
            <label className="field">
              <span>Notes</span>
              <input
                aria-label="Notes"
                value={v.notes}
                onChange={(e) => input("notes", e.target.value)}
              />
            </label>
          </>
        )}
      </div>
      {type === "purchaseOrder" && (
        <>
          <h4 className="form-section-title">
            Medicines to order
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setItems([...items, { medicineId: "", quantity: 1, cost: 0 }])
              }
            >
              <Plus size={14} />
              Add item
            </button>
          </h4>
          {items.map((i, n) => (
            <div className="prescription-line" key={n}>
              <Select
                label="Medicine"
                source="medicines"
                value={i.medicineId}
                onChange={(x) =>
                  setItems(
                    items.map((a, j) =>
                      j === n ? { ...a, medicineId: x } : a,
                    ),
                  )
                }
              />
              {[
                ["quantity", "Quantity"],
                ["cost", "Estimated unit cost (INR)"],
              ].map(([key, label]) => (
                <label key={key} className="field">
                  <span>{label}</span>
                  <input
                    required
                    type="number"
                    min={key === "quantity" ? 1 : 0}
                    step={key === "cost" ? ".01" : "1"}
                    value={i[key]}
                    onChange={(e) =>
                      setItems(
                        items.map((a, j) =>
                          j === n ? { ...a, [key]: Number(e.target.value) } : a,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          ))}
        </>
      )}
      <FormFooter
        label={
          type === "purchaseOrder"
            ? "Create purchase order"
            : type === "transfer"
              ? "Transfer stock"
              : "Record refund"
        }
      />
    </form>
  );
}
function ReportAttachment({ collection, record, editable }) {
  const { busy, mutate } = React.useContext(WorkspaceContext);
  async function upload(file) {
    if (!file) return;
    await mutate(async () => {
      if (file.size > 5 * 1024 * 1024)
        throw Error("Choose a report under 5 MB");
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return API("/attachments", {
        collection,
        recordId: record.id,
        name: file.name,
        content,
      });
    }, "Report attachment saved");
  }
  return (
    <div className="attachment-panel">
      <div>
        <FileText size={18} />
        <span>
          <b>Report attachment</b>
          <small>
            {record.attachmentName || "PDF, JPEG or PNG - up to 5 MB"}
          </small>
        </span>
      </div>
      {record.attachmentId && (
        <a
          className="button secondary"
          href={"/api/attachments/" + record.attachmentId}
          target="_blank"
          rel="noreferrer"
        >
          Open report <ArrowUpRight size={14} />
        </a>
      )}
      {editable && (
        <label className="button secondary">
          {busy ? "Uploading..." : "Attach report"}
          <input
            disabled={busy}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            aria-label="Attach report file"
            onChange={(e) => upload(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
function ImagingWorkspace() {
  const { data, open, pname, dname } = React.useContext(WorkspaceContext);
  return (
    <section className="card">
      <div className="card-heading">
        <div>
          <h3>Imaging review</h3>
          <p>Review radiology findings alongside the patient record.</p>
        </div>
        <button
          className="button primary"
          onClick={() => open("imagingReport")}
        >
          <Plus size={16} />
          Add imaging report
        </button>
      </div>
      <Table
        columns={[
          "Patient",
          "Modality",
          "Study",
          "Radiologist",
          "Status",
          "Action",
        ]}
        rows={data.imaging}
        render={(r) => [
          <PatientCell id={r.patientId} />,
          r.modality,
          r.bodyPart,
          r.reportingClinician,
          <Badge>{r.status}</Badge>,
          <button
            className="text-button"
            onClick={() => open("imagingDetail", r)}
          >
            Review report <ArrowRight size={14} />
          </button>,
        ]}
      />
      <div className="info-strip">
        Reports and attached images support clinical review. Diagnostic DICOM
        viewing and PACS integration require a dedicated imaging service.
      </div>
    </section>
  );
}
function ImagingDetail({ r }) {
  const { user, dname, action, busy, printRecord, pname } =
    React.useContext(WorkspaceContext);
  const [note, setNote] = useState(r.reviewNote || "");
  return (
    <>
      <div className="detail-summary">
        <PatientCell id={r.patientId} />
        <Badge>{r.status}</Badge>
      </div>
      <div className="detail-grid">
        <div>
          <small>Study</small>
          <b>
            {r.modality} - {r.bodyPart}
          </b>
        </div>
        <div>
          <small>Reporting radiologist</small>
          <b>{r.reportingClinician}</b>
        </div>
        <div>
          <small>Reviewing doctor</small>
          <b>{dname(r.doctorId)}</b>
        </div>
        <div>
          <small>Study date</small>
          <b>{humanDate(r.performedAt)}</b>
        </div>
      </div>
      <h4 className="form-section-title">Radiology findings</h4>
      <p className="imaging-findings">{r.reportText}</p>
      <ReportAttachment
        collection="imaging"
        record={r}
        editable={r.status !== "Reviewed"}
      />
      <label className="field">
        <span>Clinician review and follow-up notes</span>
        <textarea
          aria-label="Clinician review and follow-up notes"
          rows={4}
          value={note}
          readOnly={r.status === "Reviewed"}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="form-footer">
        {r.status === "Reviewed" ? (
          <button
            className="button secondary"
            onClick={() =>
              printRecord("Imaging review " + r.id, [
                pname(r.patientId),
                r.modality + " - " + r.bodyPart,
                r.reportText,
                r.reviewNote,
                "Reviewed by " + r.reviewedBy,
              ])
            }
          >
            <Printer size={15} />
            Print review
          </button>
        ) : (
          <button
            className="button primary"
            disabled={busy}
            onClick={() =>
              action("imaging", { id: r.id, note }, "Imaging report reviewed")
            }
          >
            Sign review <Check size={15} />
          </button>
        )}
      </div>
    </>
  );
}
function POSForm() {
  const { data, action, stock } = React.useContext(WorkspaceContext);
  const [patientId, setPatient] = useState(""),
    [prescriptionId, setRx] = useState(""),
    [items, setItems] = useState([{ medicineId: "", quantity: 1 }]);
  const medicines = data.medicines.filter(
    (m) => m.salePolicy === "Non-prescription",
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        action(
          prescriptionId ? "dispense" : "pos",
          prescriptionId ? { id: prescriptionId } : { patientId, items },
          "Sale invoiced. Collect payment in Billing & payments.",
        );
      }}
    >
      <div className="form-grid">
        <Select
          label="Patient"
          source="patients"
          value={patientId}
          onChange={(x) => {
            setPatient(x);
            setRx("");
          }}
        />
        <label className="field">
          <span>Signed prescription (optional)</span>
          <select
            aria-label="Signed prescription (optional)"
            value={prescriptionId}
            onChange={(e) => setRx(e.target.value)}
          >
            <option value="">Non-prescription counter sale</option>
            {data.prescriptions
              .filter(
                (r) => r.patientId === patientId && r.status === "Pending",
              )
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
          </select>
        </label>
      </div>
      {prescriptionId ? (
        <div className="info-strip standalone">
          The medicines and quantities on this signed prescription will be
          dispensed. Prices, taxes and available stock are checked by the
          server.
        </div>
      ) : (
        <>
          <h4 className="form-section-title">
            Counter items
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setItems([...items, { medicineId: "", quantity: 1 }])
              }
            >
              <Plus size={14} />
              Add item
            </button>
          </h4>
          {!medicines.length && (
            <div className="info-strip standalone">
              Your catalog has no medicines marked Non-prescription. Review sale
              policies in Inventory, or select a signed prescription.
            </div>
          )}
          {items.map((item, n) => (
            <div className="prescription-line" key={n}>
              <label className="field">
                <span>Medicine</span>
                <select
                  aria-label="Medicine"
                  required
                  value={item.medicineId}
                  onChange={(e) =>
                    setItems(
                      items.map((i, j) =>
                        j === n ? { ...i, medicineId: e.target.value } : i,
                      ),
                    )
                  }
                >
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - {currency(m.price)} - {stock(m.id)} available
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Quantity</span>
                <input
                  aria-label="Quantity"
                  required
                  min="1"
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems(
                      items.map((i, j) =>
                        j === n
                          ? { ...i, quantity: Number(e.target.value) }
                          : i,
                      ),
                    )
                  }
                />
              </label>
              {items.length > 1 && (
                <button
                  type="button"
                  className="text-button red-text"
                  onClick={() => setItems(items.filter((_, j) => j !== n))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </>
      )}
      <FormFooter label="Dispense & create invoice" />
    </form>
  );
}
function Modal({ title, onClose, wide, children }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    const focusables = () =>
      [
        ...dialog.querySelectorAll(
          'button,input,textarea,select,[tabindex="0"]',
        ),
      ].filter((x) => !x.disabled);
    focusables()[0]?.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const fs = focusables(),
        first = fs[0],
        last = fs.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener("keydown", trap);
    document.body.style.overflow = "hidden";
    return () => {
      dialog.removeEventListener("keydown", trap);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        className={"modal " + (wide ? "wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div className="modal-title-icon">
            <HeartPulse size={20} />
          </div>
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@dyvora.local"),
    [password, setPassword] = useState("Dyvora@2026"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="brand">
          <span className="brandmark">
            <HeartPulse size={28} />
          </span>
          <span>
            Dyvora<small>HEALTH OS</small>
          </span>
        </div>
        <span className="login-eyebrow">A BETTER DAY OF CARE</span>
        <h1>
          More connected.
          <br />
          More considered.
          <br />
          <span>More human.</span>
        </h1>
        <p>
          Your patients, people, and practice.
          <br />
          Together in one thoughtful workspace.
        </p>
        <div className="login-illustration">
          <div className="medical-cross">+</div>
          <span className="login-orbit" />
          <div className="floating-card">
            <HeartPulse size={25} />
            <span>
              Built around care<small>From first visit to follow-up.</small>
            </span>
          </div>
        </div>
        <small>DYVORA HEALTH OS · CLINIC OPERATIONS, SIMPLIFIED</small>
      </section>
      <section className="login-form-panel">
        <div className="login-form-inner">
          <span className="eyebrow">YOUR CONNECTED WORKSPACE</span>
          <h2>Welcome back.</h2>
          <p>A good day of care starts here.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await onLogin(email, password);
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {error && (
              <div className="error-box" role="alert">
                {error}
              </div>
            )}
            <label className="field">
              <span>Email address</span>
              <input
                aria-label="Email address"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                aria-label="Password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="button primary login-submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to workspace"}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="demo-accounts">
            <span>EXPLORE THE DEMO</span>
            <div>
              {[
                ["admin", "Admin"],
                ["doctor", "Doctor"],
                ["pharmacy", "Pharmacy"],
                ["lab", "Laboratory"],
                ["pathologist", "Pathologist"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={email === id + "@dyvora.local" ? "active" : ""}
                  onClick={() => {
                    setEmail(id + "@dyvora.local");
                    setPassword("Dyvora@2026");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <p>
              Synthetic records only. Demo password: <b>Dyvora@2026</b>
            </p>
          </div>
          <div className="login-security">
            <ShieldCheck size={15} />
            Role-based access · Connected workflows
          </div>
        </div>
      </section>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
