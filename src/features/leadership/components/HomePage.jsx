import { useState } from "react";

export function LeadershipHomePage({
  locations,
  employees,
  tasks,
  date,
  search,
  severity,
  session,
  setPage,
  roles,
  allLocations,
  onEmpSaved,
  locMap,
  components,
  helpers,
}) {
  const { EmployeeModal, TaskModal, HROnboardModal, CH, AreaChart, Icon, SparkLine, ScoreRing, KpiRow, HealthBar, Avatar } = components;
  const { sk, cmpMap, hc, resolveLocName, tLabel } = helpers;

  const [overlay, setOverlay] = useState("health");
  const [empModal, setEmpModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [onboardModal, setOnboardModal] = useState(null);

  const handleHQTaskClick = (t) => {
    if (t.task_type_code === "HR_ONBOARD_REQUEST") setOnboardModal(t);
    else setTaskModal(t);
  };

  const q = search.toLowerCase();
  const filteredLocs = locations
    .filter((l) => {
      const hs = +l.health_score || 0;
      if (severity === "crit") return hs < 45;
      if (severity === "warn") return hs >= 45 && hs < 70;
      if (severity === "stab") return hs >= 70;
      return true;
    })
    .filter((l) => !q || l.location_name?.toLowerCase().includes(q));

  const filteredEmps = employees.filter(
    (e) => !q || e.full_name?.toLowerCase().includes(q) || e.location_name?.toLowerCase().includes(q)
  );
  const overdueTasks = tasks.filter((t) => t.status === "OVERDUE");
  const openTasks = tasks.filter((t) => t.status === "OPEN");
  const unclaimedTasks = tasks.filter((t) => !t.assigned_to_employee);
  const atRiskEmps = employees.filter((e) => +e.overall_score < 50);
  const gapLocs = locations.filter((l) => +l.health_score < 50);
  const avgHealth = locations.length
    ? Math.round(locations.reduce((a, l) => a + (+l.health_score || 0), 0) / locations.length)
    : 0;
  const worstLoc = [...locations].sort((a, b) => +a.health_score - +b.health_score)[0];
  const bestLoc = [...locations].sort((a, b) => +b.health_score - +a.health_score)[0];
  const hqTasks = tasks.filter((t) => ["SYSTEM_ADMIN", "CFO", "COO", "HR_MANAGER"].includes(t.assigned_role));
  const totalOverdueYesterday = locations.reduce((s, l) => s + (+l.overdue_yesterday || 0), 0);
  const overdueTasksDelta = overdueTasks.length - totalOverdueYesterday;
  const heroModes = {
    health: { data: sk(avgHealth, 12), color: "#1d6bf3", label: "Health Score", sfx: "%", val: avgHealth, delta: null },
    overdue: { data: sk(overdueTasks.length, 12), color: "#d97706", label: "Overdue Tasks", sfx: "", val: overdueTasks.length, delta: overdueTasksDelta !== 0 ? -overdueTasksDelta : null },
    risk: { data: sk(atRiskEmps.length, 12), color: "#dc2626", label: "At-Risk Employees", sfx: "", val: atRiskEmps.length, delta: null },
  };
  const hm = heroModes[overlay];

  return (
    <>
      {empModal && (
        <EmployeeModal
          emp={empModal}
          tasks={tasks}
          roles={roles}
          locations={allLocations}
          onClose={() => setEmpModal(null)}
          onSaved={() => {
            setEmpModal(null);
            setTimeout(() => {
              if (onEmpSaved) onEmpSaved({});
            }, 600);
          }}
        />
      )}
      {taskModal && <TaskModal task={taskModal} locMap={locMap || {}} onClose={() => setTaskModal(null)} />}
      {onboardModal && (
        <HROnboardModal
          task={onboardModal}
          roles={roles}
          locations={allLocations}
          session={session}
          onClose={() => setOnboardModal(null)}
          onDone={() => setOnboardModal(null)}
        />
      )}
      <div className="card fade-up d1" style={{ padding: 28, marginBottom: 20 }}>
        <CH
          title="Operational Health Trend"
          sub={`Health score: live · Tasks: ${cmpMap[date]}`}
          icon="trend"
          right={
            <div style={{ display: "flex", gap: 4 }}>
              {Object.entries(heroModes).map(([k, v]) => (
                <button
                  key={k}
                  onClick={() => setOverlay(k)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1px solid",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: overlay === k ? "var(--ink)" : "transparent",
                    color: overlay === k ? "#fff" : "var(--sub)",
                    borderColor: overlay === k ? "var(--ink)" : "var(--border)",
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          }
        />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 52, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.04em" }}>
            {hm.val}
            {hm.sfx}
          </div>
          {hm.delta !== null && (
            <div style={{ marginBottom: 8 }}>
              <span className={`badge badge-${hm.delta >= 0 ? "g" : "r"}`}>{hm.delta >= 0 ? "↑" : "↓"} {Math.abs(hm.delta)}{hm.sfx} vs yesterday</span>
            </div>
          )}
        </div>
        <div style={{ margin: "0 -4px 22px" }}>
          <AreaChart data={hm.data} color={hm.color} h={116} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "var(--divider)", borderRadius: 10, overflow: "hidden" }}>
          {[
            { l: "Worst location", v: worstLoc?.location_name || "—", c: "var(--neg)", page: "tower" },
            { l: "Best location", v: bestLoc?.location_name || "—", c: "var(--pos)", page: "tower" },
            { l: "HQ open actions", v: `${hqTasks.length} tasks`, c: "var(--warn)", page: "tower" },
          ].map((c) => (
            <div key={c.l} className="rh" style={{ background: "var(--card)", padding: "14px 18px" }} onClick={() => setPage(c.page)}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{c.l}</div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: c.c }}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 20 }}>
        {[
          { title: "Critical Tasks", value: overdueTasks.length, sub: `${unclaimedTasks.filter((t) => t.status === "OVERDUE").length} unclaimed overdue`, badge: overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "All clear", bc: overdueTasks.length > 0 ? "r" : "g", icon: "alert", spark: sk(overdueTasks.length), sparkC: "var(--neg)", onClick: () => setPage("tower") },
          { title: "Open Tasks", value: openTasks.length, sub: `${tasks.filter((t) => +t.priority >= 4).length} high priority`, badge: openTasks.length > 0 ? `${openTasks.length} open` : "Queue clear", bc: openTasks.length > 0 ? "o" : "g", icon: "task", spark: sk(openTasks.length), sparkC: "var(--warn)", onClick: () => setPage("tower") },
          { title: "At-Risk Employees", value: atRiskEmps.length, sub: `of ${employees.length} total`, badge: atRiskEmps.length > 0 ? "Needs review" : "All stable", bc: atRiskEmps.length > 0 ? "o" : "g", icon: "user", spark: sk(atRiskEmps.length), sparkC: "var(--warn)", onClick: () => setPage("people") },
          { title: "Location Gaps", value: gapLocs.length, sub: `Avg health: ${avgHealth}%`, badge: gapLocs.length > 0 ? "Below threshold" : "On track", bc: gapLocs.length > 0 ? "r" : "g", icon: "pin", spark: sk(gapLocs.length), sparkC: "var(--neg)", onClick: () => setPage("tower") },
        ].map((c, i) => (
          <div key={c.title} className={`card card-hover fade-up d${i + 2}`} style={{ padding: "22px 24px" }} onClick={c.onClick}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <Icon name={c.icon} size={16} color="var(--muted)" />
              <span className={`badge badge-${c.bc}`}>{c.badge}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 38, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.035em", marginBottom: 6 }}>{c.value}</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)", marginBottom: 3 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "var(--sub)" }}>{c.sub}</div>
            <div style={{ marginTop: 18 }}>
              <SparkLine data={c.spark} color={c.sparkC} w={100} h={24} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
        <div className="card fade-up d2" style={{ padding: 28 }}>
          <CH title="Brand Health" sub={`${filteredLocs.length} location${filteredLocs.length !== 1 ? "s" : ""}${severity !== "all" ? ` · ${severity} filter` : ""}`} icon="trend" right={<span className="badge badge-b">{session?.brand_name || "Brand"}</span>} />
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ScoreRing value={avgHealth} size={80} sw={7} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: "var(--ink)", lineHeight: 1 }}>{avgHealth}%</span>
                <span style={{ fontSize: 9, color: "var(--sub)" }}>Health</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <SparkLine data={sk(avgHealth, 14)} color="#1d6bf3" w={160} h={36} />
            </div>
          </div>
          <KpiRow label="Active employees" value={employees.filter((e) => e.is_active).length} dot="g" />
          <KpiRow label="At-risk employees" value={atRiskEmps.length} badge={atRiskEmps.length > 0 ? "Review needed" : undefined} bc="o" dot={atRiskEmps.length > 0 ? "r" : "g"} />
          <KpiRow label="Overdue tasks" value={overdueTasks.length} badge={overdueTasks.length > 0 ? `${overdueTasks.length} open` : undefined} bc="r" dot={overdueTasks.length > 0 ? "r" : "g"} />
          <KpiRow label="Unclaimed tasks" value={unclaimedTasks.length} dot={unclaimedTasks.length > 0 ? "o" : "g"} />
        </div>
        <div className="card fade-up d2" style={{ padding: 28 }}>
          <CH title="Locations" sub={severity !== "all" ? `Filtered: ${severity} severity` : "Ranked worst-first"} icon="pin" />
          {filteredLocs.sort((a, b) => +a.health_score - +b.health_score).map((l, i) => (
            <div key={l.location_id} className="rh" style={{ padding: "13px 4px", borderBottom: i < filteredLocs.length - 1 ? "1px solid var(--divider)" : "none" }} onClick={() => setPage("tower")}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: hc(+l.health_score || 0), flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>{l.location_name}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 15, color: hc(+l.health_score || 0) }}>{Math.round(+l.health_score || 0)}%</span>
              </div>
              <HealthBar value={+l.health_score || 0} />
              <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
                {+l.missing_doc_tasks > 0 && <span style={{ fontSize: 10.5, color: "var(--neg)", fontWeight: 600, background: "var(--neg-bg)", padding: "1px 7px", borderRadius: 4 }}>{l.missing_doc_tasks} missing docs</span>}
                {+l.overdue_hr_tasks > 0 && <span style={{ fontSize: 10.5, color: "var(--neg)", fontWeight: 600, background: "var(--neg-bg)", padding: "1px 7px", borderRadius: 4 }}>{l.overdue_hr_tasks} HR overdue</span>}
                {+l.overdue_tasks > 0 && <span style={{ fontSize: 10.5, color: "#d97706", fontWeight: 600, background: "rgba(217,119,6,.08)", padding: "1px 7px", borderRadius: 4 }}>{l.overdue_tasks} overdue tasks</span>}
                {+l.watchdog_critical > 0 && <span style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 500, background: "var(--faint)", padding: "1px 7px", borderRadius: 4 }}>{l.watchdog_critical} watchdog signals</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="card fade-up d3" style={{ padding: 28 }}>
          <CH title="Employee Health" sub="Click row to view full card" icon="user" />
          {filteredEmps.sort((a, b) => +a.overall_score - +b.overall_score).map((e, i) => (
            <div key={e.id} className="rh" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 4px", borderBottom: i < filteredEmps.length - 1 ? "1px solid var(--divider)" : "none" }} onClick={() => setEmpModal(e)}>
              <Avatar name={e.first_name || e.full_name} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{e.full_name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{e.location_name || "HQ"} · {e.role_name || "—"}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: hc(+e.overall_score || 0) }}>{Math.round(+e.overall_score || 0)}%</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card fade-up d3" style={{ padding: 28 }}>
          <CH title="HQ Actions" sub="Click row to view task detail" icon="flag" right={<span className="badge badge-o">{hqTasks.length} open</span>} />
          {tasks.slice(0, 8).map((t, i) => (
            <div key={t.id} className="rh" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: i < 7 ? "1px solid var(--divider)" : "none" }} onClick={() => handleHQTaskClick(t)}>
              <div style={{ width: 3, height: 32, borderRadius: 2, background: t.status === "OVERDUE" ? "var(--neg)" : +t.priority >= 4 ? "var(--warn)" : "var(--divider)", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tLabel(t.task_type_code)}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{(t.assigned_role || "—").replace(/_/g, " ")} · {resolveLocName(t, locMap || {})}</div>
              </div>
              <span className={`badge badge-${t.status === "OVERDUE" ? "r" : t.assigned_to_employee ? "b" : "x"}`} style={{ fontSize: 10 }}>
                {t.status === "OVERDUE" ? "Overdue" : t.assigned_to_employee ? "Claimed" : "Unclaimed"}
              </span>
            </div>
          ))}
          {tasks.length > 8 && <div style={{ padding: "12px 4px", fontSize: 12.5, color: "var(--acc)", cursor: "pointer", fontWeight: 500 }} onClick={() => setPage("tower")}>View all {tasks.length} tasks →</div>}
        </div>
      </div>
    </>
  );
}
