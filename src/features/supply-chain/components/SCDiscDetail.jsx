import { useEffect, useState } from "react";

export function SCDiscDetail({ disc, locations = [], onClose, deps }) {
  const { SB, DISC_COLOR, DISC_TYPE_LABEL, RES_TYPE_LABEL, STATUS_COLOR } = deps;

  const [rt, setRt] = useState(null);
  const [lines, setLines] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      const [rtRes, linesRes, ledRes, actRes] = await Promise.all([
        disc.receiving_ticket_id
          ? SB.from("receiving_tickets").select("*,locations(name),employees!receiving_tickets_submitted_by_fkey(full_name)").eq("id", disc.receiving_ticket_id).maybeSingle()
          : Promise.resolve({ data: null }),
        disc.receiving_ticket_id ? SB.from("receiving_lines").select("*").eq("ticket_id", disc.receiving_ticket_id) : Promise.resolve({ data: [] }),
        SB.from("stock_ledger")
          .select("*,locations(name),employees!stock_ledger_created_by_fkey(full_name)")
          .eq("product_id", disc.master_product_id)
          .eq("location_id", disc.location_id)
          .order("created_at", { ascending: true })
          .limit(50),
        SB.from("discrepancy_actions").select("*,employees!discrepancy_actions_actor_id_fkey(full_name)").eq("discrepancy_id", disc.id).order("created_at", { ascending: true }),
      ]);
      if (cancelled) return;
      setRt(rtRes.data || null);
      setLines(linesRes.data || []);
      setLedger(ledRes.data || []);
      setActions(actRes.data || []);
      setLoading(false);
    };
    go();
    return () => {
      cancelled = true;
    };
  }, [SB, disc.id, disc.location_id, disc.master_product_id, disc.receiving_ticket_id]);

  const tc = DISC_COLOR[disc.discrepancy_type] || "#b45309";
  const sc = STATUS_COLOR[disc.status] || "#b45309";
  const variance = Number(disc.variance_qty) || 0;
  const lMap = Object.fromEntries(locations.map((l) => [String(l.id), l.name]));

  const summary = [
    ["Vendor", disc.vendor_name || "-"],
    ["Location", disc.location_name || "-"],
    ["Product", disc.group_name || "-"],
    ["SKU", disc.sku_code || "-"],
    ["Allocated", `${disc.allocated_qty ?? 0} units`],
    ["Received", `${disc.received_qty ?? 0} units`],
    ["Variance", `${variance > 0 ? "+" : ""}${variance}`],
    ["Resolution", RES_TYPE_LABEL[disc.resolution_type] || "Pending"],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.25)" }} />
      <div style={{ position: "relative", width: "min(680px,100vw)", height: "100vh", background: "var(--sc-card)", boxShadow: "-8px 0 48px rgba(0,0,0,.15)", overflowY: "auto", zIndex: 1 }}>
        <div style={{ padding: "24px 28px 20px", borderBottom: "1px solid var(--sc-border)", position: "sticky", top: 0, background: "var(--sc-card)", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${tc}15`, color: tc, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {DISC_TYPE_LABEL[disc.discrepancy_type] || disc.discrepancy_type}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 99, background: `${sc}15`, color: sc, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  {disc.status}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sc-ink)" }}>{disc.group_name || disc.vendor_name || "Discrepancy Case"}</div>
              <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 4 }}>
                Detected {new Date(disc.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
              <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--sc-muted)", marginTop: 3, opacity: 0.7 }}>{disc.id?.slice(-12)}</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--sc-muted)" }}>x</button>
          </div>
        </div>

        <div style={{ padding: "20px 28px 32px" }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--sc-muted)" }}>Loading case data...</div>
          ) : (
            <>
              <div style={{ marginTop: 4, padding: "16px", background: "var(--sc-bg)", borderRadius: 12, border: "1px solid var(--sc-border)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>Case Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                  {summary.map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: label === "Variance" ? (variance > 0 ? "#15803d" : variance < 0 ? "#b91c1c" : "var(--sc-ink)") : "var(--sc-ink)" }}>{value}</div>
                    </div>
                  ))}
                </div>
                {disc.resolution_note && (
                  <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--sc-card)", borderRadius: 8, fontSize: 12, color: "var(--sc-sub)", borderLeft: "3px solid var(--sc-border)" }}>
                    "{disc.resolution_note}"
                  </div>
                )}
              </div>

              {rt && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Receiving Truth</div>
                  <div style={{ padding: "14px 16px", background: "var(--sc-bg)", border: "1px solid var(--sc-border)", borderRadius: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--sc-sub)" }}>
                      Submitted by <strong>{rt.employees?.full_name || "-"}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 4 }}>
                      {rt.received_at ? new Date(rt.received_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "var(--sc-muted)" }}>{lines.length} line(s) captured</div>
                    {lines.length > 0 && (
                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        {lines.slice(0, 10).map((line) => (
                          <div key={line.id} style={{ padding: "10px 12px", background: "var(--sc-card)", border: "1px solid var(--sc-border)", borderRadius: 10 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sc-ink)" }}>{line.group_name_snap || line.sku_name_raw || "-"}</div>
                            <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 3 }}>
                              Expected {line.expected_qty ?? 0} | Received {line.received_qty ?? 0} | Variance {line.variance_qty ?? 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ledger.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Stock Ledger</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {ledger.slice(0, 12).map((entry) => (
                      <div key={entry.id} style={{ padding: "10px 12px", background: "var(--sc-bg)", border: "1px solid var(--sc-border)", borderRadius: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sc-ink)" }}>{entry.movement_type === "IN" ? "+" : "-"}{entry.quantity} units</div>
                        <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 3 }}>{entry.locations?.name || disc.location_name || "-"} | {entry.notes || "-"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {actions.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Action Timeline</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {actions.map((action) => (
                      <div key={action.id} style={{ padding: "10px 12px", background: "var(--sc-bg)", border: "1px solid var(--sc-border)", borderRadius: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sc-ink)" }}>{action.action_type?.replace(/_/g, " ") || "Action"}</div>
                            <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 3 }}>
                              {action.employees?.full_name || "System"}
                              {action.note ? ` | "${action.note}"` : ""}
                            </div>
                            {action.payload && (
                              <div style={{ marginTop: 6, fontSize: 10, color: "var(--sc-sub)" }}>
                                {Object.entries(action.payload)
                                  .filter(([key]) => !["in_ledger", "out_ledger", "transfer_id"].includes(key))
                                  .map(([key, val]) => {
                                    const display = ["from_location", "to_location", "transfer_to_location_id"].includes(key) ? (lMap[String(val)] || String(val)) : String(val);
                                    return `${key.replace(/_/g, " ")}: ${display}`;
                                  })
                                  .join(" | ")}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: "var(--sc-muted)", whiteSpace: "nowrap" }}>
                            {new Date(action.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <button onClick={() => setRawOpen((v) => !v)} style={{ border: "1px solid var(--sc-border)", background: "var(--sc-bg)", color: "var(--sc-ink)", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
                  {rawOpen ? "Hide" : "Show"} raw case data
                </button>
                {rawOpen && (
                  <pre style={{ marginTop: 10, padding: "12px", background: "#0f172a", color: "#e2e8f0", borderRadius: 12, overflow: "auto", fontSize: 11, lineHeight: 1.5 }}>
                    {JSON.stringify({ disc, rt, lines, ledger, actions }, null, 2)}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
