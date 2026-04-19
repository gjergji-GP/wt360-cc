import { fmtCurrency } from "../formatters";

export function AlertStrip({
  pending,
  overdue,
  overdueAmt,
  awaitingPay,
  awaitingAmt,
  quarantine,
  flags,
  onNav,
}) {
  const items = [
    {
      label: "Unclassified",
      value: pending,
      sub: "eBills",
      color: pending > 0 ? "var(--neg)" : "var(--pos)",
      page: "fc-inbox",
      urgent: pending > 0,
    },
    {
      label: "Overdue Payments",
      value: overdue,
      sub: overdue > 0 ? fmtCurrency(overdueAmt) : "All clear",
      color: overdue > 0 ? "var(--neg)" : "var(--pos)",
      page: "fc-ledger",
      urgent: overdue > 0,
    },
    {
      label: "Awaiting CFO",
      value: awaitingPay,
      sub: awaitingPay > 0 ? fmtCurrency(awaitingAmt) : "No pending",
      color: "var(--warn)",
      page: "fc-ledger",
      urgent: awaitingPay > 0,
    },
    {
      label: "SC Quarantines",
      value: quarantine,
      sub: "To resolve",
      color: quarantine > 0 ? "var(--warn)" : "var(--pos)",
      page: "fc-tasks",
      urgent: quarantine > 0,
    },
    {
      label: "Action Required",
      value: flags,
      sub: "Tasks",
      color: flags > 0 ? "var(--warn)" : "var(--pos)",
      page: "fc-tasks",
      urgent: flags > 0,
    },
  ];

  return (
    <div
      style={{
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        margin: "20px 0 0",
        borderRadius: "var(--cr)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)" }}>
        {items.map((item, index) => (
          <div
            key={item.label}
            onClick={() => onNav(item.page)}
            style={{
              padding: "0",
              borderRight: index < items.length - 1 ? "1px solid var(--divider)" : "none",
              cursor: "pointer",
              transition: "background .12s",
              position: "relative",
              overflow: "hidden",
              borderTop: `3px solid ${item.urgent ? item.color : "var(--divider)"}`,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "rgba(15,23,42,0.03)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "transparent";
            }}
          >
            <div style={{ padding: "13px 20px 12px" }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: "var(--muted)",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  lineHeight: 1,
                }}
              >
                {item.label}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 7, marginBottom: 4 }}>
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 600,
                    color: item.urgent ? item.color : "var(--ink)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {item.value}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: item.urgent ? "var(--sub)" : "var(--muted)",
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
