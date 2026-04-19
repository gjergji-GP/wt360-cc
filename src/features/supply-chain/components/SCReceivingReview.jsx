import { useEffect, useState } from "react";
import { SCIcon } from "./SCIcon";

export function SCReceivingReview({ task, readOnly = false, onClose, onResolved, deps }) {
  const { SB } = deps;
  const [ticket, setTicket] = useState(null);
  const [lines, setLines] = useState([]);
  const [discrepancies, setDisc] = useState([]);
  const [locations, setLocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [xferLocId, setXferLoc] = useState("");
  const [xferQty, setXferQty] = useState("");
  const [resolutions, setRes] = useState({});

  useEffect(() => {
    const go = async () => {
      const [{ data: rt }, { data: rl }, { data: dd }, { data: locs }] = await Promise.all([
        SB.from("receiving_tickets").select("*,fiscal_invoices(vendor_name_raw),locations(name)").eq("id", task.entity_id).maybeSingle(),
        SB.from("receiving_lines").select("*").eq("ticket_id", task.entity_id),
        SB.from("delivery_discrepancies").select("*").eq("receiving_ticket_id", task.entity_id),
        SB.from("locations").select("id,name"),
      ]);
      setTicket(rt);
      setLines(rl || []);
      setDisc(dd || []);
      setLocs(locs || []);
      setLoading(false);
    };
    go();
  }, [SB, task.entity_id]);

  const setDiscRes = (id, v) => setRes((p) => ({ ...p, [id]: v }));

  const resolveAll = async () => {
    for (const d of discrepancies) {
      if (d.status === "RESOLVED") continue;
      if (!resolutions[d.id]) return setErr("Select a resolution action for each discrepancy.");
      if (resolutions[d.id] === "INTERNAL_TRANSFER" && (!xferLocId || !xferQty)) {
        return setErr("Internal transfer requires a destination location and quantity.");
      }
    }
    setBusy(true);
    setErr("");

    for (const d of discrepancies) {
      if (d.status === "RESOLVED") continue;
      const res = resolutions[d.id];
      const { data, error } = await SB.rpc("resolve_discrepancy", {
        p_discrepancy_id: d.id,
        p_resolution_type: res,
        p_note: note || null,
        p_transfer_to_location_id: res === "INTERNAL_TRANSFER" ? xferLocId : null,
        p_transfer_qty: res === "INTERNAL_TRANSFER" ? Number(xferQty) : null,
      });
      if (error || !data?.ok) {
        setErr(error?.message || data?.error || "Resolution failed.");
        setBusy(false);
        return;
      }
    }

    await SB.from("receiving_tickets").update({ status: "CONFIRMED" }).eq("id", task.entity_id);
    if (task.id) {
      await SB.from("tasks").update({ status: "DONE", updated_at: new Date().toISOString() }).eq("id", task.id);
    }
    setBusy(false);
    onResolved();
  };

  const RESOLUTION_OPTIONS = [
    { v: "INTERNAL_TRANSFER", l: "Internal Transfer", desc: "Stock physically belongs to another location. Transfer it now.", color: "#1d4ed8" },
    { v: "ALLOCATION_ERROR", l: "Allocation Error", desc: "SC plan was wrong. This location should have received all the stock.", color: "#15803d" },
    { v: "SUPPLIER_DELIVERY_VARIANCE", l: "Supplier Variance", desc: "Supplier delivered differently than invoiced. No stock movement needed.", color: "#b45309" },
    { v: "COUNTING_ERROR_CORRECTION", l: "RM Counting Error", desc: "RM miscounted. Stock will be corrected via adjustment entry.", color: "#7c3aed" },
    { v: "ACCEPTED_OVERDELIVERY", l: "Accepted Over-delivery", desc: "Absorb the extra stock at this location. No transfer or adjustment.", color: "#15803d" },
    { v: "CREDIT_NOTE_RAISED", l: "Credit Note Raised", desc: "Shortage acknowledged. A credit note will be requested from the vendor.", color: "#b45309" },
    { v: "REDELIVERY_EXPECTED", l: "Redelivery Expected", desc: "Vendor will re-deliver the missing units. Discrepancy stays visible until fulfilled.", color: "#1d4ed8" },
  ];

  const vendor = ticket?.fiscal_invoices?.vendor_name_raw || "-";
  const location = ticket?.locations?.name || "-";
  const openDiscs = discrepancies.filter((d) => d.status !== "RESOLVED");

  const DISC_TYPE_LABELS = {
    OVER_RECEIPT: "Over-delivery",
    SHORTAGE: "Shortage",
    QUALITY_ISSUE: "Quality Issue",
    CROSS_LOCATION_BREAK: "Cross-Location Break",
  };
  const DISC_TYPE_COLORS = {
    OVER_RECEIPT: "#15803d",
    SHORTAGE: "#b91c1c",
    QUALITY_ISSUE: "#b45309",
    CROSS_LOCATION_BREAK: "#7c3aed",
  };

  if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "var(--sc-card)", borderRadius: 12, padding: "28px 36px", fontSize: 13, color: "var(--sc-sub)" }}>Loading receipt...</div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "28px 20px", overflowY: "auto" }}>
      <div style={{ background: "var(--sc-card)", borderRadius: 16, width: "100%", maxWidth: 780, boxShadow: "0 32px 80px rgba(0,0,0,.25)", marginBottom: 32, flexShrink: 0 }}>
        <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid var(--sc-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>
                {readOnly ? "Receipt" : "SC Discrepancy Review"} | {location}
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "var(--sc-ink)" }}>{vendor}</div>
              <div style={{ fontSize: 12, color: "var(--sc-muted)", marginTop: 2 }}>
                {ticket?.received_at ? new Date(ticket.received_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                {" | "}{lines.length} line{lines.length !== 1 ? "s" : ""}
                {" | "}<span style={{ fontFamily: "monospace", fontSize: 11 }}>{ticket?.id?.slice(-8)}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--sc-muted)" }}>x</button>
          </div>
          {ticket?.status && (
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: ticket.status === "CONFIRMED" ? "rgba(21,128,61,.1)" : ticket.status === "DISPUTED" ? "rgba(185,28,28,.1)" : "rgba(180,83,9,.1)", color: ticket.status === "CONFIRMED" ? "#15803d" : ticket.status === "DISPUTED" ? "#b91c1c" : "#b45309" }}>
                {ticket.status}
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 28px 0" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Received Lines</div>
          <div style={{ border: "1px solid var(--sc-border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--sc-bg)" }}>
                  {["Product", "UOM", "Allocated", "Received", "Variance", "Condition"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em", borderBottom: "1px solid var(--sc-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const v = Number(l.variance_qty) || 0;
                  const condColor = l.condition_state === "ACCEPTED" ? "#15803d" : l.condition_state === "REJECTED" ? "#b91c1c" : "#b45309";
                  return (
                    <tr key={l.id} style={{ borderTop: i > 0 ? "1px solid var(--sc-divider)" : "none", background: v !== 0 ? "rgba(253,230,138,.05)" : "transparent" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sc-ink)" }}>{l.group_name_snap || l.sku_name_raw || "-"}</div>
                        {l.lot_number && <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--sc-muted)" }}>Lot {l.lot_number}{l.expiry_date ? ` | ${l.expiry_date}` : ""}</div>}
                        {l.line_note && <div style={{ fontSize: 11, color: "#b45309", marginTop: 1 }}>Note: {l.line_note}</div>}
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--sc-sub)" }}>{l.uom || "-"}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", color: "var(--sc-muted)" }}>{l.expected_qty}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--sc-ink)" }}>{l.received_qty}</td>
                      <td style={{ padding: "10px 12px" }}>
                        {v === 0 ? <span style={{ color: "var(--sc-muted)", fontSize: 12 }}>-</span> : (
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: v > 0 ? "#15803d" : "#b91c1c" }}>{v > 0 ? "+" : ""}{v}</div>
                            <div style={{ fontSize: 10, color: "var(--sc-muted)" }}>{l.variance_pct}%</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: v > 0 ? "#15803d" : "#b91c1c", textTransform: "uppercase", letterSpacing: ".04em" }}>{v > 0 ? "OVER" : "SHORT"}</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: l.condition_state === "ACCEPTED" ? "rgba(21,128,61,.08)" : l.condition_state === "REJECTED" ? "rgba(185,28,28,.08)" : "rgba(180,83,9,.08)", color: condColor }}>
                          {(l.condition_state || "-").replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {openDiscs.length > 0 && !readOnly && (
          <div style={{ padding: "0 28px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>
              Discrepancies Requiring Resolution ({openDiscs.length})
            </div>
            {openDiscs.map((d) => {
              const dColor = DISC_TYPE_COLORS[d.discrepancy_type] || "#b45309";
              const crossLocs = d.cross_location_data || [];
              const relevantOptions = d.discrepancy_type === "SHORTAGE" || d.discrepancy_type === "QUALITY_ISSUE"
                ? RESOLUTION_OPTIONS.filter((o) => ["CREDIT_NOTE_RAISED", "REDELIVERY_EXPECTED", "SUPPLIER_DELIVERY_VARIANCE", "COUNTING_ERROR_CORRECTION"].includes(o.v))
                : RESOLUTION_OPTIONS.filter((o) => ["INTERNAL_TRANSFER", "ALLOCATION_ERROR", "SUPPLIER_DELIVERY_VARIANCE", "ACCEPTED_OVERDELIVERY", "COUNTING_ERROR_CORRECTION"].includes(o.v));
              const sel = resolutions[d.id];
              return (
                <div key={d.id} style={{ border: `1.5px solid ${sel ? "#1d4ed8" : "var(--sc-border)"}`, borderRadius: 12, marginBottom: 14, overflow: "hidden", transition: "border .15s" }}>
                  <div style={{ padding: "12px 16px", background: "var(--sc-bg)", borderBottom: "1px solid var(--sc-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${dColor}15`, color: dColor, textTransform: "uppercase", letterSpacing: ".04em" }}>
                        {DISC_TYPE_LABELS[d.discrepancy_type] || d.discrepancy_type}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-ink)" }}>{d.group_name || "-"}</span>
                      {d.sku_code && <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--sc-muted)", background: "var(--sc-card)", padding: "2px 6px", borderRadius: 4 }}>{d.sku_code}</span>}
                    </div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: Number(d.variance_qty) > 0 ? "#15803d" : "#b91c1c", fontWeight: 700 }}>
                      {Number(d.variance_qty) > 0 ? "+" : ""}{d.variance_qty} ({d.variance_pct}%)
                    </div>
                  </div>

                  {crossLocs.length > 0 && (
                    <div style={{ padding: "10px 16px", background: "rgba(124,58,237,.04)", borderBottom: "1px solid rgba(124,58,237,.12)" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                        Cross-Location Impact
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, padding: "6px 10px", background: "rgba(124,58,237,.08)", borderRadius: 7, minWidth: 140 }}>
                          <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, marginBottom: 2 }}>THIS LOCATION</div>
                          <div style={{ fontWeight: 600, color: "var(--sc-ink)" }}>{ticket?.locations?.name}</div>
                          <div style={{ fontFamily: "monospace", color: "var(--sc-muted)" }}>Allocated: {d.allocated_qty} | Received: {d.received_qty}</div>
                        </div>
                        {crossLocs.map((cl, i) => (
                          <div key={i} style={{ fontSize: 12, padding: "6px 10px", background: cl.status === "PENDING" ? "rgba(185,28,28,.06)" : "rgba(21,128,61,.06)", borderRadius: 7, border: `1px solid ${cl.status === "PENDING" ? "rgba(185,28,28,.2)" : "rgba(21,128,61,.2)"}`, minWidth: 140 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: cl.status === "PENDING" ? "#b91c1c" : "#15803d", marginBottom: 2 }}>
                              {cl.location_name?.toUpperCase()} | {cl.status}
                            </div>
                            <div style={{ fontFamily: "monospace", color: "var(--sc-muted)" }}>Allocated: {cl.allocated_qty}</div>
                            <div style={{ fontSize: 11, color: cl.status === "PENDING" ? "#b91c1c" : "var(--sc-muted)", fontWeight: cl.status === "PENDING" ? 600 : 400 }}>
                              {cl.status === "PENDING" ? "Not yet received" : "Received"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
                      Choose Resolution Action
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {relevantOptions.map((o) => (
                        <label key={o.v} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${sel === o.v ? o.color : "var(--sc-border)"}`, background: sel === o.v ? `${o.color}08` : "transparent", transition: "all .1s" }}>
                          <input type="radio" name={`res-${d.id}`} value={o.v} checked={sel === o.v} onChange={() => setDiscRes(d.id, o.v)} style={{ marginTop: 2, accentColor: o.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: sel === o.v ? o.color : "var(--sc-ink)" }}>{o.l}</div>
                            <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 1 }}>{o.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {sel === "INTERNAL_TRANSFER" && (
                      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, padding: "12px", background: "rgba(29,78,216,.05)", borderRadius: 8, border: "1px solid rgba(29,78,216,.15)" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Transfer To Location</div>
                          <select value={xferLocId} onChange={(e) => setXferLoc(e.target.value)} style={{ width: "100%", padding: "7px 9px", border: "1px solid rgba(29,78,216,.3)", borderRadius: 7, fontSize: 12, background: "var(--sc-card)", color: "var(--sc-ink)", outline: "none" }}>
                            <option value="">Select location...</option>
                            {locations.filter((l) => l.id !== ticket?.location_id).map((l) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Qty to Transfer</div>
                          <input type="number" min="0.01" step="any" value={xferQty} onChange={(e) => setXferQty(e.target.value)} placeholder="qty" style={{ width: "100%", padding: "7px 9px", border: "1px solid rgba(29,78,216,.3)", borderRadius: 7, fontSize: 13, fontWeight: 700, textAlign: "right", background: "var(--sc-card)", color: "var(--sc-ink)", outline: "none" }} />
                        </div>
                        <div style={{ gridColumn: "1/-1", fontSize: 11, color: "#1d4ed8", lineHeight: 1.5 }}>
                          This will post OUT {xferQty || "?"} from {ticket?.locations?.name} and IN {xferQty || "?"} to the selected location in the stock ledger.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {discrepancies.filter((d) => d.status === "RESOLVED").map((d) => (
          <div key={d.id} style={{ margin: "0 28px 10px", padding: "10px 14px", background: "rgba(21,128,61,.05)", borderRadius: 9, border: "1px solid rgba(21,128,61,.15)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>Resolved</span>
            <span style={{ fontSize: 12, color: "var(--sc-sub)", marginLeft: 10 }}>{d.group_name} | {d.resolution_type?.replace(/_/g, " ")}</span>
            {d.resolution_note && <span style={{ fontSize: 11, color: "var(--sc-muted)", marginLeft: 8 }}>"{d.resolution_note}"</span>}
          </div>
        ))}

        <div style={{ padding: "14px 28px 22px" }}>
          {!readOnly && openDiscs.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>SC Note (optional)</div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Document your decision or any follow-up actions required..." style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--sc-border)", borderRadius: 7, fontSize: 12, resize: "vertical", background: "var(--sc-card)", color: "var(--sc-ink)", marginBottom: 12, outline: "none", boxSizing: "border-box" }} />
              {err && <div style={{ padding: "8px 12px", background: "rgba(185,28,28,.06)", borderRadius: 7, fontSize: 12, color: "#b91c1c", marginBottom: 12 }}>{err}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={resolveAll} disabled={busy} style={{ flex: 1, padding: "12px", background: "#15803d", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                  {busy ? "Processing..." : "Confirm Resolution & Close"}
                </button>
                <button onClick={onClose} style={{ padding: "12px 18px", background: "var(--sc-bg)", color: "var(--sc-sub)", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 8, textAlign: "center" }}>
                Resolving will close this review task and confirm the receiving ticket.
              </div>
            </>
          )}
          {(readOnly || openDiscs.length === 0) && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "var(--sc-sub)" }}>
                Status: <strong style={{ color: ticket?.status === "CONFIRMED" ? "#15803d" : ticket?.status === "DISPUTED" ? "#b91c1c" : "#b45309" }}>{ticket?.status || "SUBMITTED"}</strong>
              </div>
              <button onClick={onClose} style={{ padding: "10px 24px", background: "var(--sc-bg)", color: "var(--sc-sub)", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
