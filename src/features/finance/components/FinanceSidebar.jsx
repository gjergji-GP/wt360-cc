import { Icon } from "../../../components/common/Icon";
import { FC_REPORTS } from "../config";

export function FinanceSidebar({
  page,
  setPage,
  exp,
  setExp,
  reportsOpen,
  setReportsOpen,
  activeReport,
  setActiveReport,
  pendingCount,
  flagCount,
  notifCount,
  onSignOut,
}) {
  const nav = [
    { id: "fc-home", icon: "home", label: "Command Centre" },
    { id: "fc-inbox", icon: "inbox", label: "Inbox", badge: pendingCount > 0 ? pendingCount : null },
    { id: "fc-tasks", icon: "task", label: "Tasks", badge: flagCount > 0 ? flagCount : null, badgeCls: "warn" },
    { id: "fc-ledger", icon: "reports", label: "Ledger" },
    { id: "fc-attendance", icon: "clock", label: "Attendance" },
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
        {exp && <div className="sb-section">Finance</div>}
        {nav.map((item) => (
          <div
            key={item.id}
            className={`si si-tip ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
            style={{ justifyContent: exp ? "flex-start" : "center" }}
          >
            {!exp && <span className="tip">{item.label}</span>}
            <Icon name={item.icon} size={16} color={page === item.id ? "var(--sb-sel)" : "var(--sb-sub)"} />
            {exp && <span style={{ flex: 1 }}>{item.label}</span>}
            {exp && item.badge && <span className={`si-badge ${item.badgeCls || ""}`}>{item.badge}</span>}
            {!exp && item.badge && <span className="dot-badge" />}
          </div>
        ))}
        <div
          className={`si si-tip ${page === "fc-reports" ? "active" : ""}`}
          onClick={() => {
            if (exp) setReportsOpen((value) => !value);
            else setPage("fc-reports");
          }}
          style={{ justifyContent: exp ? "flex-start" : "center" }}
        >
          {!exp && <span className="tip">Reports</span>}
          <Icon name="trend" size={16} color={page === "fc-reports" ? "var(--sb-sel)" : "var(--sb-sub)"} />
          {exp && (
            <>
              <span style={{ flex: 1 }}>Reports</span>
              <Icon name={reportsOpen ? "chevdown" : "chevron"} size={12} color="var(--sb-dim)" />
            </>
          )}
        </div>
        {exp && reportsOpen && (
          <div style={{ paddingBottom: 4 }}>
            {FC_REPORTS.map((section) => (
              <div key={section.section}>
                <div className="sb-section" style={{ padding: "10px 18px 4px" }}>{section.section}</div>
                {section.items.map((item) => (
                  <div
                    key={item}
                    className={`ss ${activeReport === item ? "active" : ""}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveReport(item);
                      setPage("fc-reports");
                    }}
                  >
                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--sb-dim)", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className={`si si-tip ${page === "fc-notif" ? "active" : ""}`} onClick={() => setPage("fc-notif")} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          {!exp && <span className="tip">Notifications</span>}
          <Icon name="bell" size={16} color={page === "fc-notif" ? "var(--sb-sel)" : "var(--sb-sub)"} />
          {exp && (
            <>
              <span style={{ flex: 1 }}>Notifications</span>
              {notifCount > 0 && <span className="si-badge">{notifCount}</span>}
            </>
          )}
          {!exp && notifCount > 0 && <span className="dot-badge" />}
        </div>
      </div>
      <div className="sb-foot">
        <div className="si si-tip" onClick={() => setExp((value) => !value)} style={{ justifyContent: exp ? "flex-start" : "center" }}>
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
