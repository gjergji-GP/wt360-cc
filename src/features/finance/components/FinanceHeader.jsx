import { Icon } from "../../../components/common/Icon";

export function FinanceHeader({ page, session, onNewInvoice, datePreset, onDateChange }) {
  const pageLabels = {
    "fc-home": "Command Centre",
    "fc-inbox": "Invoice Inbox",
    "fc-tasks": "Action Required",
    "fc-ledger": "Finance Ledger",
    "fc-reports": "Reports",
    "fc-notif": "Notifications",
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="hdr-wrap">
      <div className="hdr-row1">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            {pageLabels[page] || "Finance"}
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, letterSpacing: "0.01em" }}>
            {dateStr} · {timeStr}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {(page === "fc-inbox" || page === "fc-home") && (
            <button onClick={onNewInvoice} className="wt-btn wt-btn-p">
              <Icon name="plus" size={14} color="#fff" />
              New Invoice
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(21,88,214,.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--acc)", border: "1px solid rgba(21,88,214,.15)", flexShrink: 0 }}>
              {(session?.first_name || session?.full_name || "F")[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{session?.full_name || "Finance Manager"}</div>
              <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{session?.role_name || "Finance Manager"}</div>
            </div>
          </div>
        </div>
      </div>
      {page !== "fc-inbox" && (
        <div className="hdr-row2">
          {["Today", "Yesterday", "Last 7 days", "Last 30 days"].map((value) => (
            <button key={value} className={`date-pill ${datePreset === value ? "on" : ""}`} onClick={() => onDateChange(value)}>
              {value}
            </button>
          ))}
          <span className="cmp-label" style={{ marginLeft: 4 }}>
            {datePreset === "Today"
              ? "vs yesterday"
              : datePreset === "Yesterday"
                ? "vs previous day"
                : datePreset === "Last 7 days"
                  ? "vs previous 7 days"
                  : "vs previous 30 days"}
          </span>
        </div>
      )}
    </div>
  );
}
