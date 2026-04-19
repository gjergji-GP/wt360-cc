import { useEffect, useMemo, useState } from "react";
import { SB } from "../../lib/supabase";

function RMAttendanceGrid({ activeTeam, checkins, lines, monday, deps }) {
  const { RMCard, RM_DAYS } = deps;
  const ciMap = {};
  checkins.forEach((checkin) => {
    const date = new Date(checkin.checked_in_at);
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    if (!ciMap[checkin.employee_id]) ciMap[checkin.employee_id] = {};
    if (!ciMap[checkin.employee_id][dayOfWeek]) ciMap[checkin.employee_id][dayOfWeek] = checkin;
  });

  const fmtTime = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Tirane" });
  };

  const cellMeta = (employeeId, dayOfWeek) => {
    const line = lines[`${employeeId}_${dayOfWeek}`];
    const checkin = ciMap[employeeId]?.[dayOfWeek];
    const today = new Date();
    const cellDate = new Date(monday);
    cellDate.setDate(cellDate.getDate() + dayOfWeek - 1);
    const isFuture = cellDate > today;
    const isToday = cellDate.toDateString() === today.toDateString();
    if (line?.is_day_off) return { type: "off" };
    if (!line) return { type: "unscheduled" };
    if (isFuture) return { type: "future", sched: line.shift_start?.slice(0, 5) };
    if (!checkin) {
      if (isToday) return { type: "pending", sched: line.shift_start?.slice(0, 5) };
      return { type: "absent", sched: line.shift_start?.slice(0, 5) };
    }
    const late = Math.round(+(checkin.late_minutes || 0));
    return {
      type: late > 0 ? "late" : "ontime",
      late,
      sched: line.shift_start?.slice(0, 5),
      checkin: fmtTime(checkin.checked_in_at),
      checkout: checkin.checked_out_at ? fmtTime(checkin.checked_out_at) : isToday ? "On shift" : null,
    };
  };

  const colors = {
    off: { bg: "var(--wt-bg)", color: "var(--wt-muted)", border: "var(--wt-border)" },
    unscheduled: { bg: "var(--wt-bg)", color: "var(--wt-muted)", border: "var(--wt-border)" },
    future: { bg: "var(--wt-surface)", color: "var(--wt-muted)", border: "var(--wt-border)" },
    pending: { bg: "#fefce8", color: "#a16207", border: "#fde68a" },
    absent: { bg: "var(--wt-neg-bg)", color: "var(--wt-neg)", border: "var(--wt-neg)" },
    ontime: { bg: "var(--wt-pos-bg)", color: "var(--wt-pos)", border: "var(--wt-pos)" },
    late: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  };

  const summaryMap = {};
  activeTeam.forEach((employee) => {
    const employeeId = employee.employee_id || employee.id;
    const employeeCheckins = Object.values(ciMap[employeeId] || {});
    summaryMap[employeeId] = {
      total: employeeCheckins.length,
      late: employeeCheckins.filter((row) => +(row.late_minutes || 0) > 0).length,
      avg: employeeCheckins.length ? Math.round(employeeCheckins.reduce((acc, row) => acc + (+(row.late_minutes || 0)), 0) / employeeCheckins.length) : 0,
    };
  });

  return (
    <RMCard style={{ overflowX: "auto", padding: 0 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
        <thead>
          <tr style={{ background: "var(--wt-bg)" }}>
            <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", width: 160, borderBottom: "1px solid var(--wt-border)" }}>EMPLOYEE</th>
            {RM_DAYS.map((day, index) => {
              const date = new Date(monday);
              date.setDate(date.getDate() + index);
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <th key={day} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: isToday ? "var(--wt-acc)" : "var(--wt-muted)", borderBottom: "1px solid var(--wt-border)", minWidth: 90 }}>
                  {day.toUpperCase()}
                  <div style={{ fontSize: 10, fontWeight: isToday ? 700 : 400, marginTop: 2 }}>{date.getDate()}</div>
                </th>
              );
            })}
            <th style={{ padding: "10px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", borderBottom: "1px solid var(--wt-border)", minWidth: 80 }}>WEEK</th>
          </tr>
        </thead>
        <tbody>
          {activeTeam.length === 0 ? (
            <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: "var(--wt-muted)", fontSize: 13 }}>No active team members.</td></tr>
          ) : activeTeam.map((employee) => {
            const employeeId = employee.employee_id || employee.id;
            const summary = summaryMap[employeeId] || {};
            return (
              <tr key={employeeId} style={{ borderBottom: "1px solid var(--wt-divider)" }}>
                <td style={{ padding: "8px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wt-ink)" }}>{employee.first_name || employee.full_name?.split(" ")[0] || "â€”"}</div>
                  <div style={{ fontSize: 10, color: "var(--wt-muted)" }}>{employee.role_name || employee.role_code || ""}</div>
                </td>
                {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
                  const meta = cellMeta(employeeId, dayOfWeek);
                  const color = colors[meta.type] || colors.unscheduled;
                  return (
                    <td key={dayOfWeek} style={{ padding: "4px" }}>
                      <div style={{ borderRadius: 7, border: `1px solid ${color.border}`, background: color.bg, padding: "5px 6px", minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        {meta.type === "off" && <span style={{ fontSize: 10, fontWeight: 600, color: color.color }}>OFF</span>}
                        {meta.type === "unscheduled" && <span style={{ fontSize: 10, color: color.color }}>â€”</span>}
                        {meta.type === "future" && <><span style={{ fontSize: 11, fontWeight: 600, color: color.color }}>{meta.sched || "â€”"}</span><span style={{ fontSize: 9, color: color.color }}>scheduled</span></>}
                        {meta.type === "pending" && <><span style={{ fontSize: 11, fontWeight: 700, color: color.color }}>{meta.sched || "â€”"}</span><span style={{ fontSize: 9, color: color.color }}>not in yet</span></>}
                        {meta.type === "absent" && <><span style={{ fontSize: 11, fontWeight: 700, color: color.color }}>ABSENT</span><span style={{ fontSize: 9, color: color.color }}>sched {meta.sched}</span></>}
                        {(meta.type === "ontime" || meta.type === "late") && <>
                          <span style={{ fontSize: 11, fontWeight: 700, color: color.color }}>{meta.checkin}</span>
                          {meta.type === "late" && <span style={{ fontSize: 9, fontWeight: 700, color: color.color }}>{meta.late}m late</span>}
                          {meta.type === "ontime" && <span style={{ fontSize: 9, color: color.color }}>on time</span>}
                          <span style={{ fontSize: 9, color: "var(--wt-muted)" }}>{meta.checkout || ""}</span>
                        </>}
                      </div>
                    </td>
                  );
                })}
                <td style={{ padding: "4px 6px" }}>
                  <div style={{ borderRadius: 7, border: "1px solid var(--wt-border)", background: "var(--wt-surface)", padding: "5px 8px", minHeight: 52, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--wt-ink)" }}>{summary.total || 0}<span style={{ fontSize: 10, fontWeight: 400, color: "var(--wt-muted)" }}> shifts</span></span>
                    {summary.late > 0 ? <span style={{ fontSize: 10, fontWeight: 600, color: "#c2410c" }}>{summary.late}Ã— late</span> : <span style={{ fontSize: 10, color: "var(--wt-pos)" }}>âœ“ punctual</span>}
                    {summary.avg > 0 && <span style={{ fontSize: 9, color: "var(--wt-muted)" }}>avg {summary.avg}m</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </RMCard>
  );
}

export function RMShifts({ session, team, deps }) {
  const { rmGetMonday, rmToISO, rmWeekLabel, RMCard, RMStatusBadge, RM_DAYS } = deps;
  const [weekOffset, setWeekOffset] = useState(0);
  const [tab, setTab] = useState("schedule");
  const [sched, setSched] = useState(null);
  const [lines, setLines] = useState({});
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ciLoading, setCiLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const monday = useMemo(() => {
    const date = rmGetMonday();
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [rmGetMonday, weekOffset]);
  const weekISO = useMemo(() => rmToISO(monday), [monday, rmToISO]);
  const activeTeam = team.filter((employee) => employee.is_active !== false);

  const fetchCheckins = () => {
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 7);
    setCiLoading(true);
    SB.from("shift_checkins")
      .select("id,employee_id,checked_in_at,checked_out_at,scheduled_start_at,late_minutes,duration_minutes,geo_verified_in,is_frozen")
      .eq("location_id", session.home_location_id)
      .gte("checked_in_at", monday.toISOString())
      .lt("checked_in_at", weekEnd.toISOString())
      .order("checked_in_at", { ascending: true })
      .then(({ data: ci }) => {
        setCheckins(ci || []);
        setLastRefresh(new Date());
        setCiLoading(false);
      });
  };

  useEffect(() => {
    let live = true;
    setLoading(true);
    const rangeStart = new Date(monday);
    rangeStart.setDate(rangeStart.getDate() - 1);
    const rangeEnd = new Date(monday);
    rangeEnd.setDate(rangeEnd.getDate() + 6);
    SB.from("shift_schedules")
      .select("*")
      .eq("location_id", session.home_location_id)
      .gte("week_start", rmToISO(rangeStart))
      .lte("week_start", rmToISO(rangeEnd))
      .eq("status", "PUBLISHED")
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: schedule }) => {
        if (!live) return;
        setSched(schedule || null);
        if (!schedule) {
          setLines({});
          setLoading(false);
          return;
        }
        SB.from("shift_schedule_lines")
          .select("*")
          .eq("schedule_id", schedule.id)
          .then(({ data: scheduleLines }) => {
            if (!live) return;
            const map = {};
            (scheduleLines || []).forEach((line) => {
              map[`${line.employee_id}_${line.day_of_week}`] = line;
            });
            setLines(map);
            setLoading(false);
          });
      });

    fetchCheckins();

    return () => { live = false; };
  }, [monday, rmToISO, session.home_location_id, weekISO]);

  useEffect(() => {
    if (tab !== "attendance") return undefined;
    const timer = setInterval(() => fetchCheckins(), 60000);
    return () => clearInterval(timer);
  }, [monday, session.home_location_id, tab, weekISO]);

  const getLine = (employeeId, dayOfWeek) => lines[`${employeeId}_${dayOfWeek}`];

  const updateCell = async (employeeId, dayOfWeek, patch) => {
    const key = `${employeeId}_${dayOfWeek}`;
    const existing = lines[key];
    setLines((prev) => ({ ...prev, [key]: { ...existing, ...patch, employee_id: employeeId, day_of_week: dayOfWeek } }));

    let scheduleId = sched?.id;
    if (!scheduleId) {
      const { data: newSchedule } = await SB.from("shift_schedules").insert({
        brand_id: session.brand_id,
        location_id: session.home_location_id,
        week_start: weekISO,
        status: "DRAFT",
        created_by: session.id,
      }).select("id").single();
      scheduleId = newSchedule?.id;
      setSched({ id: scheduleId, status: "DRAFT", week_start: weekISO });
    }

    const payload = {
      schedule_id: scheduleId,
      employee_id: employeeId,
      brand_id: session.brand_id,
      location_id: session.home_location_id,
      day_of_week: dayOfWeek,
      ...patch,
    };
    if (existing?.id) {
      await SB.from("shift_schedule_lines").update(patch).eq("id", existing.id);
    } else {
      const { data: newLine } = await SB.from("shift_schedule_lines").insert(payload).select("id").single();
      setLines((prev) => ({ ...prev, [key]: { ...prev[key], id: newLine?.id } }));
    }
  };

  const publishSchedule = async () => {
    if (!sched?.id) {
      setMsg("Create at least one shift first.");
      return;
    }
    setBusy(true);
    const { error } = await SB.from("shift_schedules")
      .update({ status: "PUBLISHED", published_by: session.id, published_at: new Date().toISOString() })
      .eq("id", sched.id);
    if (error) setMsg(error.message);
    else {
      setSched((prev) => ({ ...prev, status: "PUBLISHED" }));
      setMsg("Schedule published.");
    }
    setBusy(false);
    setTimeout(() => setMsg(""), 4000);
  };

  const CellEditor = ({ employeeId, dayOfWeek }) => {
    const line = getLine(employeeId, dayOfWeek);
    const isOff = line?.is_day_off === true;
    const [open, setOpen] = useState(false);
    const [start, setStart] = useState(line?.shift_start || "");
    const [end, setEnd] = useState(line?.shift_end || "");

    const save = async () => {
      await updateCell(employeeId, dayOfWeek, { shift_start: start || null, shift_end: end || null, is_day_off: false });
      setOpen(false);
    };
    const markOff = async () => {
      await updateCell(employeeId, dayOfWeek, { shift_start: null, shift_end: null, is_day_off: true });
      setOpen(false);
    };
    const clear = async () => {
      const key = `${employeeId}_${dayOfWeek}`;
      const existing = lines[key];
      if (existing?.id) {
        await SB.from("shift_schedule_lines").delete().eq("id", existing.id);
      }
      setLines((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setOpen(false);
    };

    const cellStyle = {
      padding: "5px 6px",
      borderRadius: 6,
      fontSize: 11,
      cursor: "pointer",
      textAlign: "center",
      minHeight: 36,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--wt-border)",
      background: isOff ? "var(--wt-bg)" : (line?.shift_start ? "var(--wt-pos-bg)" : "var(--wt-surface)"),
      color: isOff ? "var(--muted)" : (line?.shift_start ? "var(--wt-pos)" : "var(--muted)"),
      position: "relative",
    };

    return (
      <div style={{ position: "relative" }}>
        <div style={cellStyle} onClick={() => sched?.status !== "PUBLISHED" && setOpen((current) => !current)}>
          {isOff ? (
            <span style={{ fontSize: 10, fontWeight: 600 }}>OFF</span>
          ) : line?.shift_start ? (
            <>
              <span style={{ fontWeight: 700 }}>{line.shift_start.slice(0, 5)}</span>
              <span style={{ fontSize: 10 }}>{line.shift_end?.slice(0, 5) || ""}</span>
            </>
          ) : (
            <span style={{ fontSize: 18, color: "var(--border)" }}>+</span>
          )}
        </div>
        {open && (
          <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "var(--wt-surface)", border: "1px solid var(--wt-border)", borderRadius: 9, padding: 12, boxShadow: "0 8px 24px rgba(0,0,0,.12)", minWidth: 160 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", marginBottom: 8 }}>Set Shift</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              <input type="time" value={start} onChange={(event) => setStart(event.target.value)} style={{ padding: "5px 8px", border: "1px solid var(--wt-border)", borderRadius: 5, fontSize: 12 }} placeholder="Start" />
              <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} style={{ padding: "5px 8px", border: "1px solid var(--wt-border)", borderRadius: 5, fontSize: 12 }} placeholder="End" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button onClick={save} style={{ padding: "5px", background: "var(--wt-ink)", color: "#fff", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Save</button>
              <button onClick={markOff} style={{ padding: "5px", background: "var(--wt-bg)", color: "var(--wt-muted)", border: "1px solid var(--wt-border)", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>Mark Day Off</button>
              {line && <button onClick={clear} style={{ padding: "5px", background: "var(--wt-neg-bg)", color: "var(--wt-neg)", border: "none", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>Clear</button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--wt-ink)" }}>Shifts</div>
          <div style={{ fontSize: 12, color: "var(--wt-muted)", marginTop: 2 }}>{rmWeekLabel(monday)}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setWeekOffset((prev) => prev - 1)} style={{ padding: "7px 12px", border: "1px solid var(--wt-border)", borderRadius: 7, background: "var(--wt-surface)", cursor: "pointer", fontSize: 13 }}>â†</button>
          <button onClick={() => setWeekOffset(0)} style={{ padding: "7px 12px", border: "1px solid var(--wt-border)", borderRadius: 7, background: "var(--wt-surface)", cursor: "pointer", fontSize: 12 }}>This Week</button>
          <button onClick={() => setWeekOffset((prev) => prev + 1)} style={{ padding: "7px 12px", border: "1px solid var(--wt-border)", borderRadius: 7, background: "var(--wt-surface)", cursor: "pointer", fontSize: 13 }}>â†’</button>
          {sched && <RMStatusBadge status={sched.status} />}
          {tab === "schedule" && sched?.status !== "PUBLISHED" && (
            <button onClick={publishSchedule} disabled={busy} className="rm-btn-p">
              {busy ? "Publishingâ€¦" : "Publish Schedule"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid var(--wt-border)" }}>
        {[{ id: "schedule", label: "Schedule" }, { id: "attendance", label: "Attendance" }].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ padding: "8px 20px", border: "none", borderBottom: tab === item.id ? "2px solid var(--wt-acc)" : "2px solid transparent", background: "none", fontSize: 13, fontWeight: tab === item.id ? 700 : 500, color: tab === item.id ? "var(--wt-acc)" : "var(--wt-muted)", cursor: "pointer", transition: "all .15s", marginBottom: -1 }}>
            {item.label}
          </button>
        ))}
      </div>

      {msg && <div style={{ marginBottom: 12, padding: "8px 14px", background: "var(--wt-pos-bg)", border: "1px solid #bbf7d0", borderRadius: 7, fontSize: 12, color: "var(--wt-pos)", fontWeight: 600 }}>{msg}</div>}
      {tab === "schedule" && sched?.status === "PUBLISHED" && <div style={{ marginBottom: 12, padding: "8px 14px", background: "var(--wt-acc-bg)", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, color: "var(--wt-acc)" }}>This schedule is published. Changes require republishing.</div>}
      {tab === "attendance" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "var(--wt-muted)" }}>
            Auto-refreshes every 60s
            {lastRefresh && <span> Â· Last updated {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          </div>
          <button onClick={fetchCheckins} disabled={ciLoading} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "1px solid var(--wt-border)", background: "var(--wt-surface)", fontSize: 12, color: "var(--wt-muted)", cursor: ciLoading ? "not-allowed" : "pointer" }}>
            {ciLoading ? "Refreshingâ€¦" : "â†» Refresh"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--wt-muted)" }}>Loadingâ€¦</div>
      ) : tab === "schedule" ? (
        <RMCard style={{ overflowX: "auto", padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ background: "var(--wt-bg)" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", width: 160, borderBottom: "1px solid var(--wt-border)" }}>EMPLOYEE</th>
                {RM_DAYS.map((day, index) => (
                  <th key={day} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", borderBottom: "1px solid var(--wt-border)", minWidth: 80 }}>
                    {day.toUpperCase()}
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                      {(() => { const date = new Date(monday); date.setDate(date.getDate() + index); return date.getDate(); })()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTeam.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "var(--wt-muted)", fontSize: 13 }}>No active team members.</td></tr>
              ) : activeTeam.map((employee) => (
                <tr key={employee.id} style={{ borderBottom: "1px solid var(--wt-divider)" }}>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wt-ink)" }}>{employee.first_name || employee.full_name?.split(" ")[0] || "â€”"}</div>
                    <div style={{ fontSize: 10, color: "var(--wt-muted)" }}>{employee.role_name || employee.role_code || ""}</div>
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
                    <td key={dayOfWeek} style={{ padding: "4px 4px" }}>
                      <CellEditor employeeId={employee.id} dayOfWeek={dayOfWeek} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </RMCard>
      ) : (
        <RMAttendanceGrid activeTeam={activeTeam} checkins={checkins} lines={lines} monday={monday} deps={{ RMCard, RM_DAYS }} />
      )}
    </div>
  );
}
