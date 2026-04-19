import { useCallback, useEffect, useState } from "react";
import { SB } from "../../lib/supabase";
import { RMHome as ExtractedRMHome } from "./RMHome";
import { RMReceiving as ExtractedRMReceiving } from "./RMReceiving";
import { RMShifts as ExtractedRMShifts } from "./RMShifts";
import { RMTeam as ExtractedRMTeam } from "./RMTeam";
import { RMWaste as ExtractedRMWaste } from "./RMWaste";

export function RestaurantManagerCC({ session, onSignOut, deps }) {
  const { RM_CSS, RMOnboardModal, RMOffboardModal, RMGrnModal, Icon, rmGetMonday, rmToISO, rmWeekLabel, RMCard, RMSectionLabel, RMStatusBadge, RM_DAYS, ROLE_OPTIONS, DEPT_OPTIONS, RM_EMP_TYPES, RM_OFFBOARD_REASONS, RMField } = deps;
  const [page, setPage] = useState("rm-home");
  const [exp, setExp] = useState(true);
  const [team, setTeam] = useState([]);
  const [onboardReqs, setOnboardReqs] = useState([]);
  const [offboardReqs, setOffboardReqs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [receiveTasks, setReceiveTasks] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.home_location_id) return;
    setLoading(true);
    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);
    const [empR, onbR, ofbR, schedR, recvR, wasteR] = await Promise.all([
      SB.from("employees")
        .select("id,full_name,first_name,last_name,email,is_active,role_id,department,employment_type,home_location_id,roles(code,name)")
        .eq("brand_id", session.brand_id)
        .eq("home_location_id", session.home_location_id)
        .order("full_name"),
      SB.from("employee_onboarding_requests")
        .select("*")
        .eq("brand_id", session.brand_id)
        .eq("location_id", session.home_location_id)
        .order("created_at", { ascending: false })
        .limit(50),
      SB.from("employee_offboarding_requests")
        .select("*,employees!employee_offboarding_requests_employee_id_fkey(full_name)")
        .eq("brand_id", session.brand_id)
        .eq("location_id", session.home_location_id)
        .order("created_at", { ascending: false })
        .limit(50),
      SB.from("shift_schedules")
        .select("*")
        .eq("location_id", session.home_location_id)
        .order("week_start", { ascending: false })
        .limit(8),
      SB.from("tasks")
        .select("*")
        .eq("task_type_code", "RECEIVE_DELIVERY")
        .eq("location_id", session.home_location_id)
        .order("created_at", { ascending: false })
        .limit(50),
      SB.from("waste_logs")
        .select("*")
        .eq("brand_id", session.brand_id)
        .eq("location_id", session.home_location_id)
        .gte("waste_date", since7.toISOString().split("T")[0])
        .order("waste_date", { ascending: false })
        .limit(100),
    ]);
    setTeam((empR.data || []).map((employee) => ({ ...employee, role_code: employee.roles?.code || employee.role_code || "", role_name: employee.roles?.name || employee.role_name || "" })));
    setOnboardReqs(onbR.data || []);
    setOffboardReqs(ofbR.data || []);
    setSchedules(schedR.data || []);
    setReceiveTasks(recvR.data || []);
    setWasteLogs(wasteR.data || []);
    setLoading(false);
  }, [session?.brand_id, session?.home_location_id]);

  useEffect(() => {
    load();
  }, [load]);

  const nav = [
    { id: "rm-home", icon: "home", label: "Command Centre" },
    { id: "rm-team", icon: "people", label: "Team" },
    { id: "rm-shifts", icon: "shifts", label: "Shifts" },
    { id: "rm-receive", icon: "receive", label: "Receiving" },
    { id: "rm-waste", icon: "waste", label: "Waste" },
  ];

  const openReceiveCount = receiveTasks.filter((task) => ["OPEN", "CLAIMED", "OVERDUE"].includes(task.status)).length;
  const pendingReqCount =
    onboardReqs.filter((request) => !["ACTIVE", "REJECTED", "CANCELLED"].includes(request.status)).length +
    offboardReqs.filter((request) => !["EXECUTED", "REJECTED", "CANCELLED"].includes(request.status)).length;

  const navIcons = {
    home: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>,
    people: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="5" r="2.5" /><path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" /><circle cx="11.5" cy="5.5" r="2" /><path d="M14.5 13c0-1.933-1.343-3.5-3-3.5" /></svg>,
    shifts: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6.5h12M5 2v2M11 2v2" /></svg>,
    receive: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l6-2 6 2v8l-6 2-6-2V4z" /><path d="M8 2v12M2 4l6 2 6-2" /></svg>,
    waste: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h10M6 5V3.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V5M4 5l.7 7.5a.5.5 0 00.5.5h5.6a.5.5 0 00.5-.5L12 5" /><path d="M6.5 7.5v4M9.5 7.5v4" /></svg>,
  };

  return (
    <div className="rm-root">
      <style>{RM_CSS}</style>
      <aside className={`rm-sb${exp ? "" : " col"}`}>
        <div className="rm-sb-logo">
          <div className="rm-sb-mark"><span className="rm-sb-mark-txt">wt360</span><span className="rm-sb-mark-dot">●</span></div>
          {exp && (
            <div style={{ overflow: "hidden" }}>
              <div className="rm-sb-name">WT360</div>
              <div className="rm-sb-role">{session.location_name || "Restaurant"}</div>
            </div>
          )}
        </div>
        <nav className="rm-nav">
          {nav.map((item) => {
            const badge = item.id === "rm-receive" && openReceiveCount > 0 ? openReceiveCount : item.id === "rm-team" && pendingReqCount > 0 ? pendingReqCount : 0;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} className={`rm-si${page === item.id ? " on" : ""}`}>
                <span className="rm-si-ico">{navIcons[item.icon]}</span>
                {exp && <span style={{ flex: 1, overflow: "hidden" }}>{item.label}</span>}
                {badge > 0 && <span className="rm-si-badge">{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="rm-sb-foot">
          <button onClick={() => setExp((current) => !current)} className="rm-sb-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              {exp ? <path d="M10 8H4M4 8l3-3M4 8l3 3" /> : <path d="M6 8h6M12 8l-3-3M12 8l-3 3" />}
            </svg>
            {exp && <span>Collapse</span>}
          </button>
          <button onClick={onSignOut} className="rm-sb-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M10 6H6a1 1 0 00-1 1v1a1 1 0 001 1h4M10 6l2 2-2 2" /><path d="M7 3H3a1 1 0 00-1 1v8a1 1 0 001 1h4" /></svg>
            {exp && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
      <div className="rm-main">
        <header className="rm-hdr">
          <span className="rm-hdr-title">{nav.find((item) => item.id === page)?.label || ""}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 10, border: "1px solid var(--wt-border)", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(96,165,250,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#60A5FA", flexShrink: 0, border: "1px solid rgba(96,165,250,.2)" }}>
              {(session.full_name || "R")[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--wt-ink)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{session.full_name || "—"}</div>
              <div style={{ fontSize: 10.5, color: "var(--wt-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{session.role_name || "Restaurant Manager"}</div>
            </div>
          </div>
        </header>
        <div className="rm-page">
          <div className="rm-page-inner">
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--wt-muted)", fontSize: 14 }}>Loading…</div>
            ) : (
              <>
                {page === "rm-home" && <ExtractedRMHome session={session} team={team} onboardReqs={onboardReqs} offboardReqs={offboardReqs} schedules={schedules} receiveTasks={receiveTasks} wasteLogs={wasteLogs} deps={{ rmGetMonday, rmToISO, rmWeekLabel, RMCard, RMSectionLabel, RMStatusBadge }} />}
                {page === "rm-team" && <ExtractedRMTeam session={session} team={team} onboardReqs={onboardReqs} offboardReqs={offboardReqs} onReload={load} deps={{ RMOnboardModal, RMOffboardModal, RMCard, RMSectionLabel, RMStatusBadge, ROLE_OPTIONS, DEPT_OPTIONS, RM_EMP_TYPES, RM_OFFBOARD_REASONS, RMField }} />}
                {page === "rm-shifts" && <ExtractedRMShifts session={session} team={team} deps={{ rmGetMonday, rmToISO, rmWeekLabel, RMCard, RMStatusBadge, RM_DAYS }} />}
                {page === "rm-receive" && <ExtractedRMReceiving session={session} receiveTasks={receiveTasks} onReload={load} deps={{ RMGrnModal, Icon, RMStatusBadge }} />}
                {page === "rm-waste" && <ExtractedRMWaste session={session} wasteLogs={wasteLogs} deps={{ RMCard, RMSectionLabel }} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
