import { scAge, trigLbl, trigTag } from "../helpers";
import { SCIcon } from "./SCIcon";

function SCReportContent({ report, data, deps }) {
  const { SCDiscrepancyLog, scAmt } = deps;

  if (report === "Discrepancy Resolution Log") return <SCDiscrepancyLog session={data.session} />;

  if (report === "Open Quarantines") {
    const rows = (data.quarantines || []).filter((quarantine) => ["OPEN", "UNDER_INVESTIGATION"].includes(quarantine.status));
    return (
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Open Quarantines</div>
        <div style={{ fontSize: 12, color: "var(--sc-muted)", marginBottom: 20 }}>Live - {rows.length} unresolved</div>
        {rows.length === 0 ? (
          <div style={{ color: "var(--sc-pos)", fontWeight: 600 }}>No open quarantines</div>
        ) : (
          <table className="sc-tbl">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item</th>
                <th>Severity</th>
                <th>Age</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((quarantine) => (
                <tr key={quarantine.id}>
                  <td>
                    <span className={`sc-tag ${trigTag(quarantine.trigger_type)}`}>{trigLbl(quarantine.trigger_type)}</span>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{quarantine.vendor_item_name_raw || "-"}</td>
                  <td>
                    <span className={`sp ${quarantine.severity === "HIGH" ? "sp-r" : quarantine.severity === "MEDIUM" ? "sp-o" : "sp-x"}`}>
                      {quarantine.severity}
                    </span>
                  </td>
                  <td>{scAge(quarantine.created_at)}</td>
                  <td>
                    <span className="sp sp-o">{quarantine.status?.replace(/_/g, " ")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (report === "Waste Value by Location") {
    const waste = data.waste || [];
    const total = waste.reduce((sum, row) => sum + (+(row.total_cost) || 0), 0);
    const byLocation = {};
    waste.forEach((row) => {
      const key = row.location_id || "u";
      if (!byLocation[key]) byLocation[key] = { name: row.location_name || "Unknown", v: 0, n: 0 };
      byLocation[key].v += +(row.total_cost) || 0;
      byLocation[key].n += 1;
    });
    const rows = Object.values(byLocation).sort((a, b) => b.v - a.v);
    return (
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Waste Value by Location</div>
        <div style={{ fontSize: 12, color: "var(--sc-muted)", marginBottom: 8 }}>Selected period - operational COGS loss</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "var(--sc-neg)", letterSpacing: "-.03em", marginBottom: 22 }}>{scAmt(total)}</div>
        {rows.length === 0 ? (
          <div style={{ color: "var(--sc-muted)", fontSize: 13 }}>No waste data for period</div>
        ) : (
          <table className="sc-tbl">
            <thead>
              <tr>
                <th>Location</th>
                <th>Waste Value</th>
                <th>Entries</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td style={{ fontWeight: 800, color: "var(--sc-neg)" }}>{scAmt(row.v)}</td>
                  <td>{row.n}</td>
                  <td>{total > 0 ? `${((row.v / total) * 100).toFixed(1)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (report === "COGS Pipeline Status") {
    const invoices = data.invoices || [];
    const rows = [
      { stage: "Unclassified", cnt: invoices.filter((invoice) => invoice.status === "PENDING").length, desc: "Awaiting Finance classification" },
      { stage: "Awaiting SC Allocation", cnt: invoices.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT").length, desc: "Classified - SC task pending or in progress" },
      { stage: "Received", cnt: data.tickets?.length || 0, desc: "Physical receipt confirmed by location" },
    ];
    return (
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>COGS Pipeline Status</div>
        <div style={{ fontSize: 12, color: "var(--sc-muted)", marginBottom: 20 }}>Invoice → Verification → Allocation → Receiving</div>
        <table className="sc-tbl">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Count</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 700 }}>{row.stage}</td>
                <td style={{ fontWeight: 800, fontSize: 16 }}>{row.cnt}</td>
                <td style={{ color: "var(--sc-sub)", fontSize: 12.5 }}>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <SCIcon n="bar" s={32} c="var(--sc-muted)" />
      <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: "var(--sc-sub)" }}>{report}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--sc-muted)" }}>Report available when pipeline data accumulates.</div>
    </div>
  );
}

export function SCReportsPage({ activeReport, data, deps }) {
  return (
    <div className="sc-fu">
      {activeReport ? (
        <div className="sc-panel">
          <div className="sc-pb">
            <SCReportContent report={activeReport} data={data} deps={deps} />
          </div>
        </div>
      ) : (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <SCIcon n="bar" s={40} c="var(--sc-muted)" />
          <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: "var(--sc-sub)" }}>Select a report from the sidebar</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--sc-muted)" }}>SC forensic reports - no HR, no Finance</div>
        </div>
      )}
    </div>
  );
}
