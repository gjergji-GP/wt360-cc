export function SourceBadge({ source }) {
  const config =
    source === "EBILLS"
      ? { bg: "rgba(16,185,129,0.08)", color: "#059669", label: "eBills" }
      : source === "MANUAL"
        ? { bg: "rgba(107,114,128,0.08)", color: "#6b7280", label: "Manual" }
        : { bg: "var(--faint)", color: "var(--sub)", label: source || "-" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 100,
        fontSize: 10.5,
        fontWeight: 700,
        background: config.bg,
        color: config.color,
        letterSpacing: "0.04em",
      }}
    >
      {config.label}
    </span>
  );
}

export function StatusPill({ status }) {
  const map = {
    PENDING: { bg: "var(--warn-bg)", color: "var(--warn)", label: "Pending" },
    APPROVED_FOR_PAYMENT: {
      bg: "rgba(29,107,243,0.08)",
      color: "var(--acc)",
      label: "Awaiting Payment",
    },
    PAID: { bg: "var(--pos-bg)", color: "var(--pos)", label: "Paid" },
    REJECTED: { bg: "var(--neg-bg)", color: "var(--neg)", label: "Rejected" },
  };
  const state = map[status] || {
    bg: "var(--faint)",
    color: "var(--sub)",
    label: status || "-",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "2px 9px",
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 600,
        background: state.bg,
        color: state.color,
      }}
    >
      {state.label}
    </span>
  );
}

export function DaysBadge({ dueDate }) {
  if (!dueDate) {
    return <span style={{ color: "var(--muted)", fontSize: 12 }}>-</span>;
  }

  const days = Math.round((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) {
    return (
      <span style={{ color: "var(--neg)", fontWeight: 700, fontSize: 12 }}>
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return (
      <span style={{ color: "var(--neg)", fontWeight: 700, fontSize: 12 }}>
        Due today
      </span>
    );
  }
  if (days <= 3) {
    return (
      <span style={{ color: "var(--warn)", fontWeight: 600, fontSize: 12 }}>
        In {days}d
      </span>
    );
  }
  return <span style={{ color: "var(--muted)", fontSize: 12 }}>In {days}d</span>;
}

export function TicketBadge({ id }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 10,
        color: "var(--sub)",
        background: "var(--faint)",
        border: "1px solid var(--divider)",
        borderRadius: 7,
        padding: "2px 8px",
        letterSpacing: "0.05em",
        fontWeight: 600,
      }}
    >
      {id ? `#${String(id).slice(0, 8).toUpperCase()}` : "-"}
    </span>
  );
}
