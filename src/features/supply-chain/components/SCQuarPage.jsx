import { useState } from "react";
import { ageCls, scAge, scHrs, trigLbl, trigTag } from "../helpers";
import { SCIcon } from "./SCIcon";

export function SCQuarPage({ quarantines = [], search, onReload, deps }) {
  const { SCEmpty, SCQuarDetail } = deps;
  const [sel, setSel] = useState(null);
  const [typeF, setTypeF] = useState("ALL");

  const open = quarantines.filter((quarantine) => quarantine.status !== "CLOSED");
  const byReason = open.reduce((acc, quarantine) => {
    acc[quarantine.quarantine_reason] = (acc[quarantine.quarantine_reason] || 0) + 1;
    return acc;
  }, {});
  const types = ["ALL", "UNKNOWN_SKU", "PRICE_DEVIATION", "UOM_MISMATCH", "VENDOR_MISMATCH"];
  const filtered = open
    .filter((quarantine) => (typeF === "ALL" ? true : quarantine.quarantine_reason === typeF))
    .filter((quarantine) => !search || JSON.stringify(quarantine).toLowerCase().includes(search.toLowerCase()));

  const sumCards = [
    { l: "Open Tickets", v: open.length, c: open.length > 0 ? "var(--sc-neg)" : "var(--sc-pos)" },
    { l: "Unknown SKU", v: byReason.UNKNOWN_SKU || 0, c: "var(--sc-warn)" },
    { l: "Price Deviations", v: byReason.PRICE_DEVIATION || 0, c: "var(--sc-neg)" },
  ];

  return (
    <div className="sc-fu">
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {sumCards.map((card, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              background: "var(--sc-card)",
              border: "1px solid var(--sc-border)",
              borderTop: "3px solid var(--sc-acc)",
              borderRadius: 14,
              padding: "14px 20px 16px",
              boxShadow: "var(--sc-shadow)",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: card.c, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>
              {card.v}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sc-sub)", marginTop: 4 }}>{card.l}</div>
          </div>
        ))}
      </div>
      <div className="sc-filter-bar">
        <SCIcon n="filter" s={13} c="var(--sc-muted)" />
        {types.map((filter) => (
          <button key={filter} className={`sc-fc ${typeF === filter ? "on" : ""}`} onClick={() => setTypeF(filter)}>
            {filter === "ALL" ? "All Types" : trigLbl(filter)}
            {filter !== "ALL" && byReason[filter] > 0 && (
              <span
                style={{
                  marginLeft: 5,
                  background: "var(--sc-neg)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  borderRadius: 100,
                  padding: "1px 5px",
                  lineHeight: 1.7,
                }}
              >
                {byReason[filter]}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="sc-panel">
        {filtered.length === 0 ? (
          <SCEmpty msg="No quarantine tickets match filters" color="var(--sc-muted)" />
        ) : (
          <table className="sc-tbl">
            <thead>
              <tr>
                <th>Type</th>
                <th>Ticket #</th>
                <th>Vendor</th>
                <th>Invoice</th>
                <th>Lines</th>
                <th>Age</th>
                <th>SLA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quarantine) => (
                <tr key={quarantine.id} onClick={() => setSel(quarantine)}>
                  <td>
                    <span className={`sc-tag ${trigTag(quarantine.quarantine_reason)}`}>{trigLbl(quarantine.quarantine_reason)}</span>
                  </td>
                  <td style={{ fontSize: 11.5, fontFamily: "monospace", color: "var(--sc-sub)" }}>{quarantine.ticket_number}</td>
                  <td style={{ fontSize: 12.5, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {quarantine.vendor_name_raw || "-"}
                  </td>
                  <td style={{ fontSize: 11.5, color: "var(--sc-muted)", fontFamily: "monospace" }}>{quarantine.fiscal_invoice_id?.slice(-8) || "-"}</td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: quarantine.total_lines > 0 ? "var(--sc-warn)" : "var(--sc-muted)" }}>{quarantine.total_lines || 0}</td>
                  <td>
                    <span className={`sp ${ageCls(scHrs(quarantine.created_at))}`}>{scAge(quarantine.created_at)}</span>
                  </td>
                  <td>-</td>
                  <td>
                    <span className={`sp ${quarantine.status === "CLOSED" ? "sp-g" : "sp-o"}`}>{quarantine.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {sel && <SCQuarDetail q={sel} onClose={() => { setSel(null); if (onReload) onReload(); }} />}
    </div>
  );
}
