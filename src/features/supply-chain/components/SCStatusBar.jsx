import { SCIcon } from "./SCIcon";

export function SCStatusBar({ openQuar, overdueSLA, blocked, onRefresh }) {
  return (
    <div className="sc-status-bar">
      <div className="sc-live-dot" />
      <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--sc-sub)" }}>Live</span>
      <div className="sc-status-dot" />
      {openQuar === 0 ? (
        <span style={{ color: "var(--sc-pos)", fontWeight: 600 }}>No open quarantines</span>
      ) : (
        <span style={{ color: "var(--sc-neg)", fontWeight: 600 }}>
          {openQuar} open quarantine{openQuar > 1 ? "s" : ""}
        </span>
      )}
      {overdueSLA > 0 && (
        <>
          <div className="sc-status-dot" />
          <span style={{ color: "var(--sc-neg)", fontWeight: 600 }}>
            {overdueSLA} SLA breach{overdueSLA > 1 ? "es" : ""}
          </span>
        </>
      )}
      {blocked > 0 && (
        <>
          <div className="sc-status-dot" />
          <span style={{ color: "var(--sc-neg)", fontWeight: 600 }}>
            {blocked} invoice{blocked > 1 ? "s" : ""} allocation-blocked
          </span>
        </>
      )}
      <button className="sc-btn sc-btn-g sc-btn-sm" style={{ marginLeft: "auto" }} onClick={onRefresh}>
        <SCIcon n="refresh" s={12} />Refresh
      </button>
    </div>
  );
}
