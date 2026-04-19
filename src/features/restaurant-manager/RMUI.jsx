const RM_STATUS_MAP = {
  SUBMITTED: "rm-badge-o",
  UNDER_REVIEW: "rm-badge-b",
  APPROVED_PENDING_CREATION: "rm-badge-g",
  CREATED_PENDING_ACTIVATION: "rm-badge-v",
  ACTIVE: "rm-badge-g",
  INACTIVE: "rm-badge-x",
  REJECTED: "rm-badge-r",
  CANCELLED: "rm-badge-x",
  NEEDS_INFO: "rm-badge-o",
  EXECUTED: "rm-badge-g",
  APPROVED_PENDING_EXECUTION: "rm-badge-b",
  DRAFT: "rm-badge-x",
  PUBLISHED: "rm-badge-g",
  OPEN: "rm-badge-o",
  DONE: "rm-badge-g",
  OVERDUE: "rm-badge-r",
};

export function RMCard({ children, style = {} }) {
  return <div className="rm-card" style={style}>{children}</div>;
}

export function RMSectionLabel({ text }) {
  return <div className="rm-sec">{text}</div>;
}

export function RMStatusBadge({ status }) {
  const className = RM_STATUS_MAP[status] || "rm-badge-x";
  return <span className={`rm-badge ${className}`}>{(status || "").replace(/_/g, " ")}</span>;
}

export function RMField({ label, value, onChange, type = "text", hint, required, readOnly, as = "input", options = [], style = {} }) {
  return (
    <div className="rm-field" style={style}>
      <label className="rm-field-label">
        {label}
        {required && <span style={{ color: "var(--wt-neg)" }}> *</span>}
      </label>
      {as === "select" ? (
        <select value={value} onChange={onChange} className="rm-field-input" disabled={readOnly}>
          <option value="">- select -</option>
          {options.map((option) => <option key={option.v} value={option.v}>{option.l}</option>)}
        </select>
      ) : as === "textarea" ? (
        <textarea value={value} onChange={onChange} rows={3} readOnly={readOnly} className="rm-field-input" style={{ resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={onChange} readOnly={readOnly} className="rm-field-input" />
      )}
      {hint && <span className="rm-field-hint">{hint}</span>}
    </div>
  );
}
