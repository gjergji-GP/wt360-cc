import { Icon } from "../../../components/common/Icon";

export function FCReportsPage({ activeReport, invoices, ebills, deps }) {
  const { TicketBadge, SourceBadge, StatusPill, fmtFull, fmtCurrency, DaysBadge } = deps;
  const allInv = invoices || [];
  const report = activeReport || "Invoice Activity";

  void ebills;

  if (report === "Invoice Activity") {
    return (
      <div className="fade-up">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Invoice Activity</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>Chronological log of every invoice registered in the Finance ledger.</div>
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead><tr><th>Ticket ID</th><th>Source</th><th>Vendor</th><th>Category</th><th>Action</th><th>Classified By</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>
              {allInv
                .sort((a, b) => new Date(b.classified_at || b.received_at || 0) - new Date(a.classified_at || a.received_at || 0))
                .slice(0, 60)
                .map((invoice) => (
                  <tr key={invoice.id} className="rh">
                    <td><TicketBadge id={invoice.id} /></td>
                    <td><SourceBadge source={invoice.source} /></td>
                    <td style={{ fontWeight: 600, fontSize: 12.5 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</td>
                    <td style={{ fontSize: 12, color: "var(--sub)" }}>{invoice.expense_category_code || "Unclassified"}</td>
                    <td><StatusPill status={invoice.status} /></td>
                    <td style={{ fontSize: 12, color: "var(--sub)" }}>{invoice.classified_by_name || "-"}</td>
                    <td style={{ fontSize: 12, color: "var(--sub)" }}>{fmtFull(invoice.classified_at || invoice.received_at)}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (report === "Payment Status Overview") {
    const byStatus = {
      PENDING: allInv.filter((invoice) => invoice.status === "PENDING"),
      APPROVED_FOR_PAYMENT: allInv.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT"),
      PAID: allInv.filter((invoice) => invoice.status === "PAID"),
      REJECTED: allInv.filter((invoice) => invoice.status === "REJECTED"),
    };
    const cogsAwaiting = byStatus.APPROVED_FOR_PAYMENT.filter((invoice) => invoice.purchase_order_id);
    const nonCogsAwaiting = byStatus.APPROVED_FOR_PAYMENT.filter((invoice) => !invoice.purchase_order_id);

    return (
      <div className="fade-up">
        <div style={{ marginBottom: 16 }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Payment Status Overview</div></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {Object.entries(byStatus).map(([status, arr]) => (
            <div key={status} className="card" style={{ padding: "20px" }}>
              <StatusPill status={status} />
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10, letterSpacing: "-0.03em" }}>{arr.length}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{fmtCurrency(arr.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0), true)}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: "20px 24px" }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 16 }}>APPROVED FOR PAYMENT breakdown</div>
          {[
            { l: "Non-COGS - Ready for CFO", v: nonCogsAwaiting.length, amt: nonCogsAwaiting.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0), color: "var(--warn)" },
            { l: "COGS - Awaiting SC pipeline completion", v: cogsAwaiting.length, amt: cogsAwaiting.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0), color: "var(--acc)" },
          ].map((row) => (
            <div key={row.l} className="kpi-row">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }} />
                <span style={{ fontSize: 13, color: "var(--sub)" }}>{row.l}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: "var(--muted)", fontSize: 12 }}>{fmtCurrency(row.amt, true)}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{row.v}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (report === "Overdue & Due Soon") {
    const today = new Date();
    const overdue = allInv.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT" && invoice.pay_deadline && new Date(invoice.pay_deadline) < today);
    const dueSoon = allInv.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT" && invoice.pay_deadline && new Date(invoice.pay_deadline) >= today && Math.round((new Date(invoice.pay_deadline) - today) / 86400000) <= 7);

    return (
      <div className="fade-up">
        <div style={{ marginBottom: 16 }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Overdue & Due Soon</div></div>
        {overdue.length > 0 && (
          <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neg)" }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--neg)" }}>Overdue ({overdue.length})</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Ticket ID</th><th>Vendor</th><th>Due Date</th><th>Days Overdue</th><th>Amount</th></tr></thead>
              <tbody>
                {overdue.map((invoice) => (
                  <tr key={invoice.id} className="rh">
                    <td><TicketBadge id={invoice.id} /></td>
                    <td style={{ fontWeight: 600 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</td>
                    <td style={{ color: "var(--neg)", fontWeight: 600 }}>{fmtFull(invoice.pay_deadline || invoice.due_date)}</td>
                    <td><span style={{ color: "var(--neg)", fontWeight: 700 }}>{Math.abs(Math.round((new Date(invoice.pay_deadline || invoice.due_date) - new Date()) / 86400000))}d overdue</span></td>
                    <td style={{ fontWeight: 700 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {dueSoon.length > 0 && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--warn)" }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--warn)" }}>Due within 7 days ({dueSoon.length})</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Ticket ID</th><th>Vendor</th><th>Due Date</th><th>Days Remaining</th><th>Amount</th></tr></thead>
              <tbody>
                {dueSoon.map((invoice) => (
                  <tr key={invoice.id} className="rh">
                    <td><TicketBadge id={invoice.id} /></td>
                    <td style={{ fontWeight: 600 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</td>
                    <td>{fmtFull(invoice.pay_deadline || invoice.due_date)}</td>
                    <td><DaysBadge dueDate={invoice.pay_deadline || invoice.due_date} /></td>
                    <td style={{ fontWeight: 700 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {overdue.length === 0 && dueSoon.length === 0 && (
          <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
            <Icon name="check" size={32} color="var(--pos)" />
            <div style={{ marginTop: 12, fontWeight: 600, color: "var(--pos)" }}>All clear</div>
          </div>
        )}
      </div>
    );
  }

  if (report === "Rejection Register") {
    const rejected = allInv.filter((invoice) => invoice.status === "REJECTED");
    return (
      <div className="fade-up">
        <div style={{ marginBottom: 16 }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Rejection Register</div><div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>All rejected invoices. Permanent audit record.</div></div>
        <div className="card" style={{ overflow: "hidden" }}>
          {rejected.length === 0 ? <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>No rejected invoices on record.</div> : (
            <table className="data-table">
              <thead><tr><th>Ticket ID</th><th>Vendor</th><th>Source</th><th>Reason</th><th>Rejected By</th><th>Date</th><th>Amount</th></tr></thead>
              <tbody>
                {rejected.map((invoice) => (
                  <tr key={invoice.id} className="rh">
                    <td><TicketBadge id={invoice.id} /></td>
                    <td style={{ fontWeight: 600 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</td>
                    <td><SourceBadge source={invoice.source} /></td>
                    <td style={{ fontSize: 12.5, color: "var(--sub)", maxWidth: 200 }}>{invoice.rejection_reason || "No reason recorded"}</td>
                    <td style={{ fontSize: 12, color: "var(--sub)" }}>{invoice.classified_by_name || "-"}</td>
                    <td style={{ fontSize: 12, color: "var(--sub)" }}>{fmtFull(invoice.classified_at)}</td>
                    <td style={{ fontWeight: 600 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  if (report === "COGS Handoff Log") {
    const cogs = allInv.filter((invoice) => invoice.expense_category_code === "COGS" || invoice.purchase_order_id);
    return (
      <div className="fade-up">
        <div style={{ marginBottom: 16 }}><div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>COGS Handoff Log</div><div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>Every COGS invoice handed to Supply Chain. Finance record is permanent.</div></div>
        <div className="card" style={{ overflow: "hidden" }}>
          {cogs.length === 0 ? <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>No COGS invoices on record yet.</div> : (
            <table className="data-table">
              <thead><tr><th>Ticket ID</th><th>Vendor</th><th>Classified</th><th>SC Status</th><th>Days in Pipeline</th><th>Amount</th></tr></thead>
              <tbody>
                {cogs.map((invoice) => {
                  const daysIn = invoice.classified_at ? Math.round((new Date() - new Date(invoice.classified_at)) / 86400000) : null;
                  return (
                    <tr key={invoice.id} className="rh">
                      <td><TicketBadge id={invoice.id} /></td>
                      <td style={{ fontWeight: 600 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</td>
                      <td style={{ fontSize: 12, color: "var(--sub)" }}>{fmtFull(invoice.classified_at)}</td>
                      <td>{invoice.status === "PAID" ? <span className="badge badge-g">Complete</span> : invoice.purchase_order_id ? <span className="badge badge-b">SC Active</span> : <span className="badge badge-o">Pending SC</span>}</td>
                      <td style={{ fontWeight: daysIn > 3 ? 700 : 400, color: daysIn > 3 ? "var(--warn)" : "var(--sub)" }}>{daysIn !== null ? `${daysIn}d` : "-"}</td>
                      <td style={{ fontWeight: 600 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  return <div className="fade-up" style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>Select a report from the sidebar.</div>;
}
