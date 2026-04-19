import { useState } from "react";

export function LeadershipTasksPage({
  tasks,
  search,
  locMap,
  roles,
  locations,
  session,
  onRefresh,
  components,
  helpers,
}) {
  const { TaskModal, HROnboardModal, HROffboardModal, HRTimesheetModal } = components;
  const { tLabel, pColor, pLabel, fmtAgo } = helpers;

  const [tab, setTab] = useState("hr-requests");
  const [taskModal, setTaskModal] = useState(null);
  const [onboardModal, setOnboardModal] = useState(null);
  const [offboardModal, setOffboardModal] = useState(null);
  const [timesheetModal, setTimesheetModal] = useState(null);

  const q = search.toLowerCase();
  const now = new Date();
  const HR_ROLES = ["HR_MANAGER", "COO", "SYSTEM_ADMIN"];
  const HR_TYPES = [
    "HR_MISSING_DOC",
    "HR_ONBOARD_REQUEST",
    "HR_OFFBOARD_REQUEST",
    "CONTRACT_EXPIRY",
    "PROBATION_REVIEW",
    "PERFORMANCE_REVIEW",
    "QUARANTINE_REVIEW",
    "GENERAL",
    "POLICY_ACK_PENDING",
    "WELLBEING_CHECK",
    "TIMESHEET_REVIEW",
    "ATTENDANCE_MANUAL_CORRECTION",
  ];

  const hrTasks = tasks.filter((t) => HR_TYPES.includes(t.task_type_code) || HR_ROLES.includes(t.assigned_role));

  const handleTaskClick = (t) => {
    if (t.task_type_code === "HR_ONBOARD_REQUEST") setOnboardModal(t);
    else if (t.task_type_code === "HR_OFFBOARD_REQUEST") setOffboardModal(t);
    else if (t.task_type_code === "TIMESHEET_REVIEW" || t.task_type_code === "ATTENDANCE_MANUAL_CORRECTION") setTimesheetModal(t);
    else setTaskModal(t);
  };

  const hrRequestTasks = hrTasks.filter((t) => ["HR_ONBOARD_REQUEST", "HR_OFFBOARD_REQUEST"].includes(t.task_type_code) && ["OPEN", "IN_PROGRESS"].includes(t.status));
  const tabs = [
    { id: "hr-requests", label: "HR Requests", tasks: hrRequestTasks },
    { id: "overdue", label: "Overdue", tasks: hrTasks.filter((t) => t.status === "OVERDUE") },
    { id: "today", label: "Due Today", tasks: hrTasks.filter((t) => t.due_at && new Date(t.due_at).toDateString() === now.toDateString() && t.status === "OPEN") },
    { id: "open", label: "Open", tasks: [...hrTasks.filter((t) => ["HR_ONBOARD_REQUEST", "HR_OFFBOARD_REQUEST"].includes(t.task_type_code) && t.status === "OPEN"), ...hrTasks.filter((t) => !["HR_ONBOARD_REQUEST", "HR_OFFBOARD_REQUEST"].includes(t.task_type_code) && t.status === "OPEN")] },
    { id: "unclaimed", label: "Unclaimed", tasks: hrTasks.filter((t) => !t.assigned_to_employee) },
    { id: "blocked", label: "Blocked", tasks: hrTasks.filter((t) => t.status === "BLOCKED") },
  ];

  const active = tabs.find((t) => t.id === tab);
  const visible = (active?.tasks || []).filter((t) => !q || tLabel(t.task_type_code).toLowerCase().includes(q) || (t.assigned_role || "").toLowerCase().includes(q));

  return (
    <>
      {taskModal && <TaskModal task={taskModal} locMap={locMap} onClose={() => setTaskModal(null)} />}
      {onboardModal && (
        <HROnboardModal
          task={onboardModal}
          roles={roles}
          locations={locations}
          session={session}
          onClose={() => setOnboardModal(null)}
          onDone={() => {
            setOnboardModal(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      {offboardModal && (
        <HROffboardModal
          task={offboardModal}
          session={session}
          onClose={() => setOffboardModal(null)}
          onDone={() => {
            setOffboardModal(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      {timesheetModal && (
        <HRTimesheetModal
          task={timesheetModal}
          session={session}
          onClose={() => setTimesheetModal(null)}
          onDone={() => {
            setTimesheetModal(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--divider)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "on" : ""}`}
            onClick={() => setTab(t.id)}
            style={t.id === "hr-requests" && t.tasks.length > 0 ? { color: tab === t.id ? "var(--acc)" : "var(--pos)", fontWeight: 600 } : {}}
          >
            {t.id === "hr-requests" && t.tasks.length > 0 && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--pos)", marginRight: 5, verticalAlign: "middle", marginBottom: 1 }} />}
            {t.label}
            {t.tasks.length > 0 && (
              <span
                style={{
                  marginLeft: 6,
                  background: t.id === "hr-requests" ? (tab === t.id ? "rgba(22,163,74,.15)" : "rgba(22,163,74,.1)") : tab === t.id ? "var(--acc-bg)" : "var(--faint)",
                  color: t.id === "hr-requests" ? "var(--pos)" : tab === t.id ? "var(--acc)" : "var(--muted)",
                  borderRadius: 100,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {t.tasks.length}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Employee</th>
              <th>Priority</th>
              <th>Due</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id} className="rh" onClick={() => handleTaskClick(t)} style={{ cursor: "pointer" }}>
                <td style={{ fontWeight: 500 }}>{tLabel(t.task_type_code)}</td>
                <td style={{ color: "var(--sub)", fontSize: 12.5 }}>
                  {t.task_type_code === "HR_ONBOARD_REQUEST" ? (
                    <span style={{ color: "var(--acc)", fontWeight: 500 }}>View request →</span>
                  ) : t.task_type_code === "HR_OFFBOARD_REQUEST" ? (
                    <span style={{ color: "var(--neg)", fontWeight: 500 }}>View request →</span>
                  ) : (
                    (t.task_type_code || "").replace(/_/g, " ")
                  )}
                </td>
                <td style={{ color: pColor(+t.priority), fontWeight: 700 }}>{pLabel(+t.priority)}</td>
                <td style={{ color: t.status === "OVERDUE" ? "var(--neg)" : "var(--sub)", fontWeight: t.status === "OVERDUE" ? 600 : 400 }}>{fmtAgo(t.due_at)}</td>
                <td style={{ color: "var(--sub)", fontSize: 12.5 }}>{(t.assigned_role || "—").replace(/_/g, " ")}</td>
                <td><span className={`badge badge-${t.status === "OVERDUE" ? "r" : t.status === "OPEN" ? "o" : "x"}`}>{t.status}</span></td>
                <td>
                  {t.task_type_code === "HR_ONBOARD_REQUEST" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(29,107,243,.08)", color: "var(--acc)" }}>ONBOARDING</span>}
                  {t.task_type_code === "HR_OFFBOARD_REQUEST" && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,.08)", color: "var(--neg)" }}>OFFBOARDING</span>}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
                  {tab === "hr-requests" ? "No pending HR requests." : "No tasks in this view."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
