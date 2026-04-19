import { useState } from "react";
import { SCIcon } from "./SCIcon";

export function SCQuarPriceLineCard({ line, onClose, onResolved, deps }) {
  const { SB, scAmt } = deps;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const devPct = line.deviation_pct != null ? +line.deviation_pct : null;
  const devColor = devPct == null ? "var(--sc-muted)" : Math.abs(devPct) > 20 ? "var(--sc-neg)" : "var(--sc-warn)";

  const resolve = async (action) => {
    setBusy(true);
    setErr("");
    try {
      const { error } = await SB.from("quarantine_lines").update({
        status: "APPROVED_UPDATE",
        resolution_note: action,
        resolved_at: new Date().toISOString(),
      }).eq("id", line.id);
      if (error) throw error;
      setDone(true);
      setTimeout(() => onResolved(action), 600);
    } catch (e) {
      setErr(e.message || "Error");
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: "14px 16px", background: "var(--sc-pos-bg)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
        <SCIcon n="check" s={16} c="var(--sc-pos)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sc-pos)" }}>Line resolved.</span>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--sc-card)", border: "1px solid var(--sc-border)", borderRadius: 12, padding: "18px 20px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--sc-ink)" }}>{line.product_name_raw || "Unknown Item"}</div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><SCIcon n="x" s={14} c="var(--sc-muted)" /></button>
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 18 }}>
        {[
          { l: "Baseline Price", v: line.baseline_price != null ? scAmt(line.baseline_price) : "-", c: "var(--sc-ink)" },
          { l: "Invoiced Price", v: line.unit_price != null ? scAmt(line.unit_price) : "-", c: "var(--sc-neg)" },
          { l: "Deviation", v: devPct != null ? `${devPct > 0 ? "+" : ""}${devPct.toFixed(1)}%` : "-", c: devColor },
          { l: "Qty", v: line.quantity || "-", c: "var(--sc-ink)" },
          { l: "UOM", v: line.uom || "-", c: "var(--sc-ink)" },
        ].map((x, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>{x.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: x.c, marginTop: 4, letterSpacing: "-.02em" }}>{x.v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="sc-btn sc-btn-g" disabled={busy} onClick={() => resolve("ACCEPT_ONE_TIME")}>Accept One-Time</button>
        <button className="sc-btn sc-btn-p" disabled={busy} onClick={() => resolve("UPDATE_BASELINE")}>Update Baseline</button>
        <button className="sc-btn sc-btn-d" disabled={busy} onClick={() => resolve("REJECT_LINE")}>Reject Line</button>
      </div>
      {err && <div style={{ marginTop: 8, fontSize: 12, color: "var(--sc-neg)" }}>{err}</div>}
      <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(196,29,29,.05)", border: "1px solid rgba(196,29,29,.12)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
        <SCIcon n="lock" s={12} c="var(--sc-neg)" />
        <span style={{ fontSize: 11.5, color: "var(--sc-neg)", fontWeight: 500 }}>Invoice allocation locked until all lines resolved.</span>
      </div>
    </div>
  );
}
