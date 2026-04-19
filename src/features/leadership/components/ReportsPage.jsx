export function LeadershipReportsPage({ activeReport, components, helpers }) {
  const { Icon } = components;
  const { reportsTree } = helpers;

  if (activeReport) {
    return (
      <div style={{ maxWidth: 900 }}>
        <div className="card" style={{ padding: 48, textAlign: "center" }}>
          <Icon name="reports" size={40} color="var(--divider)" />
          <div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink)", marginTop: 20, marginBottom: 8 }}>{activeReport}</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            This report is being wired to live data in the next sprint.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, maxWidth: 1000 }}>
      {reportsTree.map((sec) => (
        <div key={sec.section} className="card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", marginBottom: 14 }}>{sec.section}</div>
          {sec.items.map((it) => (
            <div key={it} className="rh" style={{ padding: "8px 4px", fontSize: 13, color: "var(--sub)", borderBottom: "1px solid var(--divider)" }}>
              {it}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
