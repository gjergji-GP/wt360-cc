import { useEffect, useRef, useState } from "react";

export function LeadershipHeader({
  page,
  search,
  setSearch,
  date,
  setDate,
  severity,
  setSeverity,
  session,
  inboxUnread,
  notifUnread,
  setNotifOpen,
  customRange,
  setCustomRange,
  employees,
  tasks,
  locations,
  components,
  helpers,
}) {
  const { Icon, Avatar, CalendarPicker } = components;
  const { tLabel, datePresets, cmpMap, fmtFull } = helpers;

  const [showCal, setShowCal] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const calRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocus(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const META = {
    home: { title: "Command Centre", sub: "Live organisational health" },
    tower: { title: "Tower Control", sub: "Unresolved cross-role issues and operational alerts" },
    tasks: { title: "Tasks", sub: "HR execution surface" },
    inbox: { title: "Inbox", sub: "Incoming items and approvals" },
    people: { title: "People", sub: "Workforce and partner management" },
    reports: { title: "Reports", sub: "HR leadership reporting" },
    attendance: { title: "Attendance", sub: "Shift check-ins, overrides and payroll tracking" },
    notif: { title: "Notifications", sub: "Event intelligence feed" },
  };
  const m = META[page] || META.home;

  const q = search.trim().toLowerCase();
  const showResults = searchFocus && q.length >= 2;
  const empResults = (employees || [])
    .filter((e) => e.full_name?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q))
    .slice(0, 4);
  const locResults = (locations || [])
    .filter((l) => (l.location_name || l.name || "").toLowerCase().includes(q))
    .slice(0, 3);
  const taskResults = (tasks || [])
    .filter((t) => tLabel(t.task_type_code).toLowerCase().includes(q) || (t.assigned_role || "").toLowerCase().includes(q))
    .slice(0, 3);

  return (
    <div className="hdr-wrap">
      <div className="hdr-row1">
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)", lineHeight: 1.25, letterSpacing: "-0.02em" }}>{m.title}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{m.sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }} ref={searchRef}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--muted)" }}>
              <Icon name="search" size={13} />
            </span>
            <input
              className="g-search"
              placeholder="Search people, locations, tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
            />
            {showResults && (empResults.length > 0 || locResults.length > 0 || taskResults.length > 0) && (
              <div className="search-dropdown">
                {empResults.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>People</div>
                    {empResults.map((e) => (
                      <div key={e.id} className="search-result-item">
                        <Avatar name={e.first_name || e.full_name} size={26} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{e.full_name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{e.role_name || "-"}</div>
                        </div>
                        <span className={`badge badge-${e.is_active ? "g" : "x"}`} style={{ fontSize: 10 }}>
                          {e.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </>
                )}
                {locResults.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Locations</div>
                    {locResults.map((l) => (
                      <div key={l.location_id || l.id} className="search-result-item">
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--acc-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="pin" size={12} color="var(--acc)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{l.location_name || l.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                            {l.health_score != null ? `Health: ${Math.round(+l.health_score)}%` : "Location"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                {taskResults.length > 0 && (
                  <>
                    <div style={{ padding: "8px 14px 4px", fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tasks</div>
                    {taskResults.map((t) => (
                      <div key={t.id} className="search-result-item">
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--warn-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon name="task" size={12} color="var(--warn)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{tLabel(t.task_type_code)}</div>
                          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{t.status}</div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            {showResults && q.length >= 2 && empResults.length === 0 && locResults.length === 0 && taskResults.length === 0 && (
              <div className="search-dropdown">
                <div style={{ padding: "20px 14px", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
                  No results for "{search}"
                </div>
              </div>
            )}
          </div>
          <button className="icon-btn">
            <Icon name="inbox" size={15} />
            {inboxUnread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--warn)", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 100, padding: "1px 5px", lineHeight: 1.7 }}>{inboxUnread}</span>}
          </button>
          <button className="icon-btn" style={{ position: "relative" }} onClick={() => setNotifOpen((o) => !o)}>
            <Icon name="bell" size={15} />
            {notifUnread > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--neg)", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 100, padding: "1px 5px", lineHeight: 1.7 }}>{notifUnread}</span>}
          </button>
          <div style={{ width: 1, height: 24, background: "var(--divider)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 6px", borderRadius: 9 }}>
            <Avatar name={session?.first_name || "?"} size={28} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)", lineHeight: 1.25, whiteSpace: "nowrap" }}>
                {session?.full_name || `${session?.first_name || ""} ${((session?.last_name || "")[0] || "")}.`.trim()}
              </div>
              <div style={{ fontSize: 11, color: "var(--sub)", whiteSpace: "nowrap" }}>{session?.role_name || ""}</div>
            </div>
          </div>
        </div>
      </div>
      {page === "home" && (
        <div className="hdr-row2">
          <button className="brand-chip">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
            {session?.brand_name || "All brands"}
            <Icon name="chevdown" size={11} color="var(--muted)" />
          </button>
          <div style={{ width: 1, height: 20, background: "var(--divider)", flexShrink: 0 }} />
          {datePresets.map((d) => (
            <button
              key={d}
              className={`date-pill ${date === d ? "on" : ""}`}
              onClick={() => {
                if (d === "Custom") {
                  setDate("Custom");
                  setShowCal(true);
                } else {
                  setDate(d);
                  setShowCal(false);
                }
              }}
            >
              {d === "Custom" && date === "Custom" && customRange.from ? fmtFull(customRange.from) + (customRange.to ? ` -> ${fmtFull(customRange.to)}` : "") : d}
            </button>
          ))}
          <span className="cmp-label">{cmpMap[date]}</span>
          <div style={{ flex: 1, minWidth: 16 }} />
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {[{ id: "all", l: "All", cls: "on-all" }, { id: "crit", l: "Critical", cls: "on-crit" }, { id: "warn", l: "Warning", cls: "on-warn" }, { id: "stab", l: "Stable", cls: "on-stab" }].map((s) => (
              <button key={s.id} className={`sev-pill ${severity === s.id ? s.cls : ""}`} onClick={() => setSeverity(s.id)}>
                {s.l}
              </button>
            ))}
          </div>
          {date === "Custom" && showCal && (
            <div ref={calRef} style={{ position: "absolute", top: "calc(100% + 2px)", left: "200px", zIndex: 900 }}>
              <CalendarPicker value={customRange} onChange={(r) => setCustomRange(r)} onClose={() => setShowCal(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
