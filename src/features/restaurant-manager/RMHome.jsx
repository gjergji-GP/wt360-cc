export function RMHome({ session, team, onboardReqs, offboardReqs, schedules, receiveTasks, wasteLogs, deps }) {
  const { rmGetMonday, rmToISO, rmWeekLabel, RMCard, RMSectionLabel, RMStatusBadge } = deps;
  const locName = session.location_name || "My Location";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const activeTeam = team.filter((employee) => employee.is_active !== false);
  const pendingOnboard = onboardReqs.filter((request) => ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFO", "APPROVED_PENDING_CREATION"].includes(request.status));
  const pendingOffboard = offboardReqs.filter((request) => ["SUBMITTED", "UNDER_REVIEW", "APPROVED_PENDING_EXECUTION"].includes(request.status));
  const openReceive = receiveTasks.filter((task) => ["OPEN", "CLAIMED", "OVERDUE"].includes(task.status));
  const thisMonday = rmGetMonday();
  const currentSched = schedules.find((schedule) => {
    const weekStart = new Date(schedule.week_start);
    const weekEnd = new Date(schedule.week_start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const monday = new Date(rmToISO(thisMonday));
    return weekStart <= monday && weekEnd >= monday;
  });
  const wasteTotal = wasteLogs.reduce((sum, row) => sum + (parseFloat(row.total_cost) || 0), 0);

  const KPI = ({ label, value, sub, accent, badge }) => (
    <div className="rm-kpi">
      <div className="rm-kpi-label">{label}</div>
      {badge ? (
        <div style={{ marginTop: 4, marginBottom: 2 }}><RMStatusBadge status={badge} /></div>
      ) : (
        <div className="rm-kpi-val" style={accent ? { color: accent } : {}}>{value}</div>
      )}
      {sub && <div className="rm-kpi-sub">{sub}</div>}
    </div>
  );

  const Urgent = ({ label, count, info = false }) =>
    count > 0 ? (
      <div className={`rm-urgent${info ? " info" : ""}`}>
        <div className="rm-urgent-label">{label}</div>
        <span className="rm-urgent-count">{count}</span>
      </div>
    ) : null;

  return (
    <div>
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--wt-divider)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Location</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--wt-ink)", letterSpacing: "-.02em" }}>{locName}</div>
        <div style={{ fontSize: 13, color: "var(--wt-muted)", marginTop: 2 }}>{today}</div>
      </div>

      {(pendingOnboard.length + pendingOffboard.length + openReceive.length) > 0 && (
        <div style={{ marginBottom: 24 }}>
          <RMSectionLabel text="Requires Attention" />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <Urgent label={`${pendingOnboard.length} onboarding request${pendingOnboard.length !== 1 ? "s" : ""} awaiting HR`} count={pendingOnboard.length} />
            <Urgent label={`${pendingOffboard.length} offboarding request${pendingOffboard.length !== 1 ? "s" : ""} awaiting HR`} count={pendingOffboard.length} />
            <Urgent info label={`${openReceive.length} deliver${openReceive.length !== 1 ? "ies" : "y"} waiting to be received`} count={openReceive.length} />
          </div>
        </div>
      )}

      <div className="rm-kpi-row">
        <KPI label="Active Team" value={activeTeam.length} sub="at this location" />
        <KPI label="Pending Onboarding" value={pendingOnboard.length} sub="awaiting HR" />
        <KPI label="Pending Offboarding" value={pendingOffboard.length} sub="awaiting HR" />
        <KPI label="This Week Schedule" badge={currentSched ? currentSched.status : null} value="—" sub={currentSched ? rmWeekLabel(new Date(currentSched.week_start)) : "No schedule yet"} />
        <KPI label="Waste This Week" value={wasteTotal > 0 ? `${wasteTotal.toLocaleString("en", { maximumFractionDigits: 0 })} L` : "0 L"} sub="total cost" />
        <KPI label="Open Deliveries" value={openReceive.length} sub="to confirm" />
      </div>

      <RMCard style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <RMSectionLabel text="Team Snapshot" />
          <span className="rm-ph-action">View Team →</span>
        </div>
        {activeTeam.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--wt-muted)", padding: "12px 0" }}>No active team members at this location.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {activeTeam.slice(0, 5).map((employee) => (
              <div key={employee.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--wt-divider)" }}>
                <div className="rm-avatar" style={{ width: 32, height: 32, fontSize: 12, fontWeight: 600 }}>
                  {(employee.first_name || employee.full_name || "?")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wt-ink)" }}>{employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim()}</div>
                  <div style={{ fontSize: 11, color: "var(--wt-muted)" }}>{employee.role_name || employee.role_code || "—"} · {employee.department || "—"}</div>
                </div>
                <RMStatusBadge status={employee.is_active ? "ACTIVE" : "INACTIVE"} />
              </div>
            ))}
            {activeTeam.length > 5 && <div style={{ fontSize: 11, color: "var(--wt-muted)", paddingTop: 6 }}>+{activeTeam.length - 5} more — view Team tab</div>}
          </div>
        )}
      </RMCard>

      <RMCard>
        <RMSectionLabel text="Shift Schedule" />
        {currentSched ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <RMStatusBadge status={currentSched.status} />
            <div style={{ fontSize: 13, color: "var(--wt-ink)" }}>{rmWeekLabel(new Date(currentSched.week_start))}</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "var(--wt-warn)" }}>No schedule for the current week. Go to Shifts to create one.</div>
        )}
      </RMCard>
    </div>
  );
}
