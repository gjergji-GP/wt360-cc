import { useState } from "react";
import { scDate, scTime } from "../helpers";

export function SCRecvPage({ tickets = [], recvTasks = [], reviewTasks = [], search, onOpenReview, deps }) {
  const { SCEmpty } = deps;
  const [tab, setTab] = useState("REVIEW");

  const open = recvTasks.filter((task) => task.status === "OPEN");
  const pendingReview = reviewTasks.filter((task) => ["OPEN", "IN_PROGRESS", "OVERDUE"].includes(task.status));
  const reviewEntityIds = new Set(reviewTasks.map((task) => task.entity_id));
  const ticketsWithFlag = tickets.map((ticket) => ({
    ...ticket,
    hasReview: reviewEntityIds.has(ticket.id),
  }));

  const base = tab === "PENDING" ? open : tab === "REVIEW" ? pendingReview : ticketsWithFlag;
  const filtered = base.filter((row) => !search || JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));

  const openSubmitted = (ticket) => {
    onOpenReview({ task: { id: null, entity_id: ticket.id }, readOnly: true });
  };

  return (
    <div className="sc-fu">
      <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
        {[
          { l: "Awaiting Receiving", v: open.length, c: "var(--sc-warn)", tab: "PENDING" },
          { l: "Needs SC Review", v: pendingReview.length, c: "var(--sc-neg)", tab: "REVIEW" },
          { l: "Submitted (period)", v: tickets.length, c: "var(--sc-pos)", tab: "SUBMITTED" },
        ].map((summary, index) => (
          <div
            key={index}
            onClick={() => setTab(summary.tab)}
            style={{
              flex: 1,
              background: "var(--sc-card)",
              border: `1px solid ${tab === summary.tab ? summary.c : "var(--sc-border)"}`,
              borderRadius: 14,
              padding: "16px 20px",
              boxShadow: "var(--sc-shadow)",
              cursor: "pointer",
              transition: "border .15s",
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: summary.c, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{summary.v}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sc-sub)", marginTop: 4 }}>{summary.l}</div>
          </div>
        ))}
      </div>
      <div className="sc-tab-row">
        {[
          { id: "REVIEW", l: `Needs Review (${pendingReview.length})` },
          { id: "PENDING", l: `Awaiting Confirmation (${open.length})` },
          { id: "SUBMITTED", l: `Submitted Tickets (${tickets.length})` },
        ].map((item) => (
          <div key={item.id} className={`sc-tab ${tab === item.id ? "on" : ""}`} onClick={() => setTab(item.id)}>
            {item.l}
          </div>
        ))}
      </div>
      {tab === "PENDING" && (
        <div
          style={{
            marginBottom: 14,
            padding: "10px 14px",
            background: "var(--sc-acc-bg)",
            border: "1px solid rgba(21,88,214,.12)",
            borderRadius: 9,
            fontSize: 12,
            color: "var(--sc-acc)",
            lineHeight: 1.5,
          }}
        >
          <strong>Awaiting Confirmation</strong> - these are <strong>RECEIVE_DELIVERY</strong> tasks that SC created for locations but the Restaurant Manager has not yet physically confirmed the delivery. Once the RM submits the receipt, the task moves to <strong>Needs Review</strong> (if discrepant) or <strong>Submitted Tickets</strong> (if clean). SC should follow up with the location if a task here is overdue.
        </div>
      )}
      <div className="sc-panel">
        {filtered.length === 0 ? (
          <SCEmpty
            icon={tab === "REVIEW" ? "check" : "inbox"}
            msg={tab === "REVIEW" ? "No tickets awaiting review" : tab === "PENDING" ? "All deliveries confirmed" : "No submitted tickets in period"}
            color={tab === "REVIEW" ? "var(--sc-pos)" : tab === "PENDING" ? "var(--sc-pos)" : "var(--sc-muted)"}
          />
        ) : (
          <table className="sc-tbl">
            <thead>
              <tr>
                <th>Location</th>
                <th>{tab === "REVIEW" ? "Ticket Ref" : "Vendor"}</th>
                <th>Invoice</th>
                <th>{tab === "PENDING" ? "Due" : "Submitted"}</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => {
                const overdue = row.due_at && new Date(row.due_at) < new Date();
                const isDiscrepant = tab === "SUBMITTED" && row.hasReview;
                return (
                  <tr key={row.id || index} onClick={tab === "SUBMITTED" ? () => openSubmitted(row) : undefined} style={tab === "SUBMITTED" ? { cursor: "pointer" } : {}}>
                    <td style={{ fontWeight: 600 }}>{row.location_name || "-"}</td>
                    <td style={{ color: "var(--sc-sub)", fontSize: 12.5 }}>
                      {tab === "REVIEW" ? <span style={{ fontFamily: "monospace", fontSize: 11 }}>{row.entity_id?.slice(-8) || "-"}</span> : row.vendor_name || "-"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--sc-muted)" }}>{(row.entity_id || row.id)?.slice(-8) || "-"}</td>
                    <td style={{ fontSize: 12, color: overdue ? "var(--sc-neg)" : "var(--sc-sub)", fontWeight: overdue ? 700 : 400 }}>
                      {tab === "PENDING" ? scTime(row.due_at) : scDate(row.received_at || row.created_at)}
                    </td>
                    <td>
                      {tab === "REVIEW" ? (
                        <span className="sp sp-o">REVIEW</span>
                      ) : overdue ? (
                        <span className="sp sp-r">OVERDUE</span>
                      ) : tab === "PENDING" ? (
                        <span className="sp sp-o">OPEN</span>
                      ) : isDiscrepant ? (
                        <span className="sp sp-r">DISCREPANT</span>
                      ) : (
                        <span className={`sp ${row.status === "CONFIRMED" ? "sp-g" : row.status === "DISPUTED" ? "sp-r" : "sp-g"}`}>{row.status || "SUBMITTED"}</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {tab === "REVIEW" && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenReview({ task: row, readOnly: false });
                          }}
                          style={{
                            padding: "5px 14px",
                            background: "var(--sc-acc)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Review
                        </button>
                      )}
                      {tab === "SUBMITTED" && <span style={{ fontSize: 11, color: "var(--sc-acc)", fontWeight: 600 }}>View →</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
