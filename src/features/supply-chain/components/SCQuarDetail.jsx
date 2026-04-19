import { scAge, trigLbl, trigTag } from "../helpers";
import { SCIcon } from "./SCIcon";

export function SCQuarDetail({ q, onClose, deps }) {
  const { SCQuarUnknownDetail, SCQuarPriceDetail } = deps;

  const reason = q.quarantine_reason;
  if (reason === "UNKNOWN_SKU") return <SCQuarUnknownDetail ticket={q} onClose={onClose} onResolved={onClose} />;
  if (reason === "PRICE_DEVIATION") return <SCQuarPriceDetail ticket={q} onClose={onClose} onResolved={onClose} />;

  return (
    <div className="sc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sc-dp" style={{ width: "100%", maxWidth: 600 }}>
        <div className="sc-dp-hdr">
          <div>
            <span className={`sc-tag ${trigTag(reason)}`}>{trigLbl(reason)}</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--sc-ink)", marginTop: 6 }}>{q.vendor_name_raw || q.ticket_number}</div>
          </div>
          <button className="sc-dp-close" onClick={onClose}>
            <SCIcon n="x" s={15} c="var(--sc-ink)" />
          </button>
        </div>
        <div className="sc-dp-body">
          <div className="sc-g3">
            {[{ l: "Ticket #", v: q.ticket_number }, { l: "Status", v: q.status }, { l: "Lines", v: q.total_lines || 0 }, { l: "Age", v: scAge(q.created_at) }].map((x, i) => (
              <div key={i} className="sc-ib">
                <div className="sc-ib-l">{x.l}</div>
                <div className="sc-ib-v">{x.v || "-"}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: "12px 14px", background: "rgba(196,29,29,.05)", border: "1px solid rgba(196,29,29,.12)", borderRadius: 9, fontSize: 12, color: "var(--sc-neg)" }}>
            Resolution workflow for {trigLbl(reason)} coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}
