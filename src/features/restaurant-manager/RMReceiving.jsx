import { useEffect, useState } from "react";
import { SB } from "../../lib/supabase";

function RMReceiveTicket({ session, task, onBack, onDone }) {
  const [lines, setLines] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const go = async () => {
      const { data: allocations, error } = await SB
        .from("sc_delivery_allocations")
        .select("id,item_name,allocated_qty,uom,master_product_id,master_products(sku_code,requires_lot_tracking,product_groups(group_name))")
        .eq("fiscal_invoice_id", task.entity_id)
        .eq("location_id", session.home_location_id)
        .neq("status", "RECEIVED");

      if (error) {
        setErr(error.message);
        setLines([]);
        return;
      }

      setLines((allocations || []).map((allocation) => ({
        id: allocation.id,
        pid: allocation.master_product_id,
        name: allocation.master_products?.product_groups?.group_name || allocation.master_products?.sku_code || allocation.item_name || "â€”",
        uom: allocation.uom || "",
        traceable: allocation.master_products?.requires_lot_tracking || false,
        alloc_qty: allocation.allocated_qty,
        qty: "",
        condition: "ACCEPTED",
        lot: "",
        expiry: "",
        note: "",
      })));
    };
    go();
  }, [session.home_location_id, task.entity_id]);

  const setLine = (id, key, value) => setLines((prev) => prev.map((line) => (line.id === id ? { ...line, [key]: value } : line)));

  const submit = async () => {
    if (!lines || lines.length === 0) return setErr("No lines to submit.");
    for (const line of lines) {
      if (line.qty === "" || line.qty === null) return setErr(`Enter quantity for: ${line.name}`);
      if (Number(line.qty) < 0) return setErr(`Quantity cannot be negative: ${line.name}`);
      if (["ACCEPTED_WITH_ISSUE", "REJECTED"].includes(line.condition) && !line.note.trim()) return setErr(`Note required for: ${line.name}`);
      if (line.traceable && !line.lot.trim()) return setErr(`Lot required for: ${line.name}`);
      if (line.traceable && !line.expiry) return setErr(`Expiry required for: ${line.name}`);
    }
    setBusy(true);
    setErr("");
    const { data, error } = await SB.rpc("submit_receiving_ticket", {
      p_task_id: task.id,
      p_fiscal_invoice_id: task.entity_id,
      p_location_id: session.home_location_id,
      p_brand_id: session.brand_id,
      p_notes: null,
      p_lines: lines.map((line) => ({
        master_product_id: line.pid,
        item_name: line.name,
        group_name: line.name,
        sku_code: "",
        received_qty: Number(line.qty),
        expected_qty: Number(line.alloc_qty),
        unit_price: 0,
        uom: line.uom,
        condition_state: line.condition,
        lot_number: line.lot || null,
        expiry_date: line.expiry || null,
        line_note: line.note || null,
      })),
    });
    setBusy(false);
    if (error || !data?.ok) return setErr(error?.message || data?.error || "Submission failed.");
    setSubmitted(true);
    setTimeout(() => onDone(), 1200);
  };

  const conditions = [
    { v: "ACCEPTED", l: "Accepted", c: "var(--wt-pos)", bg: "var(--wt-pos-bg)" },
    { v: "ACCEPTED_WITH_ISSUE", l: "With Issue", c: "var(--wt-warn)", bg: "var(--wt-warn-bg)" },
    { v: "REJECTED", l: "Rejected", c: "var(--wt-neg)", bg: "var(--wt-neg-bg)" },
  ];

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: "60px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>âœ“</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--wt-pos)" }}>Delivery Confirmed</div>
        <div style={{ fontSize: 13, color: "var(--wt-muted)", marginTop: 8 }}>Stock has been posted to {session.location_name}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: "7px 14px", background: "var(--wt-bg)", border: "1px solid var(--wt-border)", borderRadius: 7, fontSize: 13, cursor: "pointer", color: "var(--wt-muted)" }}>
          â† Back
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--wt-ink)" }}>Incoming Delivery</div>
          <div style={{ fontSize: 12, color: "var(--wt-muted)" }}>
            {session.location_name} Â· {new Date(task.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 14px", background: "var(--wt-warn-bg)", border: "1px solid #fde68a", borderRadius: 8, fontSize: 12, color: "var(--wt-warn)", marginBottom: 20 }}>
        Warning: submitting this receipt will post stock to {session.location_name}. Enter what physically arrived.
      </div>

      {lines === null ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--wt-muted)" }}>Loadingâ€¦</div>
      ) : lines.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--wt-muted)", fontSize: 13 }}>
          {err || "No pending lines for this delivery at your location."}
        </div>
      ) : (
        <div style={{ background: "var(--wt-surface)", border: "1px solid var(--wt-border)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
          {lines.map((line, index) => (
            <div key={line.id} style={{ padding: "18px 20px", borderBottom: index < lines.length - 1 ? "1px solid var(--divider)" : "none" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--wt-ink)" }}>{line.name}</span>
                {line.uom && <span style={{ fontSize: 11, color: "var(--wt-muted)", background: "var(--wt-bg)", padding: "2px 7px", borderRadius: 4 }}>{line.uom}</span>}
                {line.traceable && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-acc)", background: "var(--wt-acc-bg)", padding: "2px 7px", borderRadius: 4 }}>Traceable</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, marginBottom: line.traceable || ["ACCEPTED_WITH_ISSUE", "REJECTED"].includes(line.condition) ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Qty Received *</div>
                  <input type="number" min="0" step="any" value={line.qty} onChange={(event) => setLine(line.id, "qty", event.target.value)} placeholder="0" style={{ width: "100%", padding: "9px 10px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 16, fontWeight: 700, textAlign: "right", background: "var(--wt-surface)", color: "var(--wt-ink)", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Condition *</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {conditions.map((option) => (
                      <button key={option.v} onClick={() => setLine(line.id, "condition", option.v)} style={{ padding: "7px 12px", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 600, border: `1.5px solid ${line.condition === option.v ? option.c : "var(--border)"}`, background: line.condition === option.v ? option.bg : "var(--wt-surface)", color: line.condition === option.v ? option.c : "var(--muted)", transition: "all .1s" }}>
                        {option.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {line.traceable && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: ["ACCEPTED_WITH_ISSUE", "REJECTED"].includes(line.condition) ? 10 : 0 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Lot Number *</div>
                    <input type="text" value={line.lot} onChange={(event) => setLine(line.id, "lot", event.target.value)} placeholder="LOT-001" style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--wt-border)", borderRadius: 7, fontSize: 12, fontFamily: "monospace", background: "var(--wt-surface)", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Expiry Date *</div>
                    <input type="date" value={line.expiry} onChange={(event) => setLine(line.id, "expiry", event.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--wt-border)", borderRadius: 7, fontSize: 12, background: "var(--wt-surface)", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
              )}

              {["ACCEPTED_WITH_ISSUE", "REJECTED"].includes(line.condition) && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-neg)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Note (required)</div>
                  <textarea value={line.note} onChange={(event) => setLine(line.id, "note", event.target.value)} rows={2} placeholder="Describe the issue or rejectionâ€¦" style={{ width: "100%", padding: "7px 10px", border: "1px solid #f87171", borderRadius: 7, fontSize: 12, resize: "vertical", background: "var(--wt-surface)", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lines !== null && lines.length > 0 && (
        <>
          {err && <div style={{ padding: "10px 14px", background: "var(--wt-neg-bg)", borderRadius: 8, fontSize: 12, color: "var(--wt-neg)", marginBottom: 14, fontWeight: 500 }}>{err}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={submit} disabled={busy} className="rm-btn-p lg" style={{ flex: 1 }}>
              {busy ? "Submittingâ€¦" : "Confirm Receipt & Post Stock"}
            </button>
            <button onClick={onBack} className="rm-btn-sec">Cancel</button>
          </div>
          <div style={{ fontSize: 11, color: "var(--wt-muted)", marginTop: 10, textAlign: "center" }}>
            Once submitted, this receipt cannot be edited.
          </div>
        </>
      )}
    </div>
  );
}

export function RMReceiving({ session, receiveTasks, onReload, deps }) {
  const { Icon, RMStatusBadge, RMGrnModal } = deps;
  const [sel, setSel] = useState(null);
  const [showGrn, setShowGrn] = useState(false);
  const [now] = useState(() => Date.now());

  const open = receiveTasks.filter((task) => ["OPEN", "CLAIMED", "OVERDUE"].includes(task.status));
  const completed = receiveTasks.filter((task) => task.status === "DONE").slice(0, 10);

  const ago = (date) => {
    const minutes = Math.floor((now - new Date(date)) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return `${Math.floor(minutes / 1440)}d ago`;
  };

  if (sel) {
    return (
      <RMReceiveTicket
        session={session}
        task={sel}
        onBack={() => setSel(null)}
        onDone={() => {
          setSel(null);
          onReload();
        }}
      />
    );
  }

  return (
    <div>
      {showGrn && <RMGrnModal session={session} onClose={() => setShowGrn(false)} onDone={() => { setShowGrn(false); onReload(); }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--wt-ink)", marginBottom: 4 }}>Receiving</div>
          <div style={{ fontSize: 12, color: "var(--wt-muted)" }}>{session.location_name} Â· Confirm deliveries allocated by Supply Chain</div>
        </div>
        <button onClick={() => setShowGrn(true)} className="rm-btn-p" style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <Icon name="plus" size={13} color="#fff" /> GRN â€” Invoice Pending
        </button>
      </div>

      <div className="rm-sec">Pending Deliveries ({open.length})</div>

      {open.length === 0 ? (
        <div className="rm-card" style={{ color: "var(--wt-muted)", fontSize: 13 }}>No pending deliveries. All clear.</div>
      ) : open.map((task) => (
        <div key={task.id} className="rm-recv-card" onClick={() => setSel(task)}>
          <div>
            <div className="rm-recv-title">Incoming Delivery</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--wt-muted)" }}>â€¦{task.entity_id?.slice(-8)}</span>
              <span style={{ fontSize: 11, color: "var(--wt-warn)", fontWeight: 600 }}>{ago(task.created_at)}</span>
              <RMStatusBadge status={task.status} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--wt-muted)", fontWeight: 500, flexShrink: 0 }}>Open â†’</div>
        </div>
      ))}

      {completed.length > 0 && (
        <>
          <div className="rm-sec" style={{ marginTop: 24 }}>Recently Received</div>
          {completed.map((task) => (
            <div key={task.id} className="rm-recv-card done">
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wt-ink)" }}>Delivery Received</div>
                <div style={{ fontSize: 11, color: "var(--wt-muted)" }}>{new Date(task.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
              <RMStatusBadge status="DONE" />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

