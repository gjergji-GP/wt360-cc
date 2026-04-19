import { useEffect, useState } from "react";

export function SCDiscrepancyLog({ session, deps }) {
  const {
    SB,
    SCDiscDetail,
    DISC_TYPE_LABEL,
    RES_TYPE_LABEL,
    STATUS_COLOR,
    DISC_COLOR,
  } = deps;

  const DetailPanel = (props) => (
    <SCDiscDetail
      {...props}
      deps={{ SB, DISC_COLOR, DISC_TYPE_LABEL, RES_TYPE_LABEL, STATUS_COLOR }}
    />
  );

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [locations, setLocations] = useState([]);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("ALL");
  const [typeF, setTypeF] = useState("ALL");
  const [resF, setResF] = useState("ALL");
  const [locF, setLocF] = useState("ALL");
  const [dateF, setDateF] = useState("Last 30 days");
  const [sort, setSort] = useState({ col: "created_at", dir: "desc" });

  const getRange = () => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    if (dateF === "Today") return { from: s.toISOString(), to: e.toISOString() };
    if (dateF === "Yesterday") {
      s.setDate(s.getDate() - 1);
      e.setDate(e.getDate() - 1);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (dateF === "Last 7 days") {
      s.setDate(s.getDate() - 6);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (dateF === "Last 30 days") {
      s.setDate(s.getDate() - 29);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (dateF === "This month") {
      s.setDate(1);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    return { from: s.toISOString(), to: e.toISOString() };
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { from, to } = getRange();
      let q = SB.from("delivery_discrepancies")
        .select(`*, locations!delivery_discrepancies_location_id_fkey(name),
               fiscal_invoices(vendor_name_raw),
               master_products(sku_code, product_groups(group_name)),
               employees!delivery_discrepancies_resolved_by_fkey(full_name)`)
        .gte("created_at", from)
        .lte("created_at", to)
        .order(sort.col, { ascending: sort.dir === "asc" })
        .limit(500);
      if (statusF !== "ALL") q = q.eq("status", statusF);
      if (typeF !== "ALL") q = q.eq("discrepancy_type", typeF);
      if (resF !== "ALL") q = q.eq("resolution_type", resF);
      if (locF !== "ALL") q = q.eq("location_id", locF);
      const { data } = await q;

      const { data: locData } = await SB.from("locations").select("id,name");
      setLocations(locData || []);
      setRows(
        (data || []).map((d) => ({
          ...d,
          location_name: d.locations?.name || "-",
          vendor_name: d.fiscal_invoices?.vendor_name_raw || "-",
          group_name: d.group_name || d.master_products?.product_groups?.group_name || "-",
          sku_code: d.sku_code || d.master_products?.sku_code || "-",
          resolved_by_name: d.employees?.full_name || "-",
        })),
      );
      setLoading(false);
    };

    load();
  }, [SB, dateF, locF, resF, sort.col, sort.dir, statusF, typeF]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const h = search.toLowerCase();
    return [r.vendor_name, r.group_name, r.sku_code, r.location_name, r.resolution_note, r.id].some((v) =>
      (v || "").toLowerCase().includes(h),
    );
  });

  const total = filtered.length;
  const open = filtered.filter((r) => r.status === "OPEN").length;
  const resolved = filtered.filter((r) => r.status === "RESOLVED").length;
  const transfers = filtered.filter((r) => r.resolution_type === "INTERNAL_TRANSFER").length;

  const toggleSort = (col) => {
    setSort((p) => (p.col === col ? { col, dir: p.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" }));
  };

  const SortIcon = ({ col }) =>
    sort.col === col ? <span style={{ marginLeft: 3, fontSize: 9, opacity: 0.7 }}>{sort.dir === "asc" ? "▲" : "▼"}</span> : null;

  const exportCSV = () => {
    const cols = [
      "detected_at",
      "vendor",
      "product",
      "sku",
      "location",
      "expected_qty",
      "received_qty",
      "variance_qty",
      "variance_pct",
      "type",
      "resolution_type",
      "status",
      "resolved_by",
      "resolved_at",
    ];
    const rows2 = filtered.map((r) => [
      r.created_at ? new Date(r.created_at).toLocaleString("en-GB") : "",
      r.vendor_name,
      r.group_name,
      r.sku_code,
      r.location_name,
      r.allocated_qty,
      r.received_qty,
      r.variance_qty,
      r.variance_pct,
      DISC_TYPE_LABEL[r.discrepancy_type] || r.discrepancy_type,
      RES_TYPE_LABEL[r.resolution_type] || r.resolution_type || "Pending",
      r.status,
      r.resolved_by_name,
      r.resolved_at ? new Date(r.resolved_at).toLocaleString("en-GB") : "",
    ]);
    const csv = [cols, ...rows2].map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `discrepancy-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--sc-ink)", letterSpacing: "-.02em" }}>Discrepancy Resolution Log</div>
          <div style={{ fontSize: 12, color: "var(--sc-muted)", marginTop: 3 }}>
            Immutable history of allocation vs receipt discrepancies and how they were resolved.
          </div>
        </div>
        <button
          onClick={exportCSV}
          style={{
            padding: "8px 16px",
            background: "var(--sc-card)",
            border: "1px solid var(--sc-border)",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--sc-sub)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Export CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Total", v: total, c: "var(--sc-ink)" },
          { l: "Open", v: open, c: "#b45309" },
          { l: "Resolved", v: resolved, c: "#15803d" },
          { l: "Transfers", v: transfers, c: "#1d4ed8" },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              background: "var(--sc-card)",
              border: "1px solid var(--sc-border)",
              borderTop: "3px solid var(--sc-acc)",
              borderRadius: 12,
              padding: "12px 18px 14px",
              boxShadow: "var(--sc-shadow)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: s.c, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sc-muted)", marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--sc-card)",
          border: "1px solid var(--sc-border)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, SKU, product, note..."
            style={{
              width: "100%",
              padding: "7px 10px 7px 30px",
              border: "1px solid var(--sc-border)",
              borderRadius: 8,
              fontSize: 12,
              background: "var(--sc-bg)",
              color: "var(--sc-ink)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--sc-muted)" }}>⌕</span>
        </div>

        <select value={dateF} onChange={(e) => setDateF(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 12, background: "var(--sc-bg)", color: "var(--sc-ink)", outline: "none", cursor: "pointer" }}>
          {["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month"].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 12, background: "var(--sc-bg)", color: "var(--sc-ink)", outline: "none", cursor: "pointer" }}>
          <option value="ALL">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISPUTED">Disputed</option>
        </select>

        <select value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 12, background: "var(--sc-bg)", color: "var(--sc-ink)", outline: "none", cursor: "pointer" }}>
          <option value="ALL">All types</option>
          {Object.entries(DISC_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select value={resF} onChange={(e) => setResF(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 12, background: "var(--sc-bg)", color: "var(--sc-ink)", outline: "none", cursor: "pointer" }}>
          <option value="ALL">All resolutions</option>
          {Object.entries(RES_TYPE_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>

        <select value={locF} onChange={(e) => setLocF(e.target.value)} style={{ padding: "7px 10px", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 12, background: "var(--sc-bg)", color: "var(--sc-ink)", outline: "none", cursor: "pointer" }}>
          <option value="ALL">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch("");
            setStatusF("ALL");
            setTypeF("ALL");
            setResF("ALL");
            setLocF("ALL");
          }}
          style={{ padding: "7px 12px", background: "none", border: "1px solid var(--sc-border)", borderRadius: 8, fontSize: 11, color: "var(--sc-muted)", cursor: "pointer" }}
        >
          Clear
        </button>
      </div>

      <div style={{ background: "var(--sc-card)", border: "1px solid var(--sc-border)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--sc-shadow)" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--sc-muted)", fontSize: 13 }}>Loading discrepancies...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--sc-muted)", fontSize: 13 }}>No discrepancies found for current filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
              <thead>
                <tr style={{ background: "var(--sc-bg)", borderBottom: "1px solid var(--sc-border)" }}>
                  {[
                    { l: "Detected", col: "created_at" },
                    { l: "Vendor", col: "vendor_name" },
                    { l: "Product", col: "group_name" },
                    { l: "Location", col: "location_id" },
                    { l: "Expected", col: "allocated_qty" },
                    { l: "Received", col: "received_qty" },
                    { l: "Variance", col: "variance_qty" },
                    { l: "Type", col: "discrepancy_type" },
                    { l: "Resolution", col: "resolution_type" },
                    { l: "Status", col: "status" },
                    { l: "Resolved by", col: "resolved_by" },
                  ].map((h) => (
                    <th
                      key={h.col}
                      onClick={() => toggleSort(h.col)}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--sc-muted)",
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        userSelect: "none",
                      }}
                    >
                      {h.l}
                      <SortIcon col={h.col} />
                    </th>
                  ))}
                  <th style={{ width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const varianceValue = Number(r.variance_qty) || 0;
                  const statusColor = STATUS_COLOR[r.status] || "#b45309";
                  const typeColor = DISC_COLOR[r.discrepancy_type] || "#b45309";
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSel(r)}
                      style={{ borderTop: "1px solid var(--sc-divider)", cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(0,0,0,.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--sc-muted)", whiteSpace: "nowrap" }}>
                        {r.created_at ? new Date(r.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 600, color: "var(--sc-ink)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vendor_name}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sc-ink)" }}>{r.group_name}</div>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: "var(--sc-muted)", marginTop: 1 }}>{r.sku_code}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--sc-sub)", whiteSpace: "nowrap" }}>{r.location_name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", color: "var(--sc-muted)", textAlign: "right" }}>{r.allocated_qty}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "var(--sc-ink)", textAlign: "right" }}>{r.received_qty}</td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: varianceValue > 0 ? "#15803d" : varianceValue < 0 ? "#b91c1c" : "var(--sc-muted)" }}>
                          {varianceValue > 0 ? "+" : ""}
                          {varianceValue}
                        </span>
                        {varianceValue !== 0 && <div style={{ fontSize: 9, color: "var(--sc-muted)" }}>{r.variance_pct}%</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: `${typeColor}15`, color: typeColor, whiteSpace: "nowrap" }}>
                          {DISC_TYPE_LABEL[r.discrepancy_type] || r.discrepancy_type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--sc-sub)" }}>
                        {RES_TYPE_LABEL[r.resolution_type] || <span style={{ fontSize: 11, color: "#b45309", fontWeight: 600 }}>Pending</span>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: `${statusColor}15`, color: statusColor, whiteSpace: "nowrap" }}>{r.status}</span>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "var(--sc-sub)" }}>{r.resolved_by_name !== "-" ? r.resolved_by_name : "-"}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontSize: 11, color: "var(--sc-acc)", fontWeight: 600 }}>View -&gt;</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && <DetailPanel disc={sel} locations={locations} onClose={() => setSel(null)} />}
    </div>
  );
}
