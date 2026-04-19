import { useState } from "react";

export function RMTeam({ session, team, onboardReqs, offboardReqs, onReload, deps }) {
  const { RMOnboardModal, RMOffboardModal, RMCard, RMSectionLabel, RMStatusBadge, ROLE_OPTIONS, DEPT_OPTIONS, RM_EMP_TYPES, RM_OFFBOARD_REASONS, RMField } = deps;
  const [onboardTarget, setOnboardTarget] = useState(null);
  const [offboardTarget, setOffboardTarget] = useState(null);
  const [toast, setToast] = useState("");

  const done = (code) => {
    setOnboardTarget(null);
    setOffboardTarget(null);
    setToast(`Request ${code} submitted â€” HR has been notified.`);
    onReload();
    setTimeout(() => setToast(""), 5000);
  };

  const activeTeam = team.filter((employee) => employee.is_active !== false);
  const openOnboard = onboardReqs.filter((request) => !["ACTIVE", "REJECTED", "CANCELLED"].includes(request.status));
  const openOffboard = offboardReqs.filter((request) => !["EXECUTED", "REJECTED", "CANCELLED"].includes(request.status));

  return (
    <div>
      {toast && <div className="rm-toast">{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--wt-ink)" }}>Team</div>
          <div style={{ fontSize: 12, color: "var(--wt-muted)", marginTop: 2 }}>{session.location_name} Â· {activeTeam.length} active members</div>
        </div>
        <button onClick={() => setOnboardTarget("new")} className="rm-btn-p">
          + Request New Hire
        </button>
      </div>

      <RMCard style={{ marginBottom: 20 }}>
        <RMSectionLabel text={`Active Members (${activeTeam.length})`} />
        {activeTeam.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--wt-muted)", padding: "16px 0" }}>No active team members at this location.</div>
        ) : (
          <table className="rm-tbl">
            <thead>
              <tr>
                {["Name", "Role", "Dept", "Type", "Status", ""].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTeam.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div className="rm-avatar">{(employee.first_name || employee.full_name || "?")[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--wt-ink)" }}>{employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim()}</div>
                        <div style={{ fontSize: 11, color: "var(--wt-muted)" }}>{employee.email || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.role_name || employee.role_code || "â€”"}</td>
                  <td>{employee.department || "â€”"}</td>
                  <td>{(employee.employment_type || "â€”").replace(/_/g, " ")}</td>
                  <td><RMStatusBadge status={employee.is_active ? "ACTIVE" : "INACTIVE"} /></td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => setOffboardTarget(employee)} className="wt-btn wt-btn-d wt-btn-sm" style={{ fontSize: 11 }}>
                      Offboard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RMCard>

      {(openOnboard.length + openOffboard.length) > 0 && (
        <RMCard style={{ marginTop: 16 }}>
          <RMSectionLabel text="Open Requests" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[...openOnboard.map((request) => ({ ...request, _type: "onboard" })), ...openOffboard.map((request) => ({ ...request, _type: "offboard" }))].map((request) => (
              <div key={request.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--wt-divider)" }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--wt-muted)", width: 90, flexShrink: 0 }}>{request.request_code}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wt-ink)" }}>
                    {request._type === "onboard" ? `${request.candidate_first_name} ${request.candidate_last_name}` : request.employees?.full_name || "â€”"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--wt-muted)" }}>
                    {request._type === "onboard" ? request.requested_role_code?.replace(/_/g, " ") : request.reason_code?.replace(/_/g, " ")} Â· {request._type === "onboard" ? "Onboarding" : "Offboarding"}
                  </div>
                </div>
                <RMStatusBadge status={request.status} />
              </div>
            ))}
          </div>
        </RMCard>
      )}

      {onboardTarget && <RMOnboardModal session={session} onClose={() => setOnboardTarget(null)} onDone={done} deps={{ ROLE_OPTIONS, RMField, RMSectionLabel, RM_EMP_TYPES, DEPT_OPTIONS }} />}
      {offboardTarget && <RMOffboardModal session={session} employee={offboardTarget} onClose={() => setOffboardTarget(null)} onDone={done} deps={{ RM_OFFBOARD_REASONS, RMField, RMSectionLabel }} />}
    </div>
  );
}
