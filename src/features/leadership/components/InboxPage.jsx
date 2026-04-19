export function LeadershipInboxPage({ inbox, search, helpers }) {
  const { fmtAgo } = helpers;

  const q = search.toLowerCase();
  const filtered = inbox.filter((m) => !q || (m.subject || m.message_type || "").toLowerCase().includes(q));

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            No messages.
          </div>
        ) : (
          filtered.map((n, i) => (
            <div
              key={n.receipt_id}
              style={{
                display: "flex",
                gap: 13,
                padding: "16px 22px",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--divider)" : "none",
                background: n.is_unread ? "rgba(29,107,243,.025)" : "transparent",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: n.is_unread ? "var(--acc)" : "var(--divider)",
                  flexShrink: 0,
                  marginTop: 6,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: n.is_unread ? 600 : 400 }}>
                  {n.subject || n.message_type || "Message"}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{fmtAgo(n.sent_at)}</div>
              </div>
              {n.requires_ack_pending && (
                <span className="badge badge-o" style={{ alignSelf: "center" }}>
                  ACK needed
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
