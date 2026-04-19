import { useState } from "react";
import { SC_CODES } from "../config";
import { ageCls, scAge, scHrs, scPColor, taskLbl } from "../helpers";

export function SCTasksPage({ tasks = [], search, exp = true, onReload, deps }) {
  const { SCEmpty, SCAllocDetail } = deps;
  const [filter, setFilter] = useState("ALL");
  const [sel, setSel] = useState(null);
  const scTasks = tasks.filter((task) => SC_CODES.includes(task.task_type_code) && task.status !== "DONE");
  const types = ["ALL", "SC_ALLOCATE_DELIVERY", "QUARANTINE_REVIEW", "RECEIVE_DELIVERY", "OVERDUE"];
  const filtered = scTasks
    .filter((task) => {
      if (filter === "OVERDUE") return task.due_at && new Date(task.due_at) < new Date();
      if (filter !== "ALL") return task.task_type_code === filter;
      return true;
    })
    .filter((task) => !search || JSON.stringify(task).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="sc-fu">
      {sel && <SCAllocDetail t={sel} onClose={() => setSel(null)} exp={exp} onReload={() => { setSel(null); if (onReload) onReload(); }} />}
      <div className="sc-filter-bar">
        {types.map((type) => (
          <button key={type} className={`sc-fc ${filter === type ? "on" : ""}`} onClick={() => setFilter(type)}>
            {type === "ALL" ? "All Tasks" : type === "OVERDUE" ? `Overdue (${scTasks.filter((task) => task.due_at && new Date(task.due_at) < new Date()).length})` : taskLbl(type)}
          </button>
        ))}
      </div>
      <div className="sc-panel">
        {filtered.length === 0 ? (
          <SCEmpty msg="No tasks match filters" color="var(--sc-muted)" />
        ) : (
          <table className="sc-tbl">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Type</th>
                <th>Vendor</th>
                <th>Priority</th>
                <th>Age</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const overdue = task.due_at && new Date(task.due_at) < new Date();
                const vendor = task.payload?.vendor_name || task.vendor_name || "-";
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
                    <td>
                      <span className={`sc-tag ${task.task_type_code === "QUARANTINE_REVIEW" ? "st-price" : task.task_type_code === "SC_ALLOCATE_DELIVERY" ? "st-uom" : task.task_type_code === "RECEIVE_DELIVERY" ? "st-vendor" : "st-unk"}`}>
                        {taskLbl(task.task_type_code)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vendor}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 700, color: scPColor(task.priority) }}>{task.priority ? `P${task.priority}` : "-"}</span>
                    </td>
                    <td>
                      <span className={`sp ${ageCls(scHrs(task.created_at))}`}>{scAge(task.created_at)}</span>
                    </td>
                    <td>
                      <span className={`sp ${task.status === "OVERDUE" || overdue ? "sp-r" : task.status === "OPEN" ? "sp-o" : "sp-x"}`}>
                        {task.status === "OVERDUE" || overdue ? "OVERDUE" : task.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
