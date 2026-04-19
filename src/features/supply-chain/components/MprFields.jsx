export function MprTextInput({ label, value, onChange, hint, warn, mono, readOnly, type }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sc-sub)", marginBottom: 4 }}>{label}</div>
      <input
        type={type || "text"}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        style={{
          width: "100%",
          background: "var(--sc-bg)",
          border: "1px solid var(--sc-border)",
          borderRadius: 7,
          padding: "7px 10px",
          fontSize: 13,
          color: readOnly ? "var(--sc-muted)" : "var(--sc-ink)",
          outline: "none",
          boxSizing: "border-box",
          fontFamily: mono ? "monospace" : "inherit",
          opacity: readOnly ? 0.75 : 1,
        }}
      />
      {hint && <div style={{ fontSize: 10, color: warn ? "var(--sc-warn)" : "var(--sc-muted)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

export function MprSelectInput({ label, value, onChange, options, hint }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sc-sub)", marginBottom: 4 }}>{label}</div>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          background: "var(--sc-bg)",
          border: "1px solid var(--sc-border)",
          borderRadius: 7,
          padding: "7px 10px",
          fontSize: 13,
          color: "var(--sc-ink)",
          outline: "none",
          boxSizing: "border-box",
          appearance: "auto",
        }}
      >
        <option value="">- select -</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <div style={{ fontSize: 10, color: "var(--sc-muted)", marginTop: 3 }}>{hint}</div>}
    </div>
  );
}
