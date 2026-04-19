import { useEffect, useRef, useState } from "react";
import { SB } from "../../lib/supabase";

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);

  const go = async () => {
    setBusy(true);
    setErr("");
    const { data, error } = await SB.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    if (data?.user) onLogin(data.user);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 90;
    const pts = Array.from({ length: N }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.4,
      phase: Math.random() * Math.PI * 2,
      kind: i % 3 === 0 ? 1 : 0,
    }));

    const FORK = [[0.5, 0.05], [0.5, 0.95], [0.3, 0.05], [0.3, 0.4], [0.7, 0.05], [0.7, 0.4], [0.3, 0.4], [0.7, 0.4]];
    const KNIFE = [[0.3, 0.05], [0.7, 0.45], [0.5, 0.95]];
    const CHART = [[0.1, 0.9], [0.1, 0.1], [0.9, 0.1], [0.1, 0.1], [0.3, 0.6], [0.55, 0.35], [0.75, 0.55], [0.95, 0.2]];
    const GRID = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9], [0.1, 0.1], [0.1, 0.5], [0.9, 0.5], [0.5, 0.1], [0.5, 0.9]];
    const icons = [FORK, KNIFE, CHART, GRID];
    const iconData = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      s: 28 + Math.random() * 22,
      alpha: 0,
      targetAlpha: 0.06 + Math.random() * 0.07,
      kind: i % 2,
      icon: icons[i % icons.length],
      drift: { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.15 },
      birthT: Math.random() * 60,
    }));

    const CONN_DIST = 140;

    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bg = ctx.createRadialGradient(canvas.width * 0.3, canvas.height * 0.35, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8);
      bg.addColorStop(0, "rgba(3,60,100,0.55)");
      bg.addColorStop(0.45, "rgba(5,30,60,0.4)");
      bg.addColorStop(0.75, "rgba(10,40,30,0.25)");
      bg.addColorStop(1, "rgba(12,18,32,0)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pts.forEach((p) => {
        p.x += p.vx + Math.sin(t + p.phase) * 0.12;
        p.y += p.vy + Math.cos(t * 0.7 + p.phase) * 0.1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      for (let i = 0; i < N; i += 1) {
        for (let j = i + 1; j < N; j += 1) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONN_DIST) {
            const a = (1 - d / CONN_DIST) * 0.18;
            const sameKind = pts[i].kind === pts[j].kind;
            ctx.strokeStyle = sameKind && pts[i].kind === 1
              ? `rgba(20,180,140,${a})`
              : sameKind
                ? `rgba(56,130,220,${a})`
                : `rgba(100,160,200,${a * 0.6})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      pts.forEach((p) => {
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.8 + p.phase);
        ctx.fillStyle = p.kind === 1
          ? `rgba(20,210,160,${0.55 * pulse})`
          : `rgba(80,160,240,${0.5 * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      iconData.forEach((ic) => {
        if (t < ic.birthT * 0.008) return;
        ic.alpha += (ic.targetAlpha - ic.alpha) * 0.015;
        ic.x += ic.drift.x;
        ic.y += ic.drift.y;
        if (ic.x > canvas.width + 60) ic.x = -60;
        if (ic.y > canvas.height + 60) ic.y = -60;
        if (ic.x < -60) ic.x = canvas.width + 60;
        const col = ic.kind === 1 ? `rgba(20,200,150,${ic.alpha})` : `rgba(80,150,240,${ic.alpha})`;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ic.icon.forEach(([px, py], idx) => {
          const sx = ic.x + px * ic.s - ic.s / 2;
          const sy = ic.y + py * ic.s - ic.s / 2;
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="login-wrap">
      <canvas ref={canvasRef} className="login-canvas" />
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 32, color: "#ffffff", letterSpacing: "-0.03em" }}>wt360</span>
            <span style={{ color: "#22c55e", fontSize: 14, lineHeight: 1 }}>●</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.12em" }}>
            OPERATIONAL PLATFORM
          </div>
        </div>
        <input className="login-input" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} autoComplete="email" />
        <input className="login-input" type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} autoComplete="current-password" />
        {err && <div style={{ fontSize: 12.5, color: "#f87171", marginBottom: 12, padding: "8px 12px", background: "rgba(248,113,113,0.08)", borderRadius: 8 }}>{err}</div>}
        <button className="login-btn" onClick={go} disabled={busy || !email || !pw}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11.5, color: "rgba(255,255,255,0.18)", letterSpacing: "0.04em" }}>
          RESTRICTED ACCESS · AUTHORISED PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
}
