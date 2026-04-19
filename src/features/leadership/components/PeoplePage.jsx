import { useState } from "react";
import { SB } from "../../../lib/supabase";

export function LeadershipPeoplePage({
  employees,
  tasks,
  search,
  session,
  roles,
  locations,
  brands,
  onRefresh,
  components,
  helpers,
}) {
  const { EmployeeModal, NewPartnerModal, Avatar, Icon } = components;
  const { hc, fmtFull } = helpers;

  const [empModal, setEmpModal] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const q = search.toLowerCase();
  const filtered = employees.filter((e) => {
    if (!showInactive && e.is_active === false) return false;
    return (
      !q ||
      e.full_name?.toLowerCase().includes(q) ||
      e.location_name?.toLowerCase().includes(q) ||
      e.role_name?.toLowerCase().includes(q)
    );
  });

  const toggleActive = async (employee, newVal, ev) => {
    ev.stopPropagation();
    const eid = employee.employee_id || employee.id;
    setToggling(eid);
    await SB.from("employees").update({ is_active: newVal }).eq("id", eid);
    setToggling(null);
    if (onRefresh) onRefresh();
  };

  return (
    <>
      {empModal && (
        <EmployeeModal
          emp={empModal}
          tasks={tasks}
          roles={roles}
          locations={locations}
          brands={brands}
          onClose={() => setEmpModal(null)}
          onSaved={async () => {
            if (onRefresh) await onRefresh();
            setEmpModal(null);
          }}
          onDeleted={async () => {
            if (onRefresh) await onRefresh();
            setEmpModal(null);
          }}
        />
      )}
      {showNew && (
        <NewPartnerModal
          onClose={() => {
            setShowNew(false);
            if (onRefresh) onRefresh();
          }}
          session={session}
          roles={roles}
          locations={locations}
          brands={brands}
        />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 13, color: "var(--sub)" }}>
            {filtered.length} people · {employees.filter((e) => e.is_active !== false).length} active
          </div>
          <button
            onClick={() => setShowInactive((v) => !v)}
            style={{
              fontSize: 12,
              color: showInactive ? "var(--acc)" : "var(--muted)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "4px 10px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {showInactive ? "Hide inactive" : "Show inactive"}
          </button>
        </div>
        <button
          onClick={() => setShowNew(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            borderRadius: 10,
            border: "none",
            background: "var(--acc)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Icon name="plus" size={14} color="#fff" />
          New Partner
        </button>
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Location</th>
              <th>Dept</th>
              <th>Status</th>
              <th>Work Score</th>
              <th>Profile</th>
              <th>Docs</th>
              <th>Hire Date</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="rh" onClick={() => setEmpModal(e)} style={{ cursor: "pointer" }}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={e.first_name || e.full_name} size={28} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.full_name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{e.email || "—"}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--sub)", fontSize: 12.5 }}>{e.role_name || "—"}</td>
                <td style={{ color: "var(--sub)", fontSize: 12.5 }}>{e.location_name || "HQ"}</td>
                <td style={{ color: "var(--sub)", fontSize: 12.5 }}>{e.department || "—"}</td>
                <td>
                  <span className={`badge badge-${e.is_active ? "g" : "x"}`}>{e.is_active ? "Active" : "Inactive"}</span>
                </td>
                <td style={{ color: hc(+e.overall_score || 0), fontWeight: 700 }}>{Math.round(+e.overall_score || 0)}%</td>
                <td style={{ color: +e.profile_score >= 75 ? "var(--pos)" : +e.profile_score >= 40 ? "var(--warning)" : "var(--neg)", fontWeight: 700 }}>
                  {Math.round(+e.profile_score || 0)}%
                </td>
                <td style={{ fontSize: 12, textAlign: "center" }}>
                  <span title="ID Photo" style={{ color: +e.id_photo_count > 0 ? "var(--pos)" : "var(--neg)" }}>📎</span>{" "}
                  <span title="Health Booklet" style={{ color: +e.health_booklet_count > 0 ? "var(--pos)" : "var(--neg)" }}>📋</span>{" "}
                  <span title="Forensic Report" style={{ color: +e.forensic_report_count > 0 ? "var(--pos)" : "var(--neg)" }}>🔍</span>
                </td>
                <td style={{ color: "var(--muted)", fontSize: 12.5 }}>{fmtFull(e.hire_date)}</td>
                <td onClick={(ev) => ev.stopPropagation()}>
                  <button
                    onClick={(ev) => toggleActive(e, e.is_active === false, ev)}
                    disabled={toggling === (e.employee_id || e.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 7,
                      border: `1px solid ${e.is_active !== false ? "var(--pos)" : "var(--border)"}`,
                      background: e.is_active !== false ? "var(--pos-bg)" : "var(--bg)",
                      color: e.is_active !== false ? "var(--pos)" : "var(--muted)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      opacity: toggling === (e.employee_id || e.id) ? 0.5 : 1,
                      transition: "all .15s",
                    }}
                  >
                    {toggling === (e.employee_id || e.id) ? "..." : e.is_active !== false ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
