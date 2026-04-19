import { useState } from "react";
import { SCIcon } from "./SCIcon";

export function SCHeader({ page, session, datePreset, onDateChange, search, setSearch, brands, activeBrand, onBrandChange }) {
  const [ddOpen, setDdOpen] = useState(false);
  const titles = {
    "sc-home": "Command Centre",
    "sc-tasks": "Task Queue",
    "sc-quar": "Quarantine Workbench",
    "sc-alloc": "Allocations",
    "sc-recv": "Receiving Monitor",
    "sc-reports": "Reports",
    "sc-notif": "Notifications",
  };
  const currentBrand = brands?.find((brand) => brand.id === activeBrand);

  return (
    <div className="sc-hdr">
      <div className="sc-hdr-top">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--sc-ink)", letterSpacing: "-.02em" }}>{titles[page] || "Supply Chain"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {brands && brands.length > 0 && (
            <div className="sc-brand-dd">
              <button className="sc-brand-btn" onClick={() => setDdOpen((current) => !current)}>
                <SCIcon n="layers" s={12} c="var(--sc-acc)" />
                <span>{currentBrand?.name || session?.brand_name || "All Brands"}</span>
                <span style={{ transform: ddOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s", display: "flex" }}>
                  <SCIcon n="arr" s={10} c="var(--sc-muted)" />
                </span>
              </button>
              {ddOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 399 }} onClick={() => setDdOpen(false)} />
                  <div className="sc-brand-menu">
                    {brands.map((brand) => (
                      <div key={brand.id} className={`sc-brand-opt ${activeBrand === brand.id ? "on" : ""}`} onClick={() => { onBrandChange(brand.id); setDdOpen(false); }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeBrand === brand.id ? "var(--sc-acc)" : "var(--sc-border)", flexShrink: 0 }} />
                        {brand.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div style={{ width: 1, height: 20, background: "var(--sc-divider)" }} />
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
              <SCIcon n="srch" s={13} c="var(--sc-muted)" />
            </span>
            <input className="sc-srch" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" style={{ paddingLeft: 30 }} />
          </div>
          <div style={{ width: 1, height: 20, background: "var(--sc-divider)", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 9, border: "1px solid var(--sc-border)", background: "var(--sc-card)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(21,88,214,.10)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--sc-acc)", flexShrink: 0, border: "1px solid rgba(21,88,214,.15)" }}>
              {(session?.first_name || session?.full_name || "S")[0].toUpperCase()}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sc-ink)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{session?.full_name || session?.first_name || "SC Manager"}</div>
              <div style={{ fontSize: 10, color: "var(--sc-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{session?.role_name || "Supply Chain"}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="sc-hdr-bar">
        {["Today", "Yesterday", "Last 7 days", "Last 30 days"].map((preset) => (
          <button key={preset} className={`sc-dpill ${datePreset === preset ? "on" : ""}`} onClick={() => onDateChange(preset)}>
            {preset}
          </button>
        ))}
        <div style={{ width: 1, background: "var(--sc-divider)", height: 18, margin: "0 4px", flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "var(--sc-muted)", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase", flexShrink: 0 }}>SC Pipeline</span>
      </div>
    </div>
  );
}
