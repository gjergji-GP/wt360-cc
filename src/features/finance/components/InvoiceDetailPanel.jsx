import { useEffect, useState } from "react";
import { Icon } from "../../../components/common/Icon";
import { fmtFull } from "../../../lib/leadershipHelpers";
import { SB } from "../../../lib/supabase";
import { fmtCurrency } from "../formatters";
import { SourceBadge, StatusPill, TicketBadge } from "./FinanceBadges";

export function InvoiceDetailPanel({ invoice, onClose }) {
  const [lines, setLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(true);

  useEffect(() => {
    if (!invoice) {
      return;
    }

    setLinesLoading(true);
    const fic = invoice.ebills_fic || invoice.fic;
    if (fic) {
      SB.from("ebills_invoice_lines")
        .select("*")
        .eq("fic", fic)
        .order("line_index")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setLines(data);
            setLinesLoading(false);
          } else {
            SB.from("fiscal_invoice_lines")
              .select("*")
              .eq("fiscal_invoice_id", invoice.id)
              .then(({ data: fallbackData }) => {
                setLines(fallbackData || []);
                setLinesLoading(false);
              });
          }
        });
    } else {
      SB.from("fiscal_invoice_lines")
        .select("*")
        .eq("fiscal_invoice_id", invoice.id)
        .then(({ data }) => {
          setLines(data || []);
          setLinesLoading(false);
        });
    }
  }, [invoice]);

  if (!invoice) {
    return null;
  }

  const totalWithVat = +(invoice.tot_price || invoice.total_amount) || 0;
  const totalVat = +(invoice.tot_vat_amt || invoice.tax_amount) || 0;
  const totalNet = +(invoice.tot_price_wo_vat) || totalWithVat - totalVat || 0;

  const lineColumns = [
    { heading: "Item Name", align: "left", width: "22%" },
    { heading: "Code", align: "left", width: "8%" },
    { heading: "Unit", align: "center", width: "6%" },
    { heading: "Qty", align: "right", width: "6%" },
    { heading: "Unit Price", align: "right", width: "10%" },
    { heading: "Price ex VAT", align: "right", width: "11%" },
    { heading: "VAT %", align: "right", width: "7%" },
    { heading: "VAT Amount", align: "right", width: "10%" },
    { heading: "Total", align: "right", width: "10%" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 900,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 40,
        paddingBottom: 40,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(960px,calc(100vw - 48px))",
          background: "var(--card)",
          borderRadius: 18,
          boxShadow: "0 32px 100px rgba(0,0,0,.22)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
        }}
        onClick={(event) => event.stopPropagation()}
        className="fade-up"
      >
        <div
          style={{
            padding: "24px 32px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: "var(--card)",
            zIndex: 10,
            borderRadius: "18px 18px 0 0",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <SourceBadge source={invoice.source} />
              <StatusPill status={invoice.status} />
              {invoice.purchase_order_id && (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 100,
                    background: "rgba(29,107,243,0.08)",
                    color: "var(--acc)",
                  }}
                >
                  COGS · SC Pipeline Active
                </span>
              )}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 18,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {invoice.seller_name || invoice.vendor_name_raw || "-"}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--muted)",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <TicketBadge id={invoice.id} />
              <span>{fmtFull(invoice.issue_date_time || invoice.invoice_date)}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 3,
                }}
              >
                Invoice Total
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "var(--ink)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {fmtCurrency(totalWithVat)}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 3 }}>incl. VAT</div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                marginTop: 4,
              }}
            >
              <Icon name="close" size={15} color="var(--sub)" />
            </button>
          </div>
        </div>
        <div style={{ padding: "24px 32px 32px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
              marginBottom: 28,
              background: "var(--bg)",
              borderRadius: 12,
              padding: "16px 20px",
              border: "1px solid var(--divider)",
            }}
          >
            {[
              { label: "Vendor", value: invoice.seller_name || invoice.vendor_name_raw || "-" },
              { label: "Invoice Date", value: fmtFull(invoice.issue_date_time || invoice.invoice_date) },
              { label: "Due Date", value: fmtFull(invoice.pay_deadline || invoice.due_date) || "-" },
              { label: "Invoice Type", value: invoice.type_of_inv || invoice.invoice_type || "-" },
              { label: "Seller NIPT", value: invoice.seller_nipt || "-" },
              {
                label: "FIC",
                value: (
                  <span style={{ fontFamily: "monospace", fontSize: 11.5 }}>
                    {(invoice.ebills_fic || invoice.fic || "-").slice(0, 20) +
                      ((invoice.ebills_fic || "").length > 20 ? "…" : "")}
                  </span>
                ),
              },
              {
                label: "IIC",
                value: (
                  <span style={{ fontFamily: "monospace", fontSize: 11.5 }}>
                    {(invoice.iic || "-").slice(0, 20) + ((invoice.iic || "").length > 20 ? "…" : "")}
                  </span>
                ),
              },
              {
                label: "Category",
                value: invoice.expense_category_code
                  ? `${invoice.expense_category_code}${invoice.expense_subcategory ? ` · ${invoice.expense_subcategory}` : ""}`
                  : "Unclassified",
              },
            ].map((field) => (
              <div key={field.label}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.09em",
                    marginBottom: 4,
                  }}
                >
                  {field.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{field.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
            {[
              { label: "Net (excl. VAT)", value: fmtCurrency(totalNet), color: "var(--ink)" },
              { label: "VAT Amount", value: fmtCurrency(totalVat), color: "var(--sub)" },
              { label: "Total (incl. VAT)", value: fmtCurrency(totalWithVat), color: "var(--acc)", bold: true },
            ].map((tile) => (
              <div key={tile.label} style={{ background: "var(--bg)", borderRadius: 10, padding: "14px 18px", border: "1px solid var(--divider)" }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  {tile.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: tile.bold ? 800 : 600, color: tile.color, letterSpacing: "-0.02em" }}>
                  {tile.value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", letterSpacing: "-0.01em" }}>Invoice Line Items</div>
              {!linesLoading && (
                <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
                  {lines.length > 0 ? `${lines.length} line${lines.length > 1 ? "s" : ""}` : ""}
                </span>
              )}
            </div>
            {linesLoading ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: 12.5, border: "1px solid var(--divider)", borderRadius: 12 }}>
                Loading line items...
              </div>
            ) : lines.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", border: "1px dashed var(--divider)", borderRadius: 12 }}>
                <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>No line items available for this invoice</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  eBills test environment may not return item detail for this supplier
                </div>
              </div>
            ) : (
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: "var(--bg)" }}>
                        {lineColumns.map((column) => (
                          <th
                            key={column.heading}
                            style={{
                              padding: "10px 12px",
                              textAlign: column.align,
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: "var(--muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              borderBottom: "1px solid var(--border)",
                              whiteSpace: "nowrap",
                              width: column.width,
                            }}
                          >
                            {column.heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => {
                        const isEbills = line.item_name !== undefined;
                        const itemName = isEbills ? line.item_name || "-" : line.vendor_item_name || line.item_name || "-";
                        const code = isEbills ? line.item_code || "-" : line.sku_code || "-";
                        const uom = isEbills ? line.unit_of_measure || "-" : line.uom || "-";
                        const qty = line.qty ?? null;
                        const unitPrice = line.unit_price != null ? fmtCurrency(+line.unit_price) : "-";
                        const net = line.price_wo_vat != null ? fmtCurrency(+line.price_wo_vat) : "-";
                        const vatRate = line.vat_rate != null ? `${line.vat_rate}%` : "-";
                        const vatAmount = line.vat_amount != null ? fmtCurrency(+line.vat_amount) : "-";
                        const total = line.total_price != null ? fmtCurrency(+line.total_price) : "-";

                        return (
                          <tr
                            key={line.id || index}
                            style={{
                              borderBottom: index < lines.length - 1 ? "1px solid var(--divider)" : "none",
                              background: index % 2 === 0 ? "transparent" : "var(--faint)",
                            }}
                          >
                            <td style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 600 }}>{itemName}</td>
                            <td style={{ padding: "10px 12px", color: "var(--sub)", fontFamily: "monospace", fontSize: 11.5 }}>{code}</td>
                            <td style={{ padding: "10px 12px", color: "var(--sub)", textAlign: "center" }}>{uom}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink)", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{qty ?? ""}</td>
                            <td style={{ padding: "10px 12px", color: "var(--sub)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{unitPrice}</td>
                            <td style={{ padding: "10px 12px", color: "var(--sub)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{net}</td>
                            <td style={{ padding: "10px 12px", color: "var(--muted)", textAlign: "right" }}>{vatRate}</td>
                            <td style={{ padding: "10px 12px", color: "var(--muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{vatAmount}</td>
                            <td style={{ padding: "10px 12px", color: "var(--ink)", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {lines.length > 1 && (
                      <tfoot>
                        <tr style={{ background: "var(--bg)", borderTop: "2px solid var(--border)" }}>
                          <td colSpan={6} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: "var(--sub)" }}>
                            Invoice Total
                          </td>
                          <td colSpan={2} style={{ padding: "10px 12px", textAlign: "right", fontSize: 12, color: "var(--muted)" }}>
                            VAT: {fmtCurrency(totalVat)}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, fontSize: 13, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                            {fmtCurrency(totalWithVat)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
          {invoice.status === "PENDING" && (
            <div style={{ padding: "14px 18px", background: "var(--warn-bg)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
              <Icon name="alert" size={14} color="var(--warn)" />
              <span style={{ fontSize: 12.5, color: "var(--warn)", fontWeight: 500 }}>This invoice is pending classification by Finance.</span>
            </div>
          )}
          {invoice.purchase_order_id && (
            <div style={{ padding: "14px 18px", background: "var(--acc-bg)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(29,107,243,0.15)" }}>
              <Icon name="task" size={14} color="var(--acc)" />
              <span style={{ fontSize: 12.5, color: "var(--acc)", fontWeight: 500 }}>
                COGS invoice - Supply Chain pipeline is active. Invoice remains in Finance ledger throughout.
              </span>
            </div>
          )}
          {invoice.classified_at && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--divider)", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[
                { label: "Classified By", value: invoice.classified_by_name || "-" },
                { label: "Classified At", value: fmtFull(invoice.classified_at) },
                { label: "Transaction Ref", value: invoice.transaction_ref || "-" },
              ].map((field) => (
                <div key={field.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                    {field.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 500 }}>{field.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
