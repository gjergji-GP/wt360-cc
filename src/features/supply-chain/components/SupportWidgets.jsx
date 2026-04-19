import { ageCls, scAge, scAmt, scHrs, trigLbl, trigTag } from "../helpers";
import { SCIcon } from "./SCIcon";

export function SCKpi({ label, val, sub, icon, numCls = "", alertCls = "", onClick }) {
  return (
    <button className={`sc-kpi ${alertCls}`} onClick={onClick}>
      <div className="sc-kpi-top"><span className="sc-kpi-l">{label}</span><SCIcon n={icon} s={14} c="var(--sc-muted)" /></div>
      <div className={`sc-kpi-v ${numCls}`}>{val}</div>
      <div className="sc-kpi-s">{sub}</div>
    </button>
  );
}

export function SPH({ title, sub, right }) {
  return (
    <div className="sc-ph">
      <div><div className="sc-pt">{title}</div>{sub && <div className="sc-ps">{sub}</div>}</div>
      {right && <div>{right}</div>}
    </div>
  );
}

export function SCEmpty({ icon = "check", msg = "Nothing here", sub, color = "var(--sc-pos)" }) {
  return (
    <div className="sc-empty">
      <SCIcon n={icon} s={28} c={color} />
      <div style={{ marginTop: 10, fontWeight: 600, color, fontSize: 13 }}>{msg}</div>
      {sub && <div style={{ marginTop: 4, fontSize: 12 }}>{sub}</div>}
    </div>
  );
}

export function SCPipeline({ d }) {
  const stages = [
    { l: "Unclassified", v: d.unclassified, c: d.unclassified > 0 ? "var(--sc-warn)" : "var(--sc-muted)" },
    { l: "Awaiting SC", v: d.awaitSC, c: d.awaitSC > 0 ? "var(--sc-acc)" : "var(--sc-muted)" },
    { l: "In Quarantine", v: d.inQuar, c: d.inQuar > 0 ? "var(--sc-neg)" : "var(--sc-muted)" },
    { l: "Verified", v: d.verified, c: d.verified > 0 ? "var(--sc-pos)" : "var(--sc-muted)" },
    { l: "Allocated", v: d.allocated, c: d.allocated > 0 ? "var(--sc-violet)" : "var(--sc-muted)" },
    { l: "Awaiting Recv", v: d.awaitRecv, c: d.awaitRecv > 0 ? "var(--sc-teal)" : "var(--sc-muted)" },
    { l: "Received", v: d.received, c: d.received > 0 ? "var(--sc-pos)" : "var(--sc-muted)" },
  ];
  return (
    <div className="sc-panel">
      <SPH title="Pipeline Flow Health" sub="Invoice -> Verification -> Quarantine -> Allocation -> Receiving" right={d.oldestHrs != null && <div style={{ textAlign: "right" }}><div style={{ fontSize: 10.5, color: "var(--sc-muted)" }}>Oldest active item</div><div style={{ fontSize: 14, fontWeight: 800, color: d.oldestHrs > 48 ? "var(--sc-neg)" : "var(--sc-warn)" }}>{scAge(d.oldest)}</div></div>} />
      <div className="sc-pb">
        <div className="sc-flow">
          {stages.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
              <div className="sc-flow-stage"><div className="sc-flow-n" style={{ color: s.c }}>{s.v}</div><div className="sc-flow-l">{s.l}</div></div>
              {i < stages.length - 1 && <div className="sc-flow-sep">›</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--sc-divider)", display: "flex", gap: 28 }}>
          <div><span style={{ fontSize: 11, color: "var(--sc-muted)" }}>Throughput this period </span><span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--sc-ink)" }}>{d.throughput}</span></div>
          <div><span style={{ fontSize: 11, color: "var(--sc-muted)" }}>Avg allocation time </span><span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--sc-ink)" }}>{d.avgH ?? "-" }{d.avgH != null ? "h" : ""}</span></div>
        </div>
      </div>
    </div>
  );
}

export function SCQuarPressure({ quarantines = [], onOpen }) {
  const open = quarantines.filter((q) => q.status === "OPEN");
  const byType = {};
  open.forEach((q) => { byType[q.quarantine_reason] = (byType[q.quarantine_reason] || 0) + 1; });
  const totalLines = open.reduce((s, q) => s + (q.total_lines || 0), 0);
  const oldest = open.reduce((a, b) => (!a || new Date(b.created_at) < new Date(a.created_at) ? b : a), null);
  const types = [{ t: "UNKNOWN_SKU", cls: "st-unk" }, { t: "PRICE_DEVIATION", cls: "st-price" }, { t: "UOM_MISMATCH", cls: "st-uom" }, { t: "VENDOR_MISMATCH", cls: "st-vendor" }];
  return (
    <div className="sc-panel">
      <SPH title="Quarantine Pressure" sub="Exception isolation - allocation blocked until resolved" right={<button className="sc-btn sc-btn-g sc-btn-sm" onClick={onOpen}>Workbench <SCIcon n="arr" s={11} /></button>} />
      {open.length === 0 ? <SCEmpty msg="No open quarantines" sub="Pipeline is clean" color="var(--sc-pos)" /> : <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "18px 24px", borderBottom: "1px solid var(--sc-divider)" }}>
          {types.map(({ t, cls }) => (
            <div key={t} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--sc-bg)", borderRadius: 10, padding: "12px 16px" }}>
              <span className={`sc-tag ${cls}`}>{trigLbl(t)}</span>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.03em", color: byType[t] > 0 ? "var(--sc-neg)" : "var(--sc-muted)" }}>{byType[t] || 0}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "14px 24px", borderBottom: "1px solid var(--sc-divider)" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sc-sub)" }}>Open Tickets: <strong style={{ color: "var(--sc-neg)" }}>{open.length}</strong></div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sc-sub)" }}>Blocked Lines: <strong style={{ color: "var(--sc-warn)" }}>{totalLines}</strong></div>
          {oldest && <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--sc-muted)" }}>Oldest: <strong style={{ color: scHrs(oldest.created_at) > 24 ? "var(--sc-neg)" : "var(--sc-warn)" }}>{scAge(oldest.created_at)}</strong></span>}
        </div>
        <div>{open.slice(0, 4).map((q) => (
          <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 24px", borderBottom: "1px solid var(--sc-divider)", cursor: "pointer", transition: "background .08s" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(15,17,23,.025)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
            <span className={`sc-tag ${trigTag(q.quarantine_reason)}`}>{trigLbl(q.quarantine_reason)}</span>
            <span style={{ fontSize: 12.5, color: "var(--sc-sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.vendor_name_raw || q.ticket_number || "-"}</span>
            <span style={{ fontSize: 11, color: "var(--sc-muted)", flexShrink: 0 }}>{scAge(q.created_at)}</span>
          </div>
        ))}</div>
      </div>}
    </div>
  );
}

export function SCAllocOverview({ procTasks = [], onOpen }) {
  return (
    <div className="sc-panel">
      <SPH title="Allocation to Locations" sub="Verified quantities distributed - downstream handoff status" right={<button className="sc-btn sc-btn-g sc-btn-sm" onClick={onOpen}>View All <SCIcon n="arr" s={11} /></button>} />
      {procTasks.length === 0 ? <SCEmpty icon="layers" msg="No allocations in period" color="var(--sc-muted)" /> : <div style={{ overflowX: "auto" }}>
        <table className="sc-tbl">
          <thead><tr><th>Vendor</th><th>Invoice</th><th>Location</th><th>Status</th><th>Age</th></tr></thead>
          <tbody>{procTasks.slice(0, 5).map((t) => (
            <tr key={t.id}>
              <td style={{ fontWeight: 600 }}>{t.vendor_name || "-"}</td>
              <td style={{ fontSize: 11.5, color: "var(--sc-muted)", fontFamily: "monospace" }}>{t.fiscal_invoice_id?.slice(-8) || "-"}</td>
              <td style={{ fontSize: 12.5, color: "var(--sc-sub)" }}>{t.location_name || t.location_id?.slice(-6) || "-"}</td>
              <td><span className={`sp ${t.status === "READY_FOR_FINANCE" ? "sp-g" : t.status === "OPEN" ? "sp-o" : "sp-x"}`}>{t.status?.replace(/_/g, " ")}</span></td>
              <td><span className={`sp ${ageCls(scHrs(t.created_at))}`}>{scAge(t.created_at)}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>}
    </div>
  );
}

export function SCRecvFollowUp({ receiveTasks = [], onOpen }) {
  return (
    <div className="sc-panel">
      <SPH title="Receiving Follow-Up" sub="Downstream physical truth - SC monitors, locations own" right={<button className="sc-btn sc-btn-g sc-btn-sm" onClick={onOpen}>View All <SCIcon n="arr" s={11} /></button>} />
      {receiveTasks.length === 0 ? <SCEmpty icon="check" msg="All deliveries confirmed" color="var(--sc-pos)" /> : <div style={{ overflowX: "auto" }}>
        <table className="sc-tbl">
          <thead><tr><th>Location</th><th>Vendor</th><th>Invoice</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>{receiveTasks.slice(0, 5).map((t) => {
            const od = t.due_at && new Date(t.due_at) < new Date();
            return <tr key={t.id}>
              <td style={{ fontWeight: 600 }}>{t.location_name || "-"}</td>
              <td style={{ fontSize: 12.5, color: "var(--sc-sub)" }}>{t.vendor_name || "-"}</td>
              <td style={{ fontSize: 11.5, color: "var(--sc-muted)", fontFamily: "monospace" }}>{t.entity_id?.slice(-8) || "-"}</td>
              <td style={{ fontSize: 12, color: od ? "var(--sc-neg)" : "var(--sc-sub)" }}>{t.due_at ? new Date(t.due_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
              <td>{od ? <span className="sp sp-r">OVERDUE</span> : <span className="sp sp-o">OPEN</span>}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </div>
  );
}

export function SCMasterData({ vpm = [] }) {
  const provisional = vpm.filter((v) => v.is_provisional);
  const recent30 = vpm.filter((v) => (Date.now() - new Date(v.mapped_at || v.created_at)) / 86400000 < 30);
  return (
    <div className="sc-panel">
      <SPH title="Master Data Health" sub="MPR registry integrity - foundational to pipeline reliability" />
      <div className="sc-pb">
        <div className="sc-g3">
          {[{ l: "Total Mappings", v: vpm.length, s: "vendor -> SKU pairs", c: "var(--sc-acc)" }, { l: "Provisional Baselines", v: provisional.length, s: "unconfirmed prices", c: provisional.length > 0 ? "var(--sc-warn)" : "var(--sc-pos)" }, { l: "New This Month", v: recent30.length, s: "mappings created", c: "var(--sc-pos)" }].map((x, i) => (
            <div key={i} style={{ background: "var(--sc-bg)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: x.c, letterSpacing: "-.03em" }}>{x.v}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sc-ink)", marginTop: 4 }}>{x.l}</div>
              <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 2 }}>{x.s}</div>
            </div>
          ))}
        </div>
        {provisional.length > 0 && (
          <div style={{ marginTop: 16, padding: "11px 14px", background: "rgba(180,83,9,.06)", borderRadius: 10, border: "1px solid rgba(180,83,9,.14)", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <SCIcon n="alert" s={15} c="var(--sc-warn)" />
            <span style={{ fontSize: 12, color: "var(--sc-warn)", fontWeight: 500, lineHeight: 1.5 }}>{provisional.length} mapping{provisional.length > 1 ? "s" : ""} with unconfirmed baseline prices.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SCWastePanel({ waste = [] }) {
  const total = waste.reduce((s, w) => s + (+(w.total_cost) || 0), 0);
  const byLoc = {};
  waste.forEach((w) => { const k = w.location_id || "u"; if (!byLoc[k]) byLoc[k] = { name: w.location_name || "Unknown", v: 0, n: 0 }; byLoc[k].v += +(w.total_cost) || 0; byLoc[k].n += 1; });
  const rows = Object.values(byLoc).sort((a, b) => b.v - a.v);
  return (
    <div className="sc-panel">
      <SPH title="Waste Value This Period" sub="Operational COGS loss - by location" right={<div style={{ fontSize: 22, fontWeight: 800, color: total > 0 ? "var(--sc-neg)" : "var(--sc-pos)", letterSpacing: "-.03em" }}>{scAmt(total)}</div>} />
      <div className="sc-pb">
        {rows.length === 0 ? <div style={{ textAlign: "center", color: "var(--sc-muted)", fontSize: 12, padding: "12px 0" }}>No waste declared this period</div> : rows.map((r, i) => (
          <div key={i} style={{ marginBottom: i < rows.length - 1 ? 14 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sc-ink)" }}>{r.name}</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--sc-neg)" }}>{scAmt(r.v)}</span>
                <span style={{ fontSize: 10.5, color: "var(--sc-muted)", marginLeft: 8 }}>{r.n} entr{r.n === 1 ? "y" : "ies"}</span>
              </div>
            </div>
            <div className="sc-wbar-bg"><div className="sc-wbar-fill" style={{ width: `${total > 0 ? (r.v / total) * 100 : 0}%`, background: "var(--sc-neg)" }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
