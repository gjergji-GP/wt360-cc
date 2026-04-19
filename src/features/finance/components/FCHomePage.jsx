import { Icon } from "../../../components/common/Icon";

export function FCHomePage({
  invoices,
  ebills,
  tasks,
  setPage,
  session,
  onRefresh,
  pendingEbills,
  deps,
}) {
  const { fmtCurrency, fmtFull, DaysBadge, SourceBadge, TicketBadge } = deps;
  const allInv = invoices || [];
  const overdue = allInv.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT" && invoice.pay_deadline && new Date(invoice.pay_deadline) < new Date());
  const awaitingPay = allInv.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT");
  const paidMonth = allInv.filter((invoice) => invoice.status === "PAID" && invoice.paid_at && new Date(invoice.paid_at).getMonth() === new Date().getMonth());
  const cogsAwaiting = awaitingPay.filter((invoice) => invoice.purchase_order_id);
  const nonCogsAwaiting = awaitingPay.filter((invoice) => !invoice.purchase_order_id);
  const overdueAmt = overdue.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const awaitingAmt = awaitingPay.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const paidAmt = paidMonth.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const cogsAmt = awaitingPay.filter((invoice) => invoice.expense_category_code === "COGS").reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const nonCogsAmt = awaitingPay.filter((invoice) => invoice.expense_category_code !== "COGS").reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const allPendingEbills = pendingEbills || invoices.filter((invoice) => invoice.source === "EBILLS" && invoice.status === "PENDING");
  const pending = allPendingEbills.length;
  const recentEbills = allPendingEbills.sort((a, b) => new Date(b.invoice_date || 0) - new Date(a.invoice_date || 0)).slice(0, 6);
  const dueSoon = allInv.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT" && invoice.pay_deadline && new Date(invoice.pay_deadline) >= new Date() && Math.round((new Date(invoice.pay_deadline) - new Date()) / 86400000) <= 7).slice(0, 5);

  const kpis = [
    { label: "Unclassified eBills", value: pending, color: pending > 0 ? "var(--neg)" : "var(--pos)", urgent: pending > 0, page: "fc-inbox", sub: "Pending your review" },
    { label: "Awaiting Payment", value: awaitingPay.length, color: "var(--acc)", urgent: false, page: "fc-ledger", sub: `${fmtCurrency(awaitingAmt, true)} committed` },
    { label: "Overdue", value: overdue.length, color: overdue.length > 0 ? "var(--neg)" : "var(--pos)", urgent: overdue.length > 0, page: "fc-ledger", sub: overdue.length > 0 ? `${fmtCurrency(overdueAmt, true)} at risk` : "All clear" },
    { label: "Paid This Month", value: paidMonth.length, color: "var(--pos)", urgent: false, page: "fc-ledger", sub: fmtCurrency(paidAmt, true) },
  ];

  void ebills;
  void tasks;
  void session;
  void onRefresh;

  return (
    <div className="fade-up">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 28 }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card card-hover" onClick={() => setPage(kpi.page)} style={{ padding: "16px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: kpi.urgent ? kpi.color : "var(--divider)", borderRadius: "14px 14px 0 0" }} />
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: kpi.urgent ? kpi.color : "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div style={{ fontSize: 11.5, color: kpi.urgent ? "var(--sub)" : "var(--muted)", marginTop: 8, fontWeight: 500 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22, marginBottom: 24 }}>
        <div className="card">
          <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)", letterSpacing: "-0.01em" }}>eBills Inbox</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, fontWeight: 500 }}>Unclassified automatic invoices</div>
            </div>
            {pending > 0 && <span className="badge badge-r">{pending} pending</span>}
          </div>
          {recentEbills.length === 0 ? (
            <div style={{ padding: "40px 32px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--pos-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon name="check" size={20} color="var(--pos)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", marginBottom: 4 }}>Inbox clear</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>All eBills have been classified</div>
            </div>
          ) : (
            recentEbills.map((invoice, index) => (
              <div key={invoice.id || invoice.fic} className="rh" style={{ padding: "14px 22px", borderBottom: index < recentEbills.length - 1 ? "1px solid var(--divider)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{invoice.vendor_name_raw || invoice.seller_name || "-"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, display: "flex", gap: 8 }}>
                    <span>{fmtFull(invoice.invoice_date || invoice.received_at)}</span>
                    <DaysBadge dueDate={invoice.pay_deadline || invoice.due_date} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{fmtCurrency(invoice.total_amount || invoice.tot_price, true)}</div>
                  <SourceBadge source="EBILLS" />
                </div>
              </div>
            ))
          )}
          {pending > 6 && <div onClick={() => setPage("fc-inbox")} style={{ padding: "12px 20px", textAlign: "center", fontSize: 12.5, color: "var(--acc)", cursor: "pointer", fontWeight: 600, borderTop: "1px solid var(--divider)" }}>View all {pending} pending →</div>}
        </div>
        <div className="card">
          <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--divider)" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)", letterSpacing: "-0.01em" }}>Payment Urgency</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, fontWeight: 500 }}>Overdue & due within 7 days</div>
          </div>
          {overdue.length === 0 && dueSoon.length === 0 ? (
            <div style={{ padding: "40px 32px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--pos-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <Icon name="check" size={20} color="var(--pos)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", marginBottom: 4 }}>All clear</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>No overdue or imminent payments</div>
            </div>
          ) : (
            [...overdue, ...dueSoon].slice(0, 6).map((invoice, index, arr) => (
              <div key={invoice.id} className="rh" style={{ padding: "12px 20px", borderBottom: index < arr.length - 1 ? "1px solid var(--divider)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}><TicketBadge id={invoice.id} /></div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</div>
                  <DaysBadge dueDate={invoice.pay_deadline || invoice.due_date} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,.07),0 1px 4px rgba(0,0,0,.04)", overflow: "hidden" }}>
        <div style={{ padding: "20px 26px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)", letterSpacing: "-0.02em" }}>Committed but Unpaid</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3, fontWeight: 500 }}>Total financial obligations awaiting CFO payment</div>
          </div>
          <div style={{ padding: "4px 12px", borderRadius: 100, background: "var(--warn-bg)", border: "1px solid rgba(180,83,9,0.15)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warn)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Pending CFO</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "24px 26px", gap: 0 }}>
          <div style={{ paddingRight: 28 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Total Outstanding</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1 }}>{fmtCurrency(awaitingAmt, true)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{awaitingPay.length} invoices pending</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--divider)", paddingLeft: 28, paddingRight: 28 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>COGS · SC Pipeline</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--acc)", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmtCurrency(cogsAmt, true)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{cogsAwaiting.length} invoices · awaiting SC</div>
          </div>
          <div style={{ borderLeft: "1px solid var(--divider)", paddingLeft: 28 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Non-COGS · Ready</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--warn)", letterSpacing: "-0.03em", lineHeight: 1 }}>{fmtCurrency(nonCogsAmt, true)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>{nonCogsAwaiting.length} invoices · CFO can pay now</div>
          </div>
        </div>
      </div>
    </div>
  );
}
