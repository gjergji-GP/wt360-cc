import { useEffect, useState } from "react";
import { fmtAgo, fmtFull, tLabel } from "../../lib/leadershipHelpers";
import { SB } from "../../lib/supabase";

const EP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c1f18;--surface:#122b20;--card:#172f24;--card2:#1c3829;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --ink:#f0f4f1;--sub:rgba(240,244,241,0.55);--muted:rgba(240,244,241,0.32);--faint:rgba(240,244,241,0.08);
  --green:#3dd68c;--green-dim:rgba(61,214,140,0.15);--green-glow:rgba(61,214,140,0.08);
  --amber:#f5a623;--amber-dim:rgba(245,166,35,0.15);
  --red:#f05c5c;--red-dim:rgba(240,92,92,0.15);
  --blue:#5b9cf6;--blue-dim:rgba(91,156,246,0.12);
  --f:'Sora',-apple-system,sans-serif;--mono:'JetBrains Mono',monospace;
  --cr:16px;--cr2:12px;
}
body{font-family:var(--f);background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;overscroll-behavior:none}
button{font-family:var(--f);cursor:pointer}
input,select{font-family:var(--f)}
::-webkit-scrollbar{width:0;height:0}
.ep-root{min-height:100vh;max-width:430px;margin:0 auto;background:var(--bg);position:relative;padding-bottom:80px}
.ep-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch}
.ep-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:rgba(18,43,32,0.95);backdrop-filter:blur(20px);border-top:1px solid var(--border2);display:flex;z-index:200;padding:0 4px 2px}
.ep-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 4px 8px;background:none;border:none;color:var(--muted);font-size:9.5px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;transition:color .2s;position:relative}
.ep-nav-item.on{color:var(--green)}
.ep-nav-dot{position:absolute;top:8px;right:calc(50% - 14px);width:5px;height:5px;background:var(--red);border-radius:50%}
.ep-hdr{padding:16px 20px 12px;display:flex;align-items:center;justify-content:space-between}
.ep-logo{display:inline-flex;align-items:baseline;gap:2px}
.ep-logo-g{font-weight:800;font-size:13px;color:var(--ink);letter-spacing:-0.02em}
.ep-logo-p{font-weight:800;font-size:13px;color:var(--green);letter-spacing:-0.02em}
.ep-card{background:var(--card);border:1px solid var(--border);border-radius:var(--cr);padding:20px}
.ep-card2{background:var(--card2);border:1px solid var(--border);border-radius:var(--cr2);padding:16px}
.ep-timer{font-family:var(--mono);font-size:52px;font-weight:500;color:var(--ink);letter-spacing:-0.02em;line-height:1}
.ep-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.ep-stat{background:var(--faint);border-radius:var(--cr2);padding:14px 16px}
.ep-stat-val{font-size:22px;font-weight:700;color:var(--ink);line-height:1.1;letter-spacing:-0.02em}
.ep-stat-lbl{font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-top:5px}
.ep-btn-primary{width:100%;padding:17px;border-radius:14px;border:none;background:var(--green);color:#0c1f18;font-size:15px;font-weight:700;letter-spacing:0.01em;transition:opacity .15s,transform .1s}
.ep-btn-primary:active{opacity:.85;transform:scale(.985)}
.ep-btn-primary:disabled{opacity:.4}
.ep-btn-danger{width:100%;padding:17px;border-radius:14px;border:1px solid var(--red);background:var(--red-dim);color:var(--red);font-size:15px;font-weight:700;letter-spacing:0.01em;transition:opacity .15s}
.ep-btn-danger:active{opacity:.8}
.ep-btn-ghost{padding:9px 18px;border-radius:10px;border:1px solid var(--border2);background:transparent;color:var(--sub);font-size:13px;font-weight:600;transition:all .15s}
.ep-btn-ghost:hover{border-color:var(--green);color:var(--green)}
.ep-ring-wrap{position:relative;display:inline-flex;align-items:center;justify-content:center}
.ep-mood-row{display:flex;gap:8px}
.ep-mood-btn{flex:1;padding:11px 6px;border-radius:12px;border:1px solid var(--border);background:var(--faint);color:var(--sub);font-size:12px;font-weight:600;text-align:center;transition:all .15s}
.ep-mood-btn.sel-tired{border-color:var(--amber);background:var(--amber-dim);color:var(--amber)}
.ep-mood-btn.sel-okay{border-color:var(--blue);background:var(--blue-dim);color:var(--blue)}
.ep-mood-btn.sel-ready{border-color:var(--green);background:var(--green-dim);color:var(--green)}
.ep-bar-track{height:4px;background:var(--faint);border-radius:100px;overflow:hidden;margin-top:6px}
.ep-bar-fill{height:100%;border-radius:100px;transition:width 1.2s cubic-bezier(.4,0,.2,1)}
.ep-tl-dot{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;margin-top:4px}
.ep-tl-dot.dim{background:var(--muted)}
.ep-tl-line{width:1px;background:var(--border2);flex:1;min-height:20px;margin:3px 0 3px 3.5px}
.ep-task-row{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}
.ep-task-row:last-child{border-bottom:none}
.ep-pri{width:3px;border-radius:2px;flex-shrink:0;align-self:stretch}
.ep-msg-row{padding:16px 0;border-bottom:1px solid var(--border);display:flex;gap:12px;cursor:pointer}
.ep-msg-row:last-child{border-bottom:none}
.ep-unread-dot{width:7px;height:7px;border-radius:50%;background:var(--green);flex-shrink:0;margin-top:6px}
.ep-section{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.10em;margin-bottom:12px}
@keyframes ep-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes ep-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes ep-spin{to{transform:rotate(360deg)}}
.ep-fade{animation:ep-up .35s ease both}
.ep-pulse{animation:ep-pulse 2s ease infinite}
.ep-spin{animation:ep-spin .8s linear infinite}
.ep-select{width:100%;background:var(--faint);border:1px solid var(--border2);border-radius:12px;padding:13px 16px;font-size:14px;font-weight:500;color:var(--ink);outline:none;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(240,244,241,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center}
.ep-select option{background:#122b20}
.ep-field-row{padding:14px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.ep-field-row:last-child{border-bottom:none}
.ep-doc-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:100px;font-size:11px;font-weight:600}
`;

const epFmt = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const epColor = (value) => (value >= 70 ? "var(--green)" : value >= 45 ? "var(--amber)" : "var(--red)");
const epMoodEmoji = (mood) => ({ tired: "😮‍💨", okay: "😐", ready: "⚡" }[mood] || "");
const epMoodLabel = (mood) => ({ tired: "Tired", okay: "Okay", ready: "Ready" }[mood] || "");

function EpRing({ value = 0, size = 72, sw = 5, label, sub }) {
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = epColor(value);

  return (
    <div className="ep-ring-wrap" style={{ flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--faint)" strokeWidth={sw} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontWeight: 700, fontSize: size * 0.26, color: "var(--ink)", lineHeight: 1 }}>{Math.round(value)}</span>
          <span style={{ fontSize: size * 0.14, color: "var(--muted)", lineHeight: 1.2 }}>pts</span>
        </div>
      </div>
      {label && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink)" }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

function EpBar({ value = 0, color }) {
  return (
    <div className="ep-bar-track">
      <div className="ep-bar-fill" style={{ width: `${value}%`, background: color || epColor(value) }} />
    </div>
  );
}

function EpStat({ val, lbl, accent }) {
  return (
    <div className="ep-stat">
      <div className="ep-stat-val" style={accent ? { color: accent } : undefined}>
        {val}
      </div>
      <div className="ep-stat-lbl">{lbl}</div>
    </div>
  );
}

function EpIcon({ name, size = 20, color = "currentColor" }) {
  const paths = {
    shift: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" /></>,
    tasks: <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
    team: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    hr: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    out: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "block" }}
    >
      {paths[name]}
    </svg>
  );
}

function EpHeader({ session, onSignOut }) {
  return (
    <div className="ep-hdr">
      <div className="ep-logo">
        <span className="ep-logo-g">green</span>
        <span className="ep-logo-p">protein</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
            {session.first_name || session.full_name?.split(" ")[0]}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 1 }}>{session.role_name}</div>
        </div>
        <button onClick={onSignOut} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid var(--border2)", background: "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
          <EpIcon name="out" size={15} />
        </button>
      </div>
    </div>
  );
}

function EpShift({ employee }) {
  const [shift, setShift] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selLoc, setSelLoc] = useState(employee.home_location_id || "");
  const [locName, setLocName] = useState("");
  const [mood, setMood] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const rate = employee.rate_amount || 0;

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadShift();
    loadLocs();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!shift) return undefined;
    setElapsed(Math.floor((Date.now() - new Date(shift.checked_in_at)) / 1000));
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [shift]);

  async function loadShift() {
    const { data } = await SB.from("shift_checkins").select("*").eq("employee_id", employee.id).is("checked_out_at", null).maybeSingle();
    setShift(data || null);
  }

  async function loadLocs() {
    const { data } = await SB.from("locations").select("id,name").eq("brand_id", employee.brand_id);
    setLocations(data || []);
    if (employee.home_location_id && data) {
      const home = data.find((location) => location.id === employee.home_location_id);
      if (home) {
        setLocName(home.name);
        setSelLoc(home.id);
      }
    }
  }

  const doIn = async () => {
    if (!selLoc) {
      setMsg({ t: "error", v: "Select a location first." });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      const { lat, lng } = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({ lat: 0, lng: 0 });
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          () => resolve({ lat: 0, lng: 0 }),
        );
      });
      const { error } = await SB.rpc("check_in", { p_location_id: selLoc, p_lat: lat, p_lng: lng });
      if (error) throw new Error(error.message);
      await loadShift();
      setMsg({ t: "ok", v: "Shift started. Have a great one!" });
    } catch (error) {
      setMsg({ t: "error", v: error.message });
    }
    setLoading(false);
  };

  const doOut = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { lat, lng } = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({ lat: 0, lng: 0 });
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          () => resolve({ lat: 0, lng: 0 }),
        );
      });
      const { data, error } = await SB.rpc("check_out", { p_lat: lat, p_lng: lng });
      if (error) throw new Error(error.message);
      setEarnings({ hours: data?.duration_hours || 0, gross: data?.gross_earnings || 0 });
      setShift(null);
      setMsg({ t: "ok", v: "Shift ended. Good work today!" });
    } catch (error) {
      setMsg({ t: "error", v: error.message });
    }
    setLoading(false);
  };

  const todayHours = elapsed / 3600;
  const todayEarn = rate ? `${(todayHours * rate).toFixed(0)} ALL` : "-";
  const wkHours = +employee.total_hours || 0;
  const wkEarn = rate ? `${(wkHours * rate).toFixed(0)} ALL` : "-";

  return (
    <div style={{ padding: "0 16px 20px" }} className="ep-fade">
      {msg && (
        <div style={{ margin: "8px 0 16px", padding: "12px 16px", borderRadius: 12, background: msg.t === "error" ? "var(--red-dim)" : "var(--green-dim)", border: `1px solid ${msg.t === "error" ? "var(--red)" : "var(--green)"}`, fontSize: 13.5, color: msg.t === "error" ? "var(--red)" : "var(--green)", fontWeight: 500, lineHeight: 1.5 }}>
          {msg.v}
        </div>
      )}
      {shift ? (
        <>
          <div className="ep-card" style={{ marginBottom: 12, background: "linear-gradient(135deg,#172f24,#1c3829)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} className="ep-pulse" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Live shift</span>
              <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{locName || "On site"}</span>
            </div>
            <div className="ep-timer">{epFmt(elapsed)}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
              Started {new Date(shift.checked_in_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {mood && <span style={{ marginLeft: 12 }}>{epMoodEmoji(mood)} {epMoodLabel(mood)}</span>}
            </div>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column" }}>
              {[{ t: "Checked in", v: new Date(shift.checked_in_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), done: true }, { t: "Working...", v: "", done: false, live: true }, { t: "Check out", v: "", done: false }].map((event, index, items) => (
                <div key={index} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 8 }}>
                    <div className={`ep-tl-dot ${event.done || event.live ? "" : "dim"}`} style={event.live ? { background: "var(--green)" } : undefined} />
                    {index < items.length - 1 && <div className="ep-tl-line" />}
                  </div>
                  <div style={{ paddingBottom: index < items.length - 1 ? 14 : 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: event.done ? 600 : 400, color: event.done ? "var(--ink)" : event.live ? "var(--green)" : "var(--muted)" }}>{event.t}</div>
                    {event.v && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{event.v}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ep-stats" style={{ marginBottom: 12 }}>
            <EpStat val={`${todayHours.toFixed(1)}h`} lbl="Today hours" />
            <EpStat val={todayEarn} lbl="Today est. pay" accent="var(--green)" />
            <EpStat val={`${wkHours.toFixed(1)}h`} lbl="Week hours" />
            <EpStat val={wkEarn} lbl="Week est. pay" accent="var(--green)" />
          </div>

          <button className="ep-btn-danger" onClick={doOut} disabled={loading}>
            {loading ? <span className="ep-spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--red)", borderTopColor: "transparent", borderRadius: "50%" }} /> : "Check Out"}
          </button>
        </>
      ) : (
        <>
          {earnings && (
            <div className="ep-card" style={{ marginBottom: 12, borderColor: "var(--green)", background: "var(--green-dim)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Last Shift Summary</div>
              <div style={{ display: "flex", gap: 16 }}>
                <div><div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{(+earnings.hours).toFixed(1)}h</div><div style={{ fontSize: 10.5, color: "var(--muted)" }}>HOURS</div></div>
                <div style={{ width: 1, background: "var(--border2)" }} />
                <div><div style={{ fontSize: 28, fontWeight: 700, color: "var(--green)" }}>{earnings.gross ? Math.round(+earnings.gross) : 0}</div><div style={{ fontSize: 10.5, color: "var(--muted)" }}>ALL EARNED</div></div>
              </div>
            </div>
          )}

          <div className="ep-card" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Location</div>
            {employee.home_location_id ? (
              <div style={{ background: "var(--faint)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <EpIcon name="pin" size={16} color="var(--green)" />
                <div><div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{locName || "Loading..."}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Home location</div></div>
              </div>
            ) : (
              <select className="ep-select" style={{ marginBottom: 18 }} value={selLoc} onChange={(event) => setSelLoc(event.target.value)}>
                <option value="">Select location...</option>
                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
              </select>
            )}
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>How are you feeling?</div>
            <div className="ep-mood-row" style={{ marginBottom: 20 }}>
              {["tired", "okay", "ready"].map((value) => (
                <button key={value} className={`ep-mood-btn ${mood === value ? `sel-${value}` : ""}`} onClick={() => setMood(mood === value ? null : value)}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{epMoodEmoji(value)}</div>
                  <div>{epMoodLabel(value)}</div>
                </button>
              ))}
            </div>
            <button className="ep-btn-primary" onClick={doIn} disabled={loading || !selLoc}>
              {loading ? <span className="ep-spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #0c1f18", borderTopColor: "transparent", borderRadius: "50%" }} /> : "Check In"}
            </button>
            <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>GPS verification on check-in</div>
          </div>

          <div style={{ marginBottom: 6 }} className="ep-section">Your stats</div>
          <div className="ep-stats" style={{ marginBottom: 10 }}>
            <EpStat val={`${wkHours.toFixed(1)}h`} lbl="This week" />
            <EpStat val={wkEarn} lbl="Week est. pay" accent="var(--green)" />
            <EpStat val={`${Math.round(+employee.punctuality_pct || 0)}%`} lbl="Punctuality" accent={epColor(+employee.punctuality_pct || 0)} />
            <EpStat val={employee.next_scheduled || "-"} lbl="Next shift" />
          </div>
        </>
      )}
    </div>
  );
}

function EpTasks({ employee }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  async function loadTasks() {
    setLoading(true);
    let query = SB.from("tasks").select("*").eq("assigned_to_employee", employee.id).order("priority", { ascending: false }).limit(30);
    if (filter === "pending") query = query.in("status", ["OPEN", "IN_PROGRESS"]);
    else if (filter === "overdue") query = query.eq("status", "OVERDUE");
    else if (filter === "done") query = query.eq("status", "DONE");
    const { data } = await query;
    setTasks(data || []);
    setLoading(false);
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    loadTasks();
  }, [filter]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const complete = async (id) => {
    await SB.from("tasks").update({ status: "DONE", completed_at: new Date().toISOString() }).eq("id", id);
    loadTasks();
  };

  const priorityColor = { 5: "var(--red)", 4: "var(--amber)", 3: "var(--blue)", 2: "var(--muted)", 1: "var(--muted)" };
  const filters = [{ id: "pending", l: "Pending" }, { id: "overdue", l: "Overdue" }, { id: "done", l: "Done" }, { id: "all", l: "All" }];

  return (
    <div style={{ padding: "0 16px 20px" }} className="ep-fade">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>My Tasks</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Assigned to you</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflow: "auto", paddingBottom: 2 }}>
        {filters.map((item) => (
          <button key={item.id} onClick={() => setFilter(item.id)} style={{ padding: "7px 14px", borderRadius: 100, border: "1px solid", fontSize: 12.5, fontWeight: 600, flexShrink: 0, borderColor: filter === item.id ? "var(--green)" : "var(--border2)", background: filter === item.id ? "var(--green-dim)" : "transparent", color: filter === item.id ? "var(--green)" : "var(--muted)" }}>
            {item.l}
          </button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading...</div> : tasks.length === 0 ? <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>Nothing here.</div> : (
        <div>
          {tasks.map((task) => (
            <div key={task.id} className="ep-task-row">
              <div className="ep-pri" style={{ background: priorityColor[task.priority] || "var(--muted)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tLabel(task.task_type_code)}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{fmtAgo(task.due_at)}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 100, background: task.status === "OVERDUE" ? "var(--red-dim)" : "var(--faint)", color: task.status === "OVERDUE" ? "var(--red)" : "var(--muted)", fontWeight: 600 }}>{task.status}</span>
                </div>
              </div>
              {task.status !== "DONE" && <button onClick={() => complete(task.id)} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid var(--border2)", background: "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--muted)" }}><EpIcon name="check" size={14} /></button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EpInbox({ onUnread }) {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await SB.from("v_my_inbox").select("*").order("created_at", { ascending: false }).limit(30);
    const items = data || [];
    setMsgs(items);
    onUnread(items.filter((message) => !message.is_read).length);
    setLoading(false);
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    load();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const markRead = async (message) => {
    if (!message.is_read) await SB.rpc("mark_message_read", { p_message_id: message.message_id }).catch(() => {});
    setSelected(message);
    load();
  };

  const ack = async (message) => {
    await SB.rpc("acknowledge_message", { p_message_id: message.message_id }).catch(() => {});
    setSelected(null);
    load();
  };

  const typeColor = { ALERT: "var(--red)", ANNOUNCEMENT: "var(--green)", GENERAL: "var(--blue)", POLICY: "var(--amber)" };

  if (selected) {
    return (
      <div style={{ padding: "0 16px 20px" }} className="ep-fade">
        <button onClick={() => setSelected(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "var(--muted)", fontSize: 13, fontWeight: 600, marginBottom: 20, padding: 0 }}>
          {"<-"} Back
        </button>
        <div className="ep-card">
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: `${typeColor[selected.msg_type] || "var(--blue)"}22`, color: typeColor[selected.msg_type] || "var(--blue)" }}>{selected.msg_type}</span>
            {!selected.is_read && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: "var(--green-dim)", color: "var(--green)" }}>New</span>}
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--ink)", marginBottom: 6, lineHeight: 1.3 }}>{selected.subject}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 18 }}>{selected.sender_name} · {new Date(selected.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 18 }} />
          <div style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{selected.body}</div>
          {selected.requires_ack && !selected.acknowledged_at && <button className="ep-btn-primary" style={{ marginTop: 24 }} onClick={() => ack(selected)}>Acknowledge</button>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 16px 20px" }} className="ep-fade">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>Inbox</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{msgs.filter((message) => !message.is_read).length} unread</div>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading...</div> : msgs.length === 0 ? <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>All clear.</div> : (
        <div className="ep-card" style={{ padding: "0 16px" }}>
          {msgs.map((message, index) => (
            <div key={message.message_id || index} className="ep-msg-row" onClick={() => markRead(message)}>
              {!message.is_read ? <div className="ep-unread-dot" /> : <div style={{ width: 7, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: message.is_read ? 400 : 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{message.subject}</div>
                  {message.requires_ack && !message.acknowledged_at && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: "var(--amber-dim)", color: "var(--amber)", flexShrink: 0 }}>ACK</span>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 100, background: `${typeColor[message.msg_type] || "var(--blue)"}22`, color: typeColor[message.msg_type] || "var(--blue)", fontWeight: 600 }}>{message.msg_type}</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>{fmtAgo(message.created_at || message.sent_at)}</span>
                </div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: 16, flexShrink: 0 }}>{">"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EpTeam({ employee }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("month");
  const [selDate, setSelDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selMonth, setSelMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const fmtTime = (timestamp) => (timestamp ? new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "-");
  const fmtDate = (timestamp) => (timestamp ? new Date(timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-");
  const calcHrs = (row) => {
    const out = row.hr_override_checkout || row.checked_out_at;
    if (!out) return null;
    return (new Date(out) - new Date(row.checked_in_at)) / 3600000;
  };
  const fmtHrs = (hours) => (hours != null ? `${hours.toFixed(2)}h` : "-");
  const fmtPay = (pay) => (pay != null ? `${parseFloat(pay).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ALL` : "-");

  async function load() {
    setLoading(true);
    let from;
    let to;
    if (filter === "day") {
      from = `${selDate}T00:00:00`;
      to = `${selDate}T23:59:59`;
    } else {
      from = `${selMonth}-01T00:00:00`;
      const lastDay = new Date(`${selMonth}-01`);
      lastDay.setMonth(lastDay.getMonth() + 1);
      lastDay.setDate(0);
      to = `${selMonth}-${String(lastDay.getDate()).padStart(2, "0")}T23:59:59`;
    }

    const { data } = await SB.from("shift_checkins")
      .select("id,checked_in_at,checked_out_at,gross_earnings,hr_override_checkout")
      .eq("employee_id", employee.id || employee.employee_id)
      .gte("checked_in_at", from)
      .lte("checked_in_at", to)
      .order("checked_in_at", { ascending: false });

    setRows(data || []);
    setLoading(false);
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    load();
  }, [filter, selDate, selMonth]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const totalHrs = rows.reduce((sum, row) => sum + (calcHrs(row) || 0), 0);
  const totalPay = rows.reduce((sum, row) => sum + (row.gross_earnings ? parseFloat(row.gross_earnings) : 0), 0);

  return (
    <div style={{ padding: "0 16px 20px" }} className="ep-fade">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>Attendance</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>Your shift history</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["day", "month"].map((value) => <button key={value} onClick={() => setFilter(value)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", background: filter === value ? "var(--green)" : "var(--card2)", color: filter === value ? "#0c1f18" : "var(--muted)", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "background .15s" }}>{value === "day" ? "Day" : "Month"}</button>)}
      </div>
      <div style={{ marginBottom: 14 }}>
        <input type={filter === "day" ? "date" : "month"} value={filter === "day" ? selDate : selMonth} onChange={(event) => (filter === "day" ? setSelDate(event.target.value) : setSelMonth(event.target.value))} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card2)", color: "var(--ink)", fontSize: 13, fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div className="ep-card" style={{ padding: "12px 14px", textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total Hours</div><div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fmtHrs(totalHrs)}</div></div>
        <div className="ep-card" style={{ padding: "12px 14px", textAlign: "center" }}><div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Total Pay</div><div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>{fmtPay(totalPay)}</div></div>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading...</div> : rows.length === 0 ? <div style={{ textAlign: "center", padding: 48, color: "var(--muted)", fontSize: 14 }}>No shifts found.</div> : (
        <div className="ep-card" style={{ padding: "0 16px" }}>
          {rows.map((row, index) => {
            const hours = calcHrs(row);
            const isActive = !row.checked_out_at && !row.hr_override_checkout;
            return (
              <div key={row.id} style={{ padding: "14px 0", borderBottom: index < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{fmtDate(row.checked_in_at)}</div>
                  {isActive ? <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--green)", background: "rgba(34,197,94,.12)", padding: "2px 8px", borderRadius: 20 }}>Active</span> : <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", background: "var(--card2)", padding: "2px 8px", borderRadius: 20 }}>{fmtHrs(hours)}</span>}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div><div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 1 }}>CHECK-IN</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fmtTime(row.checked_in_at)}</div></div>
                  <div style={{ color: "var(--muted)", alignSelf: "flex-end", fontSize: 13, paddingBottom: 1 }}>-&gt;</div>
                  <div><div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 1 }}>CHECK-OUT</div><div style={{ fontSize: 13, fontWeight: 600, color: row.checked_out_at || row.hr_override_checkout ? "var(--ink)" : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{row.hr_override_checkout ? `${fmtTime(row.hr_override_checkout)} (ovr)` : fmtTime(row.checked_out_at)}</div></div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}><div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 1 }}>PAY</div><div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>{fmtPay(row.gross_earnings)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EpProfile({ employee, onSignOut }) {
  const [renderNow] = useState(() => Date.now());
  const tenure = employee.hire_date ? Math.floor((renderNow - new Date(employee.hire_date)) / 86400000) : 0;
  const tenureLabel = tenure > 365 ? `${(tenure / 365).toFixed(1)}y` : `${tenure}d`;
  const scores = [
    { l: "Punctuality", v: Math.round(+employee.punctuality_pct || 0) },
    { l: "Reliability", v: Math.round(+employee.reliability_pct || 0) },
    { l: "Task Completion", v: Math.round(+employee.task_completion_pct || 0) },
    { l: "Inbox Read", v: Math.round(+employee.inbox_read_pct || 0) },
    { l: "Compliance", v: Math.round(+employee.geo_compliance_pct || 0) },
  ];
  const docStatus = [
    { l: "Health Booklet", n: +employee.health_booklet_count || 0 },
    { l: "ID Photo", n: +employee.id_photo_count || 0 },
    { l: "Forensic Report", n: +employee.forensic_count || 0 },
  ];

  return (
    <div style={{ padding: "0 16px 20px" }} className="ep-fade">
      <div className="ep-card" style={{ marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: `hsl(${(employee.full_name || "?").charCodeAt(0) * 7 % 360},40%,28%)`, border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "var(--ink)", flexShrink: 0 }}>
          {(employee.first_name || employee.full_name || "?")[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ink)", lineHeight: 1.2 }}>{employee.full_name}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{employee.role_name} · {employee.location_name || "HQ"}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: "var(--green-dim)", color: "var(--green)" }}>{employee.employment_type || "Employee"}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: "var(--faint)", color: "var(--muted)" }}>{tenureLabel} tenure</span>
          </div>
        </div>
      </div>

      <div className="ep-card" style={{ marginBottom: 12 }}>
        <div className="ep-section">Work Score</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 18 }}>
          <EpRing value={Math.round(+employee.overall_score || 0)} size={80} sw={6} label="Overall" sub="This month" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--sub)", lineHeight: 1.6, marginBottom: 8 }}>Your operational score is composed of punctuality, reliability, task completion, compliance and inbox engagement.</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Rank {employee.location_rank || "-"} of {employee.location_headcount || "-"} at {employee.location_name || "your location"}</div>
          </div>
        </div>
        {scores.map((score) => (
          <div key={score.l} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--sub)" }}>{score.l}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: epColor(score.v) }}>{score.v}%</span>
            </div>
            <EpBar value={score.v} />
          </div>
        ))}
      </div>

      <div className="ep-card" style={{ marginBottom: 12 }}>
        <div className="ep-section">This Month</div>
        <div className="ep-stats">
          <EpStat val={`${+employee.total_shifts || 0}`} lbl="Shifts" />
          <EpStat val={`${(+employee.total_hours || 0).toFixed(0)}h`} lbl="Hours worked" />
          <EpStat val={`${+employee.avg_late_minutes || 0} min`} lbl="Avg late" />
          <EpStat val={employee.rate_amount ? `${employee.rate_amount} ALL/h` : "-"} lbl="Rate" />
        </div>
      </div>

      <div className="ep-card" style={{ marginBottom: 12 }}>
        <div className="ep-section">Employment</div>
        {[{ l: "Hire Date", v: fmtFull(employee.hire_date) }, { l: "Employment Type", v: employee.employment_type || "-" }, { l: "Department", v: employee.department || "-" }, { l: "Job Title", v: employee.job_title || "-" }, { l: "Contract Status", v: employee.has_contract ? "Active" : "-" }].map((row) => (
          <div key={row.l} className="ep-field-row">
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{row.l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{row.v}</span>
          </div>
        ))}
      </div>

      <div className="ep-card" style={{ marginBottom: 12 }}>
        <div className="ep-section">Documents</div>
        {docStatus.map((document) => (
          <div key={document.l} className="ep-field-row">
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{document.l}</span>
            <span className="ep-doc-badge" style={{ background: document.n > 0 ? "var(--green-dim)" : "var(--red-dim)", color: document.n > 0 ? "var(--green)" : "var(--red)" }}>
              <EpIcon name={document.n > 0 ? "check" : "alert"} size={11} />
              {document.n > 0 ? "On file" : "Missing"}
            </span>
          </div>
        ))}
        {+employee.docs_expiring_30d > 0 && <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "var(--amber-dim)", border: "1px solid var(--amber)", fontSize: 12.5, color: "var(--amber)", fontWeight: 500 }}>Warning: {employee.docs_expiring_30d} document{employee.docs_expiring_30d > 1 ? "s" : ""} expiring in 30 days</div>}
      </div>

      <div className="ep-card" style={{ marginBottom: 16 }}>
        <div className="ep-section">Personal</div>
        {[{ l: "Email", v: employee.email || "-" }, { l: "Phone", v: employee.phone_number ? `${employee.phone_prefix || ""}${employee.phone_number}` : "-" }, { l: "Nationality", v: employee.nationality || "-" }].map((row) => (
          <div key={row.l} className="ep-field-row">
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{row.l}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{row.v}</span>
          </div>
        ))}
      </div>

      <button onClick={onSignOut} className="ep-btn-ghost" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <EpIcon name="out" size={15} />
        Sign Out
      </button>
    </div>
  );
}

export function PartnersPortal({ session, onSignOut }) {
  const [tab, setTab] = useState("shift");
  const [unread, setUnread] = useState(0);
  const nav = [
    { id: "shift", icon: "shift", label: "Shift" },
    { id: "tasks", icon: "tasks", label: "Tasks" },
    { id: "inbox", icon: "inbox", label: "Inbox" },
    { id: "team", icon: "team", label: "ATND" },
    { id: "hr", icon: "hr", label: "Profile" },
  ];

  return (
    <div className="ep-root">
      <style>{EP_CSS}</style>
      <EpHeader session={session} onSignOut={onSignOut} />
      <div className="ep-fade" key={tab}>
        {tab === "shift" && <EpShift employee={session} />}
        {tab === "tasks" && <EpTasks employee={session} />}
        {tab === "inbox" && <EpInbox onUnread={setUnread} />}
        {tab === "team" && <EpTeam employee={session} />}
        {tab === "hr" && <EpProfile employee={session} onSignOut={onSignOut} />}
      </div>
      <nav className="ep-nav">
        {nav.map((item) => (
          <button key={item.id} className={`ep-nav-item ${tab === item.id ? "on" : ""}`} onClick={() => setTab(item.id)}>
            <EpIcon name={item.icon} size={19} color={tab === item.id ? "var(--green)" : "var(--muted)"} />
            {item.label}
            {item.id === "inbox" && unread > 0 && <div className="ep-nav-dot" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
