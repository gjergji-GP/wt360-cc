import { useState } from "react";
import { SC_REPORTS } from "../config";
import { SCIcon } from "./SCIcon";

export function SCSidebar({
  page,
  setPage,
  exp,
  setExp,
  openAlloc,
  openQuar,
  overdueSLA,
  onSignOut,
  activeReport,
  setActiveReport,
  taskBadge,
}) {
  const [repOpen, setRepOpen] = useState(page === "sc-reports");
  const isRep = page === "sc-reports";

  const nav = [
    { id: "sc-home", icon: "grid", l: "Command Centre" },
    { id: "sc-tasks", icon: "zap", l: "Tasks", badge: taskBadge },
    { id: "sc-quar", icon: "alert", l: "Quarantine", badge: openQuar, bw: overdueSLA > 0 },
    { id: "sc-alloc", icon: "layers", l: "Allocations", badge: openAlloc },
    { id: "sc-recv", icon: "truck", l: "Receiving" },
  ];

  const handleReports = () => {
    setPage("sc-reports");
    if (exp) setRepOpen((current) => !current);
  };

  return (
    <div className={`sc-sb ${exp ? "exp" : "col"}`}>
      <div style={{ padding: "0 14px", height: 64, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,.08)" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "'Inter',-apple-system,sans-serif", letterSpacing: "-.02em" }}>W</span>
        </div>
        {exp && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#dde4f2", letterSpacing: "-.02em", fontFamily: "'Inter',-apple-system,sans-serif" }}>
              wt360 <span style={{ color: "#22c55e" }}>•</span>
            </div>
            <div style={{ fontSize: 9, color: "#4b5a80", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginTop: -1 }}>
              Supply Chain
            </div>
          </div>
        )}
      </div>
      <div className="sc-sep" />
      <div style={{ flex: 1, overflowY: "auto", padding: "0 0 12px" }}>
        {exp && <div className="sc-nav-sec">Operations</div>}
        {nav.map(({ id, icon, l, badge, bw }) => (
          <div key={id} className={`sc-si sc-tip-wrap ${page === id ? "on" : ""}`} onClick={() => setPage(id)} style={{ justifyContent: exp ? "flex-start" : "center" }}>
            <SCIcon n={icon} s={15} c={page === id ? "var(--sc-sb-sel)" : "var(--sc-sb-sub)"} />
            {exp && <span style={{ flex: 1 }}>{l}</span>}
            {exp && badge > 0 && <span className={`sc-badge${bw ? " w" : ""}`}>{badge > 99 ? "99+" : badge}</span>}
            {!exp && badge > 0 && <span className="dot-b" />}
            {!exp && <span className="sc-tip">{l}{badge > 0 ? ` (${badge})` : ""}</span>}
          </div>
        ))}
        {exp && <div className="sc-nav-sec" style={{ marginTop: 4 }}>Reporting</div>}
        <div className={`sc-si sc-tip-wrap ${isRep ? "on" : ""}`} onClick={handleReports} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          <SCIcon n="bar" s={15} c={isRep ? "var(--sc-sb-sel)" : "var(--sc-sb-sub)"} />
          {exp && <span style={{ flex: 1 }}>Reports</span>}
          {exp && <SCIcon n="arr" s={10} c="var(--sc-sb-sub)" style={{ transform: repOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s" }} />}
          {!exp && <span className="sc-tip">Reports</span>}
        </div>
        {exp && repOpen && (
          <div style={{ margin: "2px 8px 4px 8px", background: "rgba(255,255,255,.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,.05)", overflow: "hidden" }}>
            {SC_REPORTS.map((section) => (
              <div key={section.sec}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#404870", padding: "10px 14px 4px", userSelect: "none" }}>{section.sec}</div>
                {section.items.map((item) => (
                  <div
                    key={item}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveReport(item);
                      setPage("sc-reports");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 14px",
                      cursor: "pointer",
                      borderRadius: 7,
                      margin: "0 4px 1px",
                      background: activeReport === item ? "rgba(96,165,250,.12)" : "transparent",
                      color: activeReport === item ? "#60a5fa" : "#6b789e",
                      fontSize: 12,
                      fontWeight: activeReport === item ? 600 : 400,
                      transition: "background .08s,color .08s",
                    }}
                  >
                    <span style={{ fontSize: 10, opacity: 0.6 }}>›</span>
                    <span style={{ flex: 1, lineHeight: 1.3 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {exp && <div className="sc-nav-sec" style={{ marginTop: 4 }}>System</div>}
        <div className={`sc-si sc-tip-wrap ${page === "sc-notif" ? "on" : ""}`} onClick={() => setPage("sc-notif")} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          <SCIcon n="bell" s={15} c={page === "sc-notif" ? "var(--sc-sb-sel)" : "var(--sc-sb-sub)"} />
          {exp && <span style={{ flex: 1 }}>Notifications</span>}
          {!exp && <span className="sc-tip">Notifications</span>}
        </div>
        <div className="sc-sep" style={{ margin: "12px 0" }} />
      </div>
      <div className="sc-sb-foot">
        <div className="sc-si sc-tip-wrap" onClick={() => setExp(!exp)} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          <SCIcon n="menu" s={15} c="var(--sc-sb-sub)" />
          {exp && <span>Collapse</span>}
          {!exp && <span className="sc-tip">Expand</span>}
        </div>
        <div className="sc-si sc-tip-wrap" onClick={onSignOut} style={{ justifyContent: exp ? "flex-start" : "center" }}>
          <SCIcon n="logout" s={15} c="var(--sc-sb-sub)" />
          {exp && <span>Sign out</span>}
          {!exp && <span className="sc-tip">Sign out</span>}
        </div>
      </div>
    </div>
  );
}
