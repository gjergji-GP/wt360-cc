import { useState } from "react";
import { ageCls, scAge, scHrs } from "../helpers";

export function SCAllocPage({ tasks = [], search, onReload, deps }) {
  const { SCEmpty, SCAllocDetail, SPH } = deps;
  const [sel, setSel] = useState(null);
  const allocTasks = tasks.filter((task) => task.task_type_code === "SC_ALLOCATE_DELIVERY");
  const openTasks = allocTasks.filter((task) => task.status === "OPEN");
  const doneTasks = allocTasks.filter((task) => task.status === "DONE");
  const allFiltered = allocTasks.filter((task) => !search || JSON.stringify(task).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="sc-fu">
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[
          { l: "Pending Allocation", v: openTasks.length, c: "var(--sc-warn)" },
          { l: "Overdue", v: openTasks.filter((task) => task.due_at && new Date(task.due_at) < new Date()).length, c: "var(--sc-neg)" },
          { l: "Completed", v: doneTasks.length, c: "var(--sc-pos)" },
        ].map((summary, index) => (
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
            <div style={{ fontSize: 26, fontWeight: 700, color: summary.c, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{summary.v}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sc-sub)", marginTop: 4 }}>{summary.l}</div>
          </div>
        ))}
      </div>
      <div className="sc-panel">
        <SPH title="Allocation Ledger" sub="All allocation tasks - click any row to view detail" />
        {allFiltered.length === 0 ? (
          <SCEmpty icon="layers" msg="No allocations in this period" color="var(--sc-muted)" />
        ) : (
          <table className="sc-tbl">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Vendor</th>
                <th>Invoice</th>
                <th>Age</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allFiltered.map((task) => {
                const overdue = task.due_at && new Date(task.due_at) < new Date() && task.status === "OPEN";
                const vendor = task.payload?.vendor_name || task.vendor_name || "-";
                const fiShort = (task.fiscal_invoice_id || task.payload?.fiscal_invoice_id || task.entity_id || "").slice(-8).toUpperCase();

                return (
                  <tr
                    key={task.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSel(task)}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "var(--sc-hover)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = "";
                    }}
                  >
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--sc-muted)" }}>#{task.id?.slice(-8).toUpperCase()}</td>
                    <td style={{ fontWeight: 600, color: "var(--sc-ink)" }}>{vendor}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--sc-muted)" }}>#{fiShort || "-"}</td>
                    <td>
                      <span className={`sp ${ageCls(scHrs(task.created_at))}`}>{scAge(task.created_at)}</span>
                    </td>
                    <td>
                      <span className={`sp ${task.status === "DONE" ? "sp-g" : overdue ? "sp-r" : "sp-o"}`}>
                        {task.status === "DONE" ? "COMPLETED" : overdue ? "OVERDUE" : task.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {sel && <SCAllocDetail t={sel} onClose={() => setSel(null)} onReload={() => { setSel(null); if (onReload) onReload(); }} />}
    </div>
  );
}
