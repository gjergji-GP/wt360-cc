import { useState } from "react";
import { Icon } from "../../../components/common/Icon";

export function FCInboxPage({ ebills, invoices, onClassify, onDetail, deps }) {
  const { TicketBadge, fmtFull, DaysBadge, fmtCurrency, SourceBadge, StatusPill } = deps;
  const [tab, setTab] = useState("pending");
  const pending = invoices
    .filter((invoice) => invoice.source === "EBILLS" && invoice.status === "PENDING")
    .sort((a, b) => new Date(b.invoice_date || b.received_at || 0) - new Date(a.invoice_date || a.received_at || 0));
  const actionRequired = invoices
    .filter((invoice) => invoice.source !== "EBILLS" && invoice.status === "PENDING")
    .sort((a, b) => new Date(a.due_date || a.pay_deadline || "9999") - new Date(b.due_date || b.pay_deadline || "9999"));
  const tabs = [
    { id: "pending", label: "eBills Unclassified", count: pending.length },
    { id: "action", label: "Requires Action", count: actionRequired.length },
  ];

  void ebills;

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg)", padding: 4, borderRadius: 11, width: "fit-content" }}>
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: tab === item.id ? "var(--card)" : "transparent", color: tab === item.id ? "var(--ink)" : "var(--sub)", fontWeight: tab === item.id ? 600 : 400, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: tab === item.id ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .12s" }}
          >
            {item.label}
            {item.count > 0 && <span style={{ background: tab === item.id ? "var(--neg)" : "var(--divider)", color: tab === item.id ? "#fff" : "var(--sub)", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 100 }}>{item.count}</span>}
          </button>
        ))}
      </div>
      {tab === "pending" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {pending.length === 0 ? (
            <div style={{ padding: "60px 48px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--pos-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="check" size={22} color="var(--pos)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 5 }}>Inbox clear</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>All eBills have been classified - nothing pending your review</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th><th>Seller</th><th>FIC</th><th>Issue Date</th><th>Due Date</th><th>Total</th><th>Type</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((invoice) => (
                  <tr key={invoice.id} className="rh" style={{ cursor: "pointer" }} onClick={() => onDetail(invoice)}>
                    <td><TicketBadge id={invoice.id} /></td>
                    <td><div style={{ fontWeight: 600, fontSize: 13 }}>{invoice.vendor_name_raw || "-"}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{invoice.fiscal_ref ? `${invoice.fiscal_ref.slice(0, 12)}...` : ""}</div></td>
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--sub)" }}>{invoice.ebills_fic ? `${invoice.ebills_fic.slice(0, 12)}...` : "-"}</td>
                    <td style={{ fontSize: 12.5, color: "var(--sub)" }}>{fmtFull(invoice.invoice_date || invoice.received_at)}</td>
                    <td><DaysBadge dueDate={invoice.due_date} /></td>
                    <td style={{ fontWeight: 700 }}>{fmtCurrency(invoice.total_amount, true)}</td>
                    <td><span style={{ fontSize: 11.5, color: "var(--sub)" }}>{invoice.currency || "ALL"}</span></td>
                    <td><button onClick={(event) => { event.stopPropagation(); onClassify(invoice); }} style={{ padding: "6px 14px", borderRadius: 9, border: "1px solid var(--acc)", background: "var(--acc-bg)", color: "var(--acc)", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "-0.01em", transition: "background .12s" }} onMouseEnter={(event) => { event.currentTarget.style.background = "rgba(21,88,214,0.12)"; }} onMouseLeave={(event) => { event.currentTarget.style.background = "var(--acc-bg)"; }}>Classify →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "action" && (
        <div className="card" style={{ overflow: "hidden" }}>
          {actionRequired.length === 0 ? (
            <div style={{ padding: "60px 48px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--pos-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <Icon name="check" size={22} color="var(--pos)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 5 }}>No pending actions</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>No invoices require your attention right now</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket ID</th><th>Vendor</th><th>Source</th><th>Category</th><th>Total</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {actionRequired.map((invoice) => (
                  <tr key={invoice.id} className="rh" onClick={() => onDetail(invoice)} style={{ cursor: "pointer" }}>
                    <td><TicketBadge id={invoice.id} /></td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</td>
                    <td><SourceBadge source={invoice.source} /></td>
                    <td style={{ fontSize: 12.5, color: "var(--sub)" }}>{invoice.expense_category_code || "Unclassified"}</td>
                    <td style={{ fontWeight: 700 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                    <td><StatusPill status={invoice.status} /></td>
                    <td><button onClick={(event) => { event.stopPropagation(); onClassify(invoice); }} style={{ padding: "5px 13px", borderRadius: 8, border: "1px solid var(--acc)", background: "var(--acc-bg)", color: "var(--acc)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Classify →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
