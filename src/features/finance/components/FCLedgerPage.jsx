import { useState } from "react";
import { Icon } from "../../../components/common/Icon";
import { FIN_CATEGORIES } from "../config";

export function FCLedgerPage({ invoices, onDetail, deps }) {
  const { fmtCurrency, TicketBadge, SourceBadge, fmtFull, DaysBadge, StatusPill } = deps;
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [subFilter, setSubFilter] = useState("ALL");
  const [srcFilter, setSrcFilter] = useState("ALL");

  const selLedgerCat = FIN_CATEGORIES.find((category) => category.code === catFilter);
  const subOptions = selLedgerCat ? selLedgerCat.subs : [];
  const allInv = invoices || [];
  const filtered = allInv.filter((invoice) => {
    if (tab !== "pending" && invoice.status === "PENDING") return false;
    if (tab === "pending" && invoice.status !== "PENDING") return false;
    if (search && !((invoice.seller_name || invoice.vendor_name_raw || "").toLowerCase().includes(search.toLowerCase()) || (invoice.fic || "").toLowerCase().includes(search.toLowerCase()))) return false;
    if (catFilter !== "ALL" && invoice.expense_category_code !== catFilter) return false;
    if (subFilter !== "ALL" && invoice.expense_subcategory !== subFilter) return false;
    if (srcFilter !== "ALL" && invoice.source !== srcFilter) return false;
    if (tab === "awaiting" && invoice.status !== "APPROVED_FOR_PAYMENT") return false;
    if (tab === "paid" && invoice.status !== "PAID") return false;
    if (tab === "cogs" && invoice.expense_category_code !== "COGS") return false;
    return true;
  });
  const totalAmt = filtered.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending Classification" },
    { id: "awaiting", label: "Awaiting Payment" },
    { id: "paid", label: "Paid" },
    { id: "cogs", label: "COGS Pipeline" },
  ];

  return (
    <div className="fade-up">
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[
          { l: "Shown", v: `${filtered.length} invoices` },
          { l: "Total Value", v: fmtCurrency(totalAmt, true) },
          { l: "Overdue", v: filtered.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT" && invoice.pay_deadline && new Date(invoice.pay_deadline) < new Date()).length, color: "var(--neg)" },
        ].map((stat) => (
          <div key={stat.l} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 20px", boxShadow: "var(--card-shadow)" }}>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4 }}>{stat.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: stat.color || "var(--ink)", letterSpacing: "-0.02em" }}>{stat.v}</div>
          </div>
        ))}
        <div style={{ flex: 1, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--card-shadow)" }}>
          <Icon name="search" size={14} color="var(--muted)" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vendor or FIC..." style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--ink)", background: "transparent" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--bg)", padding: 4, borderRadius: 11 }}>
          {tabs.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: tab === item.id ? "var(--card)" : "transparent", color: tab === item.id ? "var(--ink)" : "var(--sub)", fontWeight: tab === item.id ? 600 : 400, fontSize: 12.5, cursor: "pointer", boxShadow: tab === item.id ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={catFilter} onChange={(event) => { setCatFilter(event.target.value); setSubFilter("ALL"); }} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12.5, color: catFilter !== "ALL" ? "var(--acc)" : "var(--sub)", outline: "none", boxShadow: "0 1px 3px rgba(0,0,0,.04)", fontFamily: "var(--f)", fontWeight: catFilter !== "ALL" ? 600 : 400, transition: "color .1s,border-color .1s", borderColor: catFilter !== "ALL" ? "var(--acc)" : undefined }}>
            <option value="ALL">All Categories</option>
            {FIN_CATEGORIES.map((category) => <option key={category.code} value={category.code}>{category.name}</option>)}
          </select>
          {catFilter !== "ALL" && subOptions.length > 0 && (
            <select value={subFilter} onChange={(event) => setSubFilter(event.target.value)} style={{ padding: "7px 12px", borderRadius: 9, border: `1px solid ${subFilter !== "ALL" ? "var(--acc)" : "var(--border)"}`, background: "var(--card)", fontSize: 12.5, color: subFilter !== "ALL" ? "var(--acc)" : "var(--sub)", outline: "none", boxShadow: "0 1px 3px rgba(0,0,0,.04)", fontFamily: "var(--f)", fontWeight: subFilter !== "ALL" ? 600 : 400, transition: "all .12s" }}>
              <option value="ALL">All Subcategories</option>
              {subOptions.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          )}
          <select value={srcFilter} onChange={(event) => setSrcFilter(event.target.value)} style={{ padding: "7px 12px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12.5, color: "var(--sub)", outline: "none", boxShadow: "0 1px 3px rgba(0,0,0,.04)", fontFamily: "var(--f)" }}>
            <option value="ALL">All Sources</option>
            <option value="EBILLS">eBills</option>
            <option value="MANUAL">Manual</option>
          </select>
          {(catFilter !== "ALL" || subFilter !== "ALL" || srcFilter !== "ALL") && (
            <button onClick={() => { setCatFilter("ALL"); setSubFilter("ALL"); setSrcFilter("ALL"); }} style={{ padding: "6px 11px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 11.5, color: "var(--sub)", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "var(--f)" }}>
              Clear x
            </button>
          )}
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 48px", textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 5 }}>No results</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>No invoices match the current filters</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th><th>Source</th><th>Vendor</th><th>Category</th><th>Invoice Date</th><th>Due Date</th><th>Total</th><th>Status</th>
                {tab === "cogs" && <th>Pipeline Stage</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((invoice) => (
                <tr key={invoice.id} className="rh" onClick={() => onDetail(invoice)} style={{ cursor: "pointer" }}>
                  <td><TicketBadge id={invoice.id} /></td>
                  <td><SourceBadge source={invoice.source} /></td>
                  <td><div style={{ fontWeight: 600, fontSize: 13 }}>{invoice.seller_name || invoice.vendor_name_raw || "-"}</div></td>
                  <td style={{ fontSize: 12, color: "var(--sub)" }}>{invoice.expense_category_code || "-"}<br /><span style={{ fontSize: 10.5, color: "var(--muted)" }}>{invoice.expense_subcategory || ""}</span></td>
                  <td style={{ fontSize: 12.5, color: "var(--sub)" }}>{fmtFull(invoice.invoice_date || invoice.issue_date_time)}</td>
                  <td><DaysBadge dueDate={invoice.pay_deadline || invoice.due_date} /></td>
                  <td style={{ fontWeight: 700 }}>{fmtCurrency(invoice.tot_price || invoice.total_amount, true)}</td>
                  <td><StatusPill status={invoice.status} /></td>
                  {tab === "cogs" && <td style={{ fontSize: 12, color: "var(--sub)" }}>{invoice.purchase_order_id ? "SC Active" : "-"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filtered.length > 50 && <div style={{ padding: "14px", textAlign: "center", fontSize: 12.5, color: "var(--muted)", borderTop: "1px solid var(--divider)" }}>Showing 50 of {filtered.length}. Use filters to narrow results.</div>}
      </div>
    </div>
  );
}
