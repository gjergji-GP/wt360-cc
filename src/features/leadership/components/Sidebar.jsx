import { Icon } from "../../../components/common/Icon";

export function LeadershipSidebar({
  page,
  setPage,
  exp,
  setExp,
  reportsOpen,
  setReportsOpen,
  activeReport,
  setActiveReport,
  inboxUnread,
  towerCount,
  tasksDue,
  notifUnread,
  onSignOut,
  reportsTree,
}) {
  const NAV = [
    { id: "home", icon: "home", label: "Command Centre" },
    { id: "tower", icon: "tower", label: "Tower Control", badge: towerCount > 0 ? towerCount : null },
    { id: "tasks", icon: "task", label: "Tasks", badge: tasksDue > 0 ? tasksDue : null, badgeCls: "warn" },
    { id: "inbox", icon: "inbox", label: "Inbox", badge: inboxUnread > 0 ? inboxUnread : null },
    { id: "people", icon: "people", label: "People" },
    { id: "attendance", icon: "clock", label: "Attendance" },
  ];

  return (
    <div className={`sb-wrap ${exp ? "exp" : "col"}`}>
      <div style={{ padding: "16px 8px 8px", flexShrink: 0 }}>
        <div className="si si-tip" style={{ justifyContent: exp ? "flex-start" : "center", cursor: "default" }}>
          <Icon name="menu" size={16} color="var(--sb-sub)" />
          {exp && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 3, flex: 1 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: "#ffffff", letterSpacing: "-0.02em" }}>wt360</span>
              <span style={{ color: "#22c55e", fontSize: 8 }}>●</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {exp && <div className="sb-section">Navigation</div>}
        {NAV.map((n) => (
          <div
            key={n.id}
            className={`si si-tip ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
            style={{ justifyContent: exp ? "flex-start" : "center" }}
          >
            {!exp && <span className="tip">{n.label}</span>}
            <Icon name={n.icon} size={16} color={page === n.id ? "var(--sb-sel)" : "var(--sb-sub)"} />
            {exp && <span style={{ flex: 1 }}>{n.label}</span>}
            {exp && n.badge && <span className={`si-badge ${n.badgeCls || ""}`}>{n.badge}</span>}
            {!exp && n.badge && <span className="dot-badge" />}
          </div>
        ))}
        <div
          className={`si si-tip ${page === "reports" ? "active" : ""}`}
          onClick={() => {
            if (exp) setReportsOpen((v) => !v);
            else setPage("reports");
          }}
          style={{ justifyContent: exp ? "flex-start" : "center" }}
        >
          {!exp && <span className="tip">Reports</span>}
          <Icon name="reports" size={16} color={page === "reports" ? "var(--sb-sel)" : "var(--sb-sub)"} />
          {exp && (
            <>
              <span style={{ flex: 1 }}>Reports</span>
              <Icon name={reportsOpen ? "chevdown" : "chevron"} size={12} color="var(--sb-dim)" />
            </>
          )}
        </div>
        {exp && reportsOpen && (
          <div style={{ paddingBottom: 4 }}>
            {reportsTree.map((sec) => (
              <div key={sec.section}>
                <div className="sb-section" style={{ padding: "10px 18px 4px" }}>{sec.section}</div>
                {sec.items.map((it) => (
                  <div
                    key={it}
                    className={`ss ${activeReport === it ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReport(it);
                      setPage("reports");
                    }}
                  >
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--sb-dim)", flexShrink: 0 }} />
                    {it}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className={`si si-tip ${page === "notif" ? "active" : ""}`} onClick={() => setPage("notif")} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          {!exp && <span className="tip">Notifications</span>}
          <Icon name="bell" size={16} color={page === "notif" ? "var(--sb-sel)" : "var(--sb-sub)"} />
          {exp && (
            <>
              <span style={{ flex: 1 }}>Notifications</span>
              {notifUnread > 0 && <span className="si-badge">{notifUnread}</span>}
            </>
          )}
          {!exp && notifUnread > 0 && <span className="dot-badge" />}
        </div>
      </div>
      <div className="sb-foot">
        <div className="si si-tip" onClick={() => setExp((v) => !v)} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          {!exp && <span className="tip">Collapse</span>}
          <Icon name="menu" size={16} color="var(--sb-sub)" />
          {exp && <span>Collapse</span>}
        </div>
        <div className="si si-tip" onClick={onSignOut} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          {!exp && <span className="tip">Sign out</span>}
          <Icon name="logout" size={16} color="var(--sb-sub)" />
          {exp && <span>Sign out</span>}
        </div>
      </div>
    </div>
  );
}
