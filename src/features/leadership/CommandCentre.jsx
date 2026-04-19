import { useCallback, useEffect, useRef, useState } from "react";
import { SB } from "../../lib/supabase";

export function LeadershipCommandCentre({
  session,
  onSignOut,
  components,
  helpers,
}) {
  const {
    Sidebar,
    Header,
    HomePage,
    TowerPage,
    TasksPage,
    InboxPage,
    PeoplePage,
    ReportsPage,
    AttendancePage,
    Icon,
  } = components;
  const { fmtAgo } = helpers;

  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [roles, setRoles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [locMap, setLocMap] = useState({});
  const [page, setPage] = useState("home");
  const [exp, setExp] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("Today");
  const [severity, setSeverity] = useState("all");
  const [notifOpen, setNotifOpen] = useState(false);
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const notifRef = useRef(null);

  const resolveDateRange = useCallback((preset, cRange) => {
    const s = new Date();
    s.setHours(0, 0, 0, 0);
    const e = new Date();
    e.setHours(23, 59, 59, 999);
    if (preset === "Today") return { from: s.toISOString(), to: e.toISOString() };
    if (preset === "Yesterday") {
      s.setDate(s.getDate() - 1);
      e.setDate(e.getDate() - 1);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (preset === "Last 7 days") {
      s.setDate(s.getDate() - 6);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (preset === "Last 30 days") {
      s.setDate(s.getDate() - 29);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (preset === "This month") {
      s.setDate(1);
      return { from: s.toISOString(), to: e.toISOString() };
    }
    if (preset === "Custom" && cRange?.from) {
      const cf = new Date(`${cRange.from}T00:00:00`);
      const ct = cRange.to ? new Date(`${cRange.to}T23:59:59`) : e;
      return { from: cf.toISOString(), to: ct.toISOString() };
    }
    return { from: s.toISOString(), to: e.toISOString() };
  }, []);

  const loadTasks = useCallback(
    async (preset, cRange) => {
      const bid = session?.brand_id;
      if (!bid) return;
      const { from, to } = resolveDateRange(preset, cRange);
      const { data } = await SB.from("tasks")
        .select("*")
        .eq("brand_id", bid)
        .in("status", ["OPEN", "OVERDUE", "IN_PROGRESS", "BLOCKED"])
        .or(`created_at.gte.${from},due_at.gte.${from}`)
        .order("priority", { ascending: false })
        .limit(300);
      if (data) setTasks(data);
    },
    [resolveDateRange, session?.brand_id]
  );

  const loadData = useCallback(async () => {
    const bid = session?.brand_id;
    const [lRes, eRes, tRes, iRes, rRes, locRes, bRes] = await Promise.all([
      SB.rpc("get_hr_location_summary", { p_brand_id: bid }),
      SB.from("v_employee_card").select("*").eq("brand_id", bid),
      SB.from("tasks")
        .select("*")
        .eq("brand_id", bid)
        .in("status", ["OPEN", "OVERDUE", "IN_PROGRESS", "BLOCKED"])
        .order("priority", { ascending: false })
        .limit(200),
      SB.from("org_messages")
        .select("id,subject,body,message_type,sent_at,brand_id,is_pinned,requires_ack,audience_type")
        .eq("brand_id", bid)
        .order("sent_at", { ascending: false })
        .limit(50),
      SB.from("roles").select("id,code,name").order("name"),
      SB.from("locations").select("id,name").eq("brand_id", bid),
      SB.from("brand_configs").select("brand_id,brand_name,brand_slug"),
    ]);

    if (lRes.data) setLocations(lRes.data);
    if (eRes.data) {
      setEmployees(
        eRes.data.map((e) => ({
          ...e,
          id: e.id || e.employee_id,
          home_location_id: e.home_location_id || e.location_id,
          role_id: e.role_id || null,
        }))
      );
    }
    if (tRes.data) setTasks(tRes.data);
    if (iRes.data) {
      setInbox(
        iRes.data.map((m) => ({
          ...m,
          receipt_id: m.id,
          is_unread: false,
          requires_ack_pending: false,
        }))
      );
    }
    if (rRes.data) setRoles(rRes.data);
    if (locRes.data) {
      setAllLocations(locRes.data);
      setLocMap(Object.fromEntries(locRes.data.map((l) => [l.id, l.name])));
    }
    if (bRes.data) setBrands(bRes.data);
  }, [session?.brand_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setSearch("");
  }, [page]);

  useEffect(() => {
    loadTasks(date, customRange);
  }, [customRange, date, loadTasks]);

  useEffect(() => {
    const h = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const inboxUnread = inbox.filter((i) => i.is_unread).length;
  const towerCount = tasks.filter((t) => t.status === "OVERDUE" || !t.assigned_to_employee).length;
  const tasksDue = tasks.filter(
    (t) =>
      t.due_at &&
      new Date(t.due_at).toDateString() === new Date().toDateString() &&
      ["CFO", "COO", "HR_MANAGER", "SYSTEM_ADMIN"].includes(t.assigned_role)
  ).length;
  const notifUnread = inbox.filter((i) => i.is_unread && i.requires_ack_pending).length;
  const sbWidth = exp ? "var(--sbw)" : "var(--sbw-col)";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        page={page}
        setPage={setPage}
        exp={exp}
        setExp={setExp}
        reportsOpen={reportsOpen}
        setReportsOpen={setReportsOpen}
        activeReport={activeReport}
        setActiveReport={(r) => {
          setActiveReport(r);
          setPage("reports");
        }}
        session={session}
        inboxUnread={inboxUnread}
        towerCount={towerCount}
        tasksDue={tasksDue}
        notifUnread={notifUnread}
        onSignOut={onSignOut}
      />
      <div
        style={{
          marginLeft: sbWidth,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left .20s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Header
          page={page}
          search={search}
          setSearch={setSearch}
          date={date}
          setDate={setDate}
          severity={severity}
          setSeverity={setSeverity}
          session={session}
          inboxUnread={inboxUnread}
          notifUnread={notifUnread}
          setNotifOpen={setNotifOpen}
          customRange={customRange}
          setCustomRange={setCustomRange}
          employees={employees}
          tasks={tasks}
          locations={[...locations, ...allLocations]}
        />
        <div className="main-content">
          <div className="page-max" ref={notifRef}>
            {notifOpen && (
              <div style={{ position: "absolute", top: -8, right: 0, zIndex: 900 }}>
                <div className="notif-panel">
                  <div
                    style={{
                      padding: "14px 18px 12px",
                      borderBottom: "1px solid var(--divider)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>Notifications</div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        display: "flex",
                      }}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                  {inbox.slice(0, 8).map((n, i) => (
                    <div
                      key={n.receipt_id}
                      className="rh"
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "12px 18px",
                        borderBottom: i < 7 ? "1px solid var(--divider)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "var(--divider)",
                          flexShrink: 0,
                          marginTop: 5,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--ink)" }}>
                          {n.subject || n.message_type || "Message"}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>
                          {fmtAgo(n.sent_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {inbox.length === 0 && (
                    <div style={{ padding: "24px", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
                      No notifications.
                    </div>
                  )}
                </div>
              </div>
            )}
            {page === "home" && (
              <HomePage
                locations={locations}
                employees={employees}
                tasks={tasks}
                date={date}
                search={search}
                severity={severity}
                session={session}
                setPage={setPage}
                roles={roles}
                allLocations={allLocations}
                locMap={locMap}
                onEmpSaved={() => loadData()}
              />
            )}
            {page === "tower" && (
              <TowerPage
                tasks={tasks}
                locations={locations}
                search={search}
                locMap={locMap}
                roles={roles}
                allLocations={allLocations}
                session={session}
                onRefresh={loadData}
              />
            )}
            {page === "tasks" && (
              <TasksPage
                tasks={tasks}
                search={search}
                locMap={locMap}
                roles={roles}
                locations={allLocations}
                session={session}
                onRefresh={loadData}
              />
            )}
            {page === "inbox" && <InboxPage inbox={inbox} search={search} />}
            {page === "people" && (
              <PeoplePage
                employees={employees}
                tasks={tasks}
                search={search}
                session={session}
                roles={roles}
                locations={allLocations}
                brands={brands}
                onEmpSaved={() => loadData()}
                onRefresh={loadData}
              />
            )}
            {page === "reports" && <ReportsPage activeReport={activeReport} />}
            {page === "attendance" && (
              <AttendancePage
                session={session}
                locations={allLocations}
                brands={brands}
                employees={employees}
                allLocations={allLocations}
              />
            )}
            {page === "notif" && (
              <div style={{ maxWidth: 640 }}>
                <div className="card" style={{ overflow: "hidden" }}>
                  {inbox.length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                      No notifications.
                    </div>
                  ) : (
                    inbox.slice(0, 15).map((n, i) => (
                      <div
                        key={n.receipt_id}
                        style={{
                          display: "flex",
                          gap: 13,
                          padding: "16px 22px",
                          borderBottom: i < 14 && i < inbox.length - 1 ? "1px solid var(--divider)" : "none",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "var(--divider)",
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, color: "var(--ink)" }}>
                            {n.subject || n.message_type || "Message"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                            {fmtAgo(n.sent_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
