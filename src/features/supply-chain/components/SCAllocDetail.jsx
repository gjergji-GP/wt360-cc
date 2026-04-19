import { useEffect, useState } from "react";
import { SCIcon } from "./SCIcon";

function SCAllocPanel({ lines, fiId, taskId, procTaskId, brandId, onDone, deps }) {
  const { SB } = deps;
  const [locations, setLocations] = useState([]);
  const [locSearch, setLocSearch] = useState("");
  const [allocs, setAllocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    SB.from("locations").select("id,name").eq("brand_id", brandId).eq("is_active", true).then(({ data }) => setLocations(data || []));
  }, [SB, brandId]);

  const filteredLocs = locations
    .filter((l) => !locSearch || l.name.toLowerCase().includes(locSearch.toLowerCase()))
    .filter((l) => !allocs.find((a) => a.location_id === l.id));

  const addLocation = (loc) => {
    setAllocs((a) => [
      ...a,
      {
        location_id: loc.id,
        location_name: loc.name,
        items: lines.map((l) => ({
          line_id: l.id,
          item_name: l.group_name ? `${l.group_name}${l.sku_code ? ` (${l.sku_code})` : ""}` : l.item_name || l.vendor_item_name || "-",
          vendor_item_name: l.item_name || l.vendor_item_name || "-",
          uom: l.unit_of_measure || l.uom || "",
          qty_total: +(l.qty || 0),
          qty_alloc: "",
        })),
      },
    ]);
    setLocSearch("");
  };

  const removeLocation = (locId) => setAllocs((a) => a.filter((x) => x.location_id !== locId));

  const setQty = (locId, lineId, val) => {
    setAllocs((a) =>
      a.map((loc) =>
        loc.location_id !== locId
          ? loc
          : {
              ...loc,
              items: loc.items.map((it) => (it.line_id !== lineId ? it : { ...it, qty_alloc: val })),
            },
      ),
    );
  };

  const totals = lines.map((l) => {
    const allocated = allocs.reduce((s, a) => {
      const it = a.items.find((i) => i.line_id === l.id);
      return s + (+(it?.qty_alloc) || 0);
    }, 0);
    return { line_id: l.id, qty_total: +(l.qty || 0), allocated };
  });
  const overAllocated = totals.filter((x) => x.allocated > x.qty_total);
  const canSubmit = allocs.length > 0 && overAllocated.length === 0 && !busy && !done;

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const rows = allocs.flatMap((a) =>
        a.items
          .filter((it) => +(it.qty_alloc) > 0)
          .map((it) => ({
            procurement_task_id: procTaskId || null,
            fiscal_invoice_id: fiId,
            location_id: a.location_id,
            brand_id: brandId,
            ebills_line_id: it.line_id || null,
            item_name: it.item_name,
            allocated_qty: +(it.qty_alloc),
            uom: it.uom || null,
            status: "PENDING",
          })),
      );
      if (rows.length === 0) throw new Error("No quantities entered.");

      const lineQtyMap = {};
      lines.forEach((l) => {
        lineQtyMap[l.id] = +(l.qty || 0);
      });
      const lineAllocTotals = {};
      rows.forEach((r) => {
        const k = r.ebills_line_id;
        lineAllocTotals[k] = (lineAllocTotals[k] || 0) + +r.allocated_qty;
      });
      for (const [lineId, allocTotal] of Object.entries(lineAllocTotals)) {
        const invoiceQty = lineQtyMap[lineId];
        if (invoiceQty !== undefined && allocTotal > invoiceQty) {
          throw new Error(`Over-allocated: line qty is ${invoiceQty} but you entered ${allocTotal}. Reduce quantities before submitting.`);
        }
      }

      const { error: rpcErr } = await SB.rpc("confirm_sc_allocation", {
        p_procurement_task_id: procTaskId || null,
        p_task_id: taskId || null,
        p_rows: rows,
      });
      if (rpcErr) throw rpcErr;
      setDone(true);
      setTimeout(() => onDone(), 1200);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div style={{ marginTop: 16, padding: "14px 18px", background: "var(--sc-pos-bg)", borderRadius: 12, border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", gap: 10 }}>
        <SCIcon n="check" s={16} c="var(--sc-pos)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-pos)" }}>Allocation submitted successfully.</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: "18px", background: "var(--sc-bg)", borderRadius: 12, border: "1px solid var(--sc-border)" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--sc-ink)", marginBottom: 14 }}>Allocate to Locations</div>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          value={locSearch}
          onChange={(e) => setLocSearch(e.target.value)}
          placeholder="Search location..."
          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--sc-border)", background: "var(--sc-card)", fontSize: 13, color: "var(--sc-ink)", outline: "none" }}
        />
        {locSearch && filteredLocs.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--sc-card)", border: "1px solid var(--sc-border)", borderRadius: 8, marginTop: 4, zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}>
            {filteredLocs.map((l) => (
              <div
                key={l.id}
                onClick={() => addLocation(l)}
                style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, color: "var(--sc-ink)", fontWeight: 500 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--sc-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "";
                }}
              >
                {l.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {allocs.length === 0 && <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--sc-muted)" }}>Search and add a location to start allocating quantities.</div>}
      {allocs.map((a) => (
        <div key={a.location_id} style={{ marginBottom: 12, border: "1px solid var(--sc-border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "var(--sc-card)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--sc-divider)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-ink)" }}>{a.location_name}</span>
            <button onClick={() => removeLocation(a.location_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sc-muted)", padding: "2px 6px", fontSize: 18, lineHeight: 1 }}>x</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--sc-bg)" }}>
                {["Item", "UOM", "Invoice Qty", "Allocate Qty"].map((h) => (
                  <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--sc-divider)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {a.items.map((it) => {
                const tot = totals.find((x) => x.line_id === it.line_id);
                const over = tot && (+(it.qty_alloc) || 0) > (tot.qty_total - (tot.allocated - (+(it.qty_alloc) || 0)));
                return (
                  <tr key={it.line_id} style={{ borderBottom: "1px solid var(--sc-divider)" }}>
                    <td style={{ padding: "8px 10px", color: "var(--sc-ink)", fontWeight: 500 }}>{it.item_name}</td>
                    <td style={{ padding: "8px 10px", color: "var(--sc-sub)" }}>{it.uom}</td>
                    <td style={{ padding: "8px 10px", color: "var(--sc-sub)" }}>{it.qty_total}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <input type="number" min="0" max={it.qty_total} value={it.qty_alloc} onChange={(e) => setQty(a.location_id, it.line_id, e.target.value)} style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: `1px solid ${over ? "#ef4444" : "var(--sc-border)"}`, background: "var(--sc-card)", fontSize: 12, color: "var(--sc-ink)", outline: "none", textAlign: "right" }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      {allocs.length > 0 && (
        <div style={{ marginBottom: 12, fontSize: 11.5, color: "var(--sc-sub)", display: "flex", flexWrap: "wrap", gap: 12 }}>
          {totals.map((x) => {
            const line = lines.find((l) => l.id === x.line_id);
            const over = x.allocated > x.qty_total;
            const under = x.allocated < x.qty_total && x.qty_total > 0;
            return (
              <span key={x.line_id} style={{ color: over ? "#ef4444" : under ? "var(--sc-warn)" : "var(--sc-pos)" }}>
                {line?.item_name || "Item"}: {x.allocated}/{x.qty_total} {over ? "over" : under ? "partial" : "ok"}
              </span>
            );
          })}
        </div>
      )}

      {err && <div style={{ padding: "8px 12px", background: "rgba(239,68,68,.08)", borderRadius: 7, fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{err}</div>}
      {allocs.length > 0 && (
        <button onClick={submit} disabled={!canSubmit} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "var(--sc-acc)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: canSubmit ? 1 : 0.5, transition: "opacity .15s" }}>
          {busy ? "Submitting..." : "Confirm Allocation ->"}
        </button>
      )}
    </div>
  );
}

export function SCAllocDetail({ t, onClose, onReload, deps }) {
  const { SB } = deps;
  const [inv, setInv] = useState(null);
  const [lines, setLines] = useState([]);
  const [allocRecs, setAllocRecs] = useState([]);
  const [mprBusy, setMprBusy] = useState(false);
  const [mprResult, setMprResult] = useState(null);
  const fiId = t.fiscal_invoice_id || t.payload?.fiscal_invoice_id || t.entity_id;
  const isDone = t.status === "DONE";

  useEffect(() => {
    if (!fiId) return;
    SB.from("fiscal_invoices").select("*").eq("id", fiId).single().then(({ data }) => setInv(data || null));
    SB.from("fiscal_invoices").select("ebills_fic").eq("id", fiId).single().then(async ({ data }) => {
      const fic = data?.ebills_fic;
      if (fic) {
        const [{ data: el }, { data: epi }] = await Promise.all([
          SB.from("ebills_invoice_lines").select("*").eq("fic", fic).order("line_index"),
          SB.from("ebills_purchase_invoices").select("seller_nipt").eq("fic", fic).single(),
        ]);
        if (el && el.length > 0) {
          const nipt = epi?.seller_nipt || null;
          const names = el.map((l) => l.item_name).filter(Boolean);
          const lineIds = el.map((l) => l.id).filter(Boolean);
          const [vpmRes, sdaRes] = await Promise.all([
            nipt && names.length > 0
              ? SB.from("vendor_product_mappings").select("vendor_item_name,master_products(product_name,sku_code,product_groups(group_name,group_code))").eq("seller_nipt", nipt).in("vendor_item_name", names)
              : Promise.resolve({ data: [] }),
            lineIds.length > 0
              ? SB.from("sc_delivery_allocations").select("ebills_line_id,master_products(product_name,sku_code,product_groups(group_name,group_code))").eq("fiscal_invoice_id", fiId).not("master_product_id", "is", null)
              : Promise.resolve({ data: [] }),
          ]);
          const lookup = {};
          (vpmRes.data || []).forEach((v) => {
            if (!v.master_products) return;
            lookup[v.vendor_item_name.toLowerCase()] = {
              sku_code: v.master_products.sku_code || null,
              group_name: v.master_products.product_groups?.group_name || null,
              group_code: v.master_products.product_groups?.group_code || null,
            };
          });
          const sdaLookup = {};
          (sdaRes.data || []).forEach((s) => {
            if (!s.master_products || !s.ebills_line_id) return;
            sdaLookup[s.ebills_line_id] = {
              sku_code: s.master_products.sku_code || null,
              group_name: s.master_products.product_groups?.group_name || null,
              group_code: s.master_products.product_groups?.group_code || null,
            };
          });
          setLines(
            el.map((l) => ({
              ...l,
              ...(sdaLookup[l.id] || lookup[l.item_name?.toLowerCase()] || {}),
            })),
          );
        } else {
          SB.from("fiscal_invoice_lines").select("*").eq("fiscal_invoice_id", fiId).then(({ data: fl }) => setLines(fl || []));
        }
      } else {
        SB.from("fiscal_invoice_lines").select("*").eq("fiscal_invoice_id", fiId).then(({ data: fl }) => setLines(fl || []));
      }
    });
    SB.from("sc_delivery_allocations").select("*,locations(name),master_products(product_name,sku_code,product_groups(group_name,group_code))").eq("fiscal_invoice_id", fiId).order("created_at").then(({ data }) => setAllocRecs(data || []));
  }, [SB, fiId]);

  const vendorName = inv?.vendor_name_raw || t.payload?.vendor_name || t.vendor_name || "-";
  const invoiceTotal = inv ? `${(+(inv.total_amount || inv.tot_price) || 0).toLocaleString("sq-AL")} ALL` : t.payload?.total_amount || "-";
  const issueDate = inv?.invoice_date || inv?.issue_date_time ? new Date(inv.invoice_date || inv.issue_date_time).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
  const payStatus = inv?.payment_status || "-";

  const runMprCheck = async () => {
    if (!fiId) return;
    setMprBusy(true);
    setMprResult(null);
    try {
      const { data, error } = await SB.rpc("run_mpr_check", { p_fiscal_invoice_id: fiId });
      if (error) throw error;
      setMprResult(data);
    } catch (e) {
      setMprResult({ ok: false, error: e.message });
    }
    setMprBusy(false);
  };

  const infoGrid = [
    { l: "Invoice ID", v: `#${fiId?.slice(-8).toUpperCase() || "-"}` },
    { l: "Vendor", v: vendorName },
    { l: "Issued", v: issueDate },
    { l: "Task ID", v: `#${t.id?.slice(-8).toUpperCase() || "-"}` },
    { l: "Invoice Total", v: invoiceTotal },
    { l: "Payment", v: payStatus },
  ];

  return (
    <div className="sc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sc-dp" style={{ width: "100%", maxWidth: 700 }}>
        <div className="sc-dp-hdr">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".07em" }}>Allocation</span>
              {isDone ? <span className="sp sp-g">COMPLETED</span> : <span className="sp sp-o">OPEN</span>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--sc-ink)" }}>{vendorName}</div>
            <div style={{ fontSize: 12, color: "var(--sc-sub)", marginTop: 3 }}>Invoice #{fiId?.slice(-8) || "-"}</div>
          </div>
          <button className="sc-dp-close" onClick={onClose}><SCIcon n="x" s={15} c="var(--sc-ink)" /></button>
        </div>

        <div className="sc-dp-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 22 }}>
            {infoGrid.map((x, i) => (
              <div key={i} style={{ background: "var(--sc-bg)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--sc-border)" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{x.l}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sc-ink)", wordBreak: "break-all" }}>{x.v}</div>
              </div>
            ))}
          </div>

          {isDone ? (
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Allocation Breakdown</div>
              {allocRecs.length === 0 ? (
                <div style={{ padding: "14px", background: "var(--sc-bg)", borderRadius: 10, border: "1px solid var(--sc-border)", textAlign: "center", fontSize: 12, color: "var(--sc-muted)" }}>No allocation records found.</div>
              ) : (
                <div style={{ border: "1px solid var(--sc-border)", borderRadius: 10, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--sc-bg)" }}>
                        {["Location", "Item", "Qty", "UOM", "Status"].map((h) => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--sc-divider)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allocRecs.map((r, i) => (
                        <tr key={r.id} style={{ borderBottom: i < allocRecs.length - 1 ? "1px solid var(--sc-divider)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,.015)" }}>
                          <td style={{ padding: "8px 10px", color: "var(--sc-ink)", fontWeight: 600 }}>{r.locations?.name || r.location_id?.slice(-6)}</td>
                          <td style={{ padding: "8px 10px" }}>{r.master_products?.product_groups?.group_name ? <><span>{r.master_products.product_groups.group_name}</span>{r.master_products.sku_code && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--sc-muted)", fontFamily: "monospace", background: "var(--sc-bg)", padding: "1px 5px", borderRadius: 4 }}>{r.master_products.sku_code}</span>}<div style={{ fontSize: 10.5, color: "var(--sc-muted)", marginTop: 1 }}>{r.item_name}</div></> : <span style={{ color: "var(--sc-ink)" }}>{r.item_name || "-"}</span>}</td>
                          <td style={{ padding: "8px 10px", color: "var(--sc-ink)", fontWeight: 700 }}>{r.allocated_qty}</td>
                          <td style={{ padding: "8px 10px", color: "var(--sc-sub)" }}>{r.uom || "-"}</td>
                          <td style={{ padding: "8px 10px" }}><span className="sp sp-g">{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>
              {lines.length > 0 ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Invoice Items ({lines.length})</div>
                  <div style={{ border: "1px solid var(--sc-border)", borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "var(--sc-bg)" }}>
                          {["Item Name", "Qty", "Location"].map((h) => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--sc-divider)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l, i) => {
                          const lineAllocs = allocRecs.filter((r) => r.ebills_line_id === l.id || r.item_name === l.item_name);
                          const locSummary = lineAllocs.length > 0 ? lineAllocs.map((r) => `${r.locations?.name || "?"} x${r.allocated_qty}`).join(", ") : "-";
                          return (
                            <tr key={l.id || i} style={{ borderBottom: i < lines.length - 1 ? "1px solid var(--sc-divider)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,.015)" }}>
                              <td style={{ padding: "8px 10px" }}>
                                {l.group_name ? <><span style={{ fontWeight: 600, color: "var(--sc-ink)" }}>{l.group_name}</span>{l.sku_code && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--sc-muted)", fontFamily: "monospace", background: "var(--sc-bg)", padding: "1px 5px", borderRadius: 4 }}>{l.sku_code}</span>}<div style={{ fontSize: 10.5, color: "var(--sc-muted)", marginTop: 1 }}>{l.item_name || "-"}</div></> : <span style={{ fontWeight: 500, color: "var(--sc-ink)" }}>{l.item_name || l.vendor_item_name || "-"}</span>}
                              </td>
                              <td style={{ padding: "8px 10px", color: "var(--sc-sub)" }}>{l.qty || "-"} {l.unit_of_measure || l.uom || ""}</td>
                              <td style={{ padding: "8px 10px", color: "var(--sc-sub)", fontSize: 11.5 }}>{locSummary}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "14px 16px", background: "var(--sc-bg)", borderRadius: 10, border: "1px solid var(--sc-border)", marginBottom: 20, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "var(--sc-muted)" }}>Invoice total: <strong style={{ color: "var(--sc-ink)" }}>{invoiceTotal}</strong></div>
                </div>
              )}

              <div style={{ padding: "16px 18px", background: "var(--sc-bg)", borderRadius: 12, border: "1px solid var(--sc-border)", marginBottom: mprResult?.ok ? 20 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--sc-ink)" }}>MPR Check</div>
                    <div style={{ fontSize: 11.5, color: "var(--sc-muted)", marginTop: 2 }}>Verify all items map to known SKUs before allocation.</div>
                  </div>
                  {!mprResult && (
                    <button onClick={runMprCheck} disabled={mprBusy} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "var(--sc-acc)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: mprBusy ? 0.6 : 1, flexShrink: 0 }}>
                      {mprBusy ? "Checking..." : "Run MPR Check ->"}
                    </button>
                  )}
                  {mprResult?.ok && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "var(--sc-pos-bg)", border: "1px solid rgba(16,185,129,.2)", flexShrink: 0 }}>
                      <SCIcon n="check" s={13} c="var(--sc-pos)" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--sc-pos)" }}>check confirmed</span>
                    </div>
                  )}
                  {mprResult && !mprResult.ok && !mprResult.error && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)" }}>
                        <SCIcon n="alert-triangle" s={13} c="#ef4444" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>blocked - items in quarantine</span>
                      </div>
                      <button onClick={() => { setMprResult(null); runMprCheck(); }} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--sc-border)", background: "var(--sc-bg)", color: "var(--sc-ink)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                        Re-run Check
                      </button>
                    </div>
                  )}
                </div>
                {mprResult && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--sc-sub)", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {mprResult.error ? <span style={{ color: "#ef4444" }}>{mprResult.error}</span> : <>
                      <span>Matched: <strong style={{ color: "var(--sc-pos)" }}>{mprResult.matched ?? 0}</strong></span>
                      {mprResult.unmatched > 0 && <span>Unmatched: <strong style={{ color: "#ef4444" }}>{mprResult.unmatched}</strong></span>}
                      {mprResult.quarantined > 0 && <span>Quarantined: <strong style={{ color: "#d97706" }}>{mprResult.quarantined}</strong></span>}
                    </>}
                  </div>
                )}
              </div>

              {mprResult && !mprResult.ok && !mprResult.error && (
                <div style={{ marginTop: 12, padding: "14px 16px", background: "rgba(245,158,11,.07)", borderRadius: 10, border: "1px solid rgba(245,158,11,.25)", display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <SCIcon n="alert-triangle" s={16} c="#d97706" />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>
                      {mprResult.quarantined} item{mprResult.quarantined !== 1 ? "s" : ""} sent to Quarantine Workbench
                    </div>
                    <div style={{ fontSize: 11.5, color: "#b45309", lineHeight: 1.5 }}>
                      Resolve all unknown SKUs in the Quarantine tab, then click <strong>Re-run Check</strong> above to unlock allocation.
                    </div>
                  </div>
                </div>
              )}
              {mprResult?.ok && <SCAllocPanel lines={lines} fiId={fiId} taskId={t.id} procTaskId={t.payload?.procurement_task_id} brandId={t.brand_id} onDone={onReload || onClose} deps={{ SB }} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
