import { useState } from "react";

export function LeadershipTowerPage({
  tasks,
  locations,
  search,
  locMap,
  roles,
  allLocations,
  session,
  onRefresh,
  components,
  helpers,
}) {
  const { TaskModal, HROnboardModal } = components;
  const { tLabel, resolveLocName, pColor, pLabel, fmtAgo } = helpers;

  const [taskModal, setTaskModal] = useState(null);
  const [onboardModal, setOnboardModal] = useState(null);
  const [f, setF] = useState({ status: "", role: "", priority: "", type: "", assigned: "", loc: "" });

  const handleTaskClick = (t) => {
    if (t.task_type_code === "HR_ONBOARD_REQUEST") setOnboardModal(t);
    else setTaskModal(t);
  };

  const q = search.toLowerCase();
  const filterRoles = [...new Set(tasks.map((t) => t.assigned_role).filter(Boolean))].sort();
  const types = [...new Set(tasks.map((t) => t.task_type_code).filter(Boolean))].sort();
  const locs = locations.map((l) => ({ id: l.location_id, name: l.location_name }));
  const filtered = tasks.filter((t) => {
    if (f.status && t.status !== f.status) return false;
    if (f.role && t.assigned_role !== f.role) return false;
    if (f.priority && +t.priority !== +f.priority) return false;
    if (f.type && t.task_type_code !== f.type) return false;
    if (f.assigned === "unclaimed" && t.assigned_to_employee) return false;
    if (f.assigned === "claimed" && !t.assigned_to_employee) return false;
    if (f.loc && t.location_id !== f.loc) return false;
    if (
      q &&
      !tLabel(t.task_type_code).toLowerCase().includes(q) &&
      !(t.assigned_role || "").toLowerCase().includes(q) &&
      !(locMap[t.location_id] || "").toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  const setFk = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const hasFilter = Object.values(f).some(Boolean);

  return (
    <>
      {taskModal && <TaskModal task={taskModal} locMap={locMap} onClose={() => setTaskModal(null)} />}
      {onboardModal && (
        <HROnboardModal
          task={onboardModal}
          roles={roles}
          locations={allLocations}
          session={session}
          onClose={() => setOnboardModal(null)}
          onDone={() => {
            setOnboardModal(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { l: "Overdue", v: filtered.filter((t) => t.status === "OVERDUE").length, c: "var(--neg)" },
          { l: "Open", v: filtered.filter((t) => t.status === "OPEN").length, c: "var(--ink)" },
          { l: "Unclaimed", v: filtered.filter((t) => !t.assigned_to_employee).length, c: "var(--warn)" },
          { l: "High Priority", v: filtered.filter((t) => +t.priority >= 4).length, c: "var(--warn)" },
        ].map((m) => (
          <div key={m.l} className="card" style={{ padding: "18px 22px" }}>
            <div style={{ fontWeight: 800, fontSize: 32, color: m.c, lineHeight: 1, letterSpacing: "-0.03em" }}>{m.v}</div>
            <div style={{ fontSize: 12, color: "var(--sub)", marginTop: 4 }}>{m.l}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select className="f-select" value={f.status} onChange={(e) => setFk("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="OVERDUE">Overdue</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <select className="f-select" value={f.role} onChange={(e) => setFk("role", e.target.value)}>
            <option value="">All roles</option>
            {filterRoles.map((r) => (
              <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select className="f-select" value={f.loc} onChange={(e) => setFk("loc", e.target.value)}>
            <option value="">All locations</option>
            {locs.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <select className="f-select" value={f.priority} onChange={(e) => setFk("priority", e.target.value)}>
            <option value="">All priorities</option>
            <option value="5">P5 - Critical</option>
            <option value="4">P4 - High</option>
            <option value="3">P3 - Medium</option>
            <option value="2">P2 - Low</option>
          </select>
          <select className="f-select" value={f.type} onChange={(e) => setFk("type", e.target.value)}>
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>{tLabel(t)}</option>
            ))}
          </select>
          <select className="f-select" value={f.assigned} onChange={(e) => setFk("assigned", e.target.value)}>
            <option value="">Claimed & Unclaimed</option>
            <option value="unclaimed">Unclaimed only</option>
            <option value="claimed">Claimed only</option>
          </select>
          {hasFilter && (
            <button onClick={() => setF({ status: "", role: "", priority: "", type: "", assigned: "", loc: "" })} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", fontSize: 12, color: "var(--sub)", cursor: "pointer" }}>
              Clear
            </button>
          )}
          <div style={{ marginLeft: "auto", fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Type</th>
                <th>Location</th>
                <th>Role</th>
                <th>Status</th>
                <th>Pri</th>
                <th>Age</th>
                <th>Due</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="rh" onClick={() => handleTaskClick(t)} style={{ cursor: "pointer" }}>
                  <td style={{ fontWeight: 500, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tLabel(t.task_type_code)}</td>
                  <td><span className="badge badge-x" style={{ fontSize: 10 }}>{(t.task_type_code || "").split("_")[0]}</span></td>
                  <td style={{ color: "var(--sub)", fontSize: 12.5 }}>{resolveLocName(t, locMap)}</td>
                  <td style={{ color: "var(--sub)", fontSize: 12.5, whiteSpace: "nowrap" }}>{(t.assigned_role || "—").replace(/_/g, " ")}</td>
                  <td><span className={`badge badge-${t.status === "OVERDUE" ? "r" : t.status === "OPEN" ? "o" : "x"}`}>{t.status}</span></td>
                  <td style={{ color: pColor(+t.priority), fontWeight: 700, fontSize: 12 }}>{pLabel(+t.priority)}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{fmtAgo(t.created_at)}</td>
                  <td style={{ color: t.status === "OVERDUE" ? "var(--neg)" : "var(--sub)", fontSize: 12.5, fontWeight: t.status === "OVERDUE" ? 600 : 400 }}>{fmtAgo(t.due_at)}</td>
                  <td>{t.assigned_to_employee ? <span className="badge badge-b" style={{ fontSize: 10 }}>Claimed</span> : <span className="badge badge-x" style={{ fontSize: 10 }}>Unclaimed</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
                    No tasks match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
