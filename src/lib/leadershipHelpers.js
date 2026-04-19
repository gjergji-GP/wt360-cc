export const fmtAgo = (d) => {
  if (!d) return "-";
  const diff = Math.floor((new Date() - new Date(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 0) {
    const a = Math.abs(diff);
    return a === 1 ? "Tomorrow" : `In ${a}d`;
  }
  return `${diff}d ago`;
};

export const fmtFull = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const tLabel = (code) =>
  ({
    HR_MISSING_DOC: "Missing Document",
    CONTRACT_EXPIRY: "Contract Expiry",
    HR_ONBOARD_REQUEST: "Onboarding Request",
    HR_OFFBOARD_REQUEST: "Offboarding Request",
    TIMESHEET_REVIEW: "Timesheet Review",
    ATTENDANCE_MANUAL_CORRECTION: "Attendance Correction",
    PROBATION_REVIEW: "Probation Review",
    PERFORMANCE_REVIEW: "Performance Review",
    WATCHDOG_LEDGER_UNLINKED: "Unlinked Invoice",
    QUARANTINE_REVIEW: "Quarantine Review",
    GENERAL: "General Task",
    POLICY_ACK_PENDING: "Policy Acknowledgement",
    WELLBEING_CHECK: "Wellbeing Check",
    WATCHDOG_PRODUCTION_VARIANCE: "Production Variance",
    WATCHDOG_NEG_STOCK: "Negative Stock",
    WATCHDOG_AWAITING_DELIVERY_OVERDUE: "Awaiting Delivery Overdue",
    WATCHDOG_QUARANTINE_STALE: "Quarantine Stale",
    RECEIVE_DELIVERY: "Receive Delivery",
    STOCK_COUNT: "Stock Count",
    DATA_HYGIENE_RECEIVING: "Data Hygiene - Receiving",
    SC_REVIEW_RECEIVING: "SC Review Receiving",
  }[code] || code?.replace(/_/g, " ") || "Task");

export const pColor = (p) => (p >= 4 ? "var(--neg)" : p >= 3 ? "var(--warn)" : "var(--sub)");

export const pLabel = (p) => (p ? `P${p}` : "-");

export const sk = (base, n = 8) =>
  Array.from({ length: n }, (_, i) => Math.max(0, Math.round(+base + Math.sin(i * 1.3) * 6 + i * 0.5)));

export const resolveLocName = (task, locMap) => {
  if (task.location_name) return task.location_name;
  if (task.location_id && locMap && locMap[task.location_id]) return locMap[task.location_id];
  const hqRoles = ["COO", "SYSTEM_ADMIN", "HR_MANAGER", "FINANCE_MANAGER"];
  if (hqRoles.includes(task.assigned_role)) return "HQ";
  return "-";
};
