export function RMWaste({ session, wasteLogs, deps }) {
  const { RMCard, RMSectionLabel } = deps;
  const total = wasteLogs.reduce((sum, waste) => sum + (parseFloat(waste.total_cost) || 0), 0);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--wt-ink)", marginBottom: 4 }}>Waste</div>
      <div style={{ fontSize: 12, color: "var(--wt-muted)", marginBottom: 20 }}>Last 7 days Â· {session.location_name}</div>

      <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
        <RMCard style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--wt-muted)", fontWeight: 600, marginBottom: 6 }}>Total Waste Cost</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--wt-neg)" }}>{total.toLocaleString("en", { maximumFractionDigits: 0 })} L</div>
        </RMCard>
        <RMCard style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--wt-muted)", fontWeight: 600, marginBottom: 6 }}>Waste Entries</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--wt-ink)" }}>{wasteLogs.length}</div>
        </RMCard>
      </div>

      <RMCard>
        <RMSectionLabel text="Waste Log" />
        {wasteLogs.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--wt-muted)", padding: "8px 0" }}>No waste recorded this week.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--wt-border)" }}>
                {["Date", "Product", "Qty", "Unit Cost", "Total", "Reason"].map((header) => (
                  <th key={header} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--wt-muted)", padding: "6px 8px", textTransform: "uppercase" }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wasteLogs.map((waste) => (
                <tr key={waste.id} style={{ borderBottom: "1px solid var(--wt-divider)" }}>
                  <td style={{ padding: "9px 8px", fontSize: 12 }}>{waste.waste_date || "â€”"}</td>
                  <td style={{ padding: "9px 8px", fontSize: 12, fontWeight: 600 }}>{waste.product_id || "â€”"}</td>
                  <td style={{ padding: "9px 8px", fontSize: 12 }}>{waste.quantity}</td>
                  <td style={{ padding: "9px 8px", fontSize: 12 }}>{waste.unit_cost}</td>
                  <td style={{ padding: "9px 8px", fontSize: 12, fontWeight: 700, color: "var(--wt-neg)" }}>{waste.total_cost}</td>
                  <td style={{ padding: "9px 8px", fontSize: 11, color: "var(--wt-muted)" }}>{waste.waste_reason_id || "â€”"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </RMCard>
    </div>
  );
}
