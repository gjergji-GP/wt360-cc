import { Icon } from "../../components/common/Icon";
import { WT } from "./tokens";

const MLC_STAGES = {
  BRIEF_DRAFT: { label: "Brief Draft", color: WT.textSecondary, bg: WT.bgMuted, border: WT.border },
  BRIEF_SUBMITTED: { label: "Brief Submitted", color: WT.blue600, bg: WT.blue050, border: WT.blue100 },
  BRIEF_REVISION_REQUESTED: { label: "Revision Requested", color: WT.warning600, bg: WT.warning050, border: "#F6E2AF" },
  BRIEF_ABANDONED: { label: "Abandoned", color: WT.textTertiary, bg: WT.bgMuted, border: WT.border },
  RECIPE_DRAFT: { label: "Recipe Draft", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  TESTING: { label: "Testing", color: WT.info600, bg: WT.info050, border: "#BAE6FD" },
  RECIPE_REVISION: { label: "Recipe Revision", color: WT.warning600, bg: WT.warning050, border: "#F6E2AF" },
  OPERATIONAL_REVIEW: { label: "Ops Review", color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4" },
  FINANCE_REVIEW: { label: "Finance Review", color: WT.success600, bg: WT.success050, border: "#BBF7D0" },
  FINANCE_REJECTED: { label: "Finance Rejected", color: WT.error600, bg: WT.error050, border: "#FECACA" },
  APPROVED_READY: { label: "Approved - Ready", color: WT.success600, bg: WT.success050, border: "#BBF7D0" },
  DEFERRED: { label: "Deferred", color: WT.textSecondary, bg: WT.bgMuted, border: WT.border },
  ARCHIVED_UNVIABLE: { label: "Archived", color: WT.textTertiary, bg: WT.bgMuted, border: WT.border },
  REACTIVATION_TECH_REVIEW: { label: "Tech Reactivation", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
  REACTIVATION_FINANCE_REVIEW: { label: "Finance Reactivation", color: WT.success600, bg: WT.success050, border: "#BBF7D0" },
  RETIRED: { label: "Retired", color: WT.textTertiary, bg: WT.bgMuted, border: WT.border },
};

const MLC_ACTIVATION = {
  LIVE: { label: "Live", color: WT.success600, bg: WT.success050, dot: "#22C55E" },
  SCHEDULED: { label: "Scheduled", color: WT.blue600, bg: WT.blue050, dot: WT.blue600 },
  INACTIVE: { label: "Inactive", color: WT.textSecondary, bg: WT.bgMuted, dot: WT.textTertiary },
  UNSCHEDULED: { label: "Unscheduled", color: WT.textTertiary, bg: WT.bgSoft, dot: WT.textDisabled },
};

export function StagePill({ stage }) {
  const s = MLC_STAGES[stage] || { label: stage || "-", color: WT.textSecondary, bg: WT.bgMuted, border: WT.border };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: WT.rPill, fontSize: 11, fontWeight: 600, letterSpacing: "0.01em", color: s.color, background: s.bg, border: `1px solid ${s.border}`, fontFamily: WT.font }}>
      {s.label}
    </span>
  );
}

export function ActivationPill({ status }) {
  const a = MLC_ACTIVATION[status] || MLC_ACTIVATION.INACTIVE;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: WT.rPill, fontSize: 11, fontWeight: 600, color: a.color, background: a.bg, fontFamily: WT.font }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.dot, flexShrink: 0 }} />
      {a.label}
    </span>
  );
}

export function WtCard({ children, style = {} }) {
  return <div style={{ background: WT.bgPanel, borderRadius: WT.rLg, boxShadow: WT.shadowTile, padding: "20px 24px", ...style }}>{children}</div>;
}

export function WtModal({ open, onClose, title, width = 600, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: WT.bgPanel, borderRadius: WT.rXxl, width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", padding: 32, position: "relative", boxShadow: WT.shadowModal, fontFamily: WT.font }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, background: WT.bgMuted, border: `1px solid ${WT.border}`, borderRadius: WT.rSm, cursor: "pointer", color: WT.textSecondary, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          x
        </button>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24, color: WT.textStrong, paddingRight: 40 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

export function WtBtn({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }) {
  const sizes = {
    sm: { padding: "7px 14px", fontSize: 12, height: 32 },
    md: { padding: "9px 18px", fontSize: 13, height: 40 },
    lg: { padding: "11px 24px", fontSize: 14, height: 44 },
  };
  const variants = {
    primary: { background: WT.blue600, color: "#fff", border: `1px solid ${WT.blue600}` },
    secondary: { background: WT.bgPanel, color: WT.textPrimary, border: `1px solid ${WT.border}` },
    ghost: { background: "transparent", color: WT.textSecondary, border: "1px solid transparent" },
    danger: { background: WT.error050, color: WT.error600, border: "1px solid #FECACA" },
    success: { background: WT.success050, color: WT.success600, border: "1px solid #BBF7D0" },
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...s, ...v, borderRadius: WT.rMd, cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontFamily: WT.font, opacity: disabled ? 0.45 : 1, display: "inline-flex", alignItems: "center", gap: 6, transition: "all 0.12s", whiteSpace: "nowrap", ...style }}>
      {children}
    </button>
  );
}

export function WtField({ label, value, sub, style = {} }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, fontWeight: 600, color: WT.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, fontFamily: WT.font }}>{label}</div>
      <div style={{ fontSize: 14, color: WT.textStrong, fontWeight: 600, fontFamily: WT.font, fontVariantNumeric: "tabular-nums" }}>{value || "-"}</div>
      {sub && <div style={{ fontSize: 12, color: WT.textSecondary, marginTop: 2, fontFamily: WT.font }}>{sub}</div>}
    </div>
  );
}

export function WtInput({ label, value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <div style={style}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: WT.textSecondary, marginBottom: 6, fontFamily: WT.font }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${WT.border}`, borderRadius: WT.rMd, fontSize: 13, fontFamily: WT.font, color: WT.textPrimary, background: WT.bgPanel, outline: "none", boxSizing: "border-box", fontVariantNumeric: "tabular-nums" }} />
    </div>
  );
}

export function WtSelect({ label, value, onChange, children, style = {} }) {
  return (
    <div style={style}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: WT.textSecondary, marginBottom: 6, fontFamily: WT.font }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${WT.border}`, borderRadius: WT.rMd, fontSize: 13, fontFamily: WT.font, color: WT.textPrimary, background: WT.bgPanel, outline: "none", boxSizing: "border-box" }}>
        {children}
      </select>
    </div>
  );
}

export function WtTextarea({ label, value, onChange, placeholder, rows = 3, style = {} }) {
  return (
    <div style={style}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: WT.textSecondary, marginBottom: 6, fontFamily: WT.font }}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ width: "100%", padding: "10px 14px", border: `1px solid ${WT.border}`, borderRadius: WT.rMd, fontSize: 13, fontFamily: WT.font, color: WT.textPrimary, background: WT.bgPanel, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
    </div>
  );
}

export function WtEmpty({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px", color: WT.textTertiary, fontFamily: WT.font }}>
      <div style={{ width: 48, height: 48, borderRadius: WT.rLg, background: WT.bgMuted, border: `1px solid ${WT.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        {icon && <Icon name={icon} size={22} color={WT.textTertiary} />}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: WT.textSecondary, marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: WT.textTertiary }}>{subtitle}</div>}
    </div>
  );
}

export function WtKpi({ label, value, sub, icon, color, onClick }) {
  return (
    <div onClick={onClick} style={{ background: WT.bgPanel, borderRadius: WT.rXl, boxShadow: WT.shadowTile, padding: "20px 24px", cursor: onClick ? "pointer" : "default", transition: "box-shadow 0.15s", fontFamily: WT.font }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: WT.textTertiary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
        {icon && <div style={{ width: 32, height: 32, borderRadius: WT.rSm, background: WT.bgMuted, border: `1px solid ${WT.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || WT.textStrong, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: WT.textSecondary, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export function WtToast({ toast }) {
  if (!toast) return null;
  const map = {
    success: { bg: WT.success050, border: "#BBF7D0", color: WT.success600 },
    error: { bg: WT.error050, border: "#FECACA", color: WT.error600 },
    warn: { bg: WT.warning050, border: "#F6E2AF", color: WT.warning600 },
    info: { bg: WT.info050, border: "#BAE6FD", color: WT.info600 },
  };
  const t = map[toast.type] || map.success;
  return <div style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 20px", background: t.bg, border: `1px solid ${t.border}`, borderRadius: WT.rLg, fontWeight: 600, fontSize: 13, zIndex: 9999, color: t.color, maxWidth: 380, boxShadow: WT.shadowPanel, fontFamily: WT.font }}>{toast.msg}</div>;
}

export function WtPageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, fontFamily: WT.font }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: WT.textStrong, margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: WT.textSecondary, margin: "4px 0 0", fontWeight: 400 }}>{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0, marginLeft: 16 }}>{action}</div>}
    </div>
  );
}

export function SbItem({ label, iconName, active, badge, onClick, exp }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: WT.rSm, cursor: "pointer", marginBottom: 2, background: active ? WT.shellActive : "transparent", color: active ? WT.textOnDark : WT.textDarkMuted, fontWeight: active ? 600 : 400, transition: "all 0.12s", justifyContent: exp ? "flex-start" : "center" }}>
      {iconName && <Icon name={iconName} size={16} color={active ? WT.textOnDark : WT.textDarkMuted} />}
      {exp && <span style={{ fontSize: 13, flex: 1, fontFamily: WT.font }}>{label}</span>}
      {exp && badge != null && badge > 0 && <span style={{ background: WT.error600, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: WT.rPill, fontFamily: WT.font }}>{badge}</span>}
    </div>
  );
}
