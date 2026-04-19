import { Icon } from "../common/Icon";
import { hc } from "./healthColor";

export function SparkLine({ data, color = "var(--acc)", w = 96, h = 24 }) {
  if (!data?.length || data.length < 2) return null;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 2) - 1}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AreaChart({ data, color = "#1d6bf3", h = 120 }) {
  if (!data?.length || data.length < 2) {
    return <div style={{ height: h, background: "var(--bg)", borderRadius: 8 }} />;
  }
  const W = 500;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const rng = mx - mn || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * W, h - ((v - mn) / rng) * (h - 20) - 10]);
  const lp = `M${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}`;
  const ap = `${lp}L${W},${h}L0,${h}Z`;
  const gid = `ag${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".12" />
          <stop offset="100%" stopColor={color} stopOpacity=".01" />
        </linearGradient>
      </defs>
      <path d={ap} fill={`url(#${gid})`} />
      <path
        d={lp}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="draw-line"
      />
    </svg>
  );
}

export function ScoreRing({ value, size = 76, sw = 6 }) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const col = hc(value);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--divider)" strokeWidth={sw} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - (+value || 0) / 100)}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

export function HealthBar({ value }) {
  return (
    <div
      style={{
        background: "var(--divider)",
        borderRadius: 100,
        height: 4,
        overflow: "hidden",
        marginTop: 7,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 100,
          width: `${+value || 0}%`,
          background: hc(+value || 0),
          transition: "width 1.1s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

export function KpiRow({ label, value, badge, bc, dot }) {
  const dc = {
    g: "var(--pos)",
    o: "var(--warn)",
    r: "var(--neg)",
    b: "var(--acc)",
    x: "var(--divider)",
  };
  return (
    <div className="kpi-row">
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {dot && (
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dc[dot] || "var(--divider)",
              flexShrink: 0,
            }}
          />
        )}
        <span style={{ fontSize: 12.5, color: "var(--sub)" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {badge && <span className={`badge badge-${bc || "x"}`}>{badge}</span>}
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{value}</span>
      </div>
    </div>
  );
}

export function CH({ title, sub, right, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon && <Icon name={icon} size={15} color="var(--muted)" />}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", lineHeight: 1.3 }}>{title}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}
