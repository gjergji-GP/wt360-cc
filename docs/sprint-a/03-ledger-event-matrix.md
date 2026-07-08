# Shipment Engine — Ledger & Event Matrix

## The mandatory ledger gateway

`stock_ledger` is triple-guarded; direct INSERT is impossible from a normal session. The
**only** legal way to post stock is:

```
post_stock_ledger_movement_as(
  p_auth_user_id, p_location_id, p_product_id, p_movement_type, p_quantity,
  p_unit_price, p_po_line_id, p_note, p_receiving_ticket_id, p_receiving_line_id,
  p_correction_of, p_transfer_ref)
```

It resolves employee from `auth_user_id`, derives brand from location, arms/disarms the
sentinel, enforces the quarantine gate on `po_line_id`, and audits via `log_audit`.

**Engine rule:** every stock movement calls this gateway. No raw inserts. No parallel posting
function. No sentinel manipulation in engine code.

## Sprint A ledger behavior

| RPC | Ledger action | Notes |
|---|---|---|
| `create_shipment` | none | expectation only |
| `dispatch_shipment` | none in Sprint A | CK source-side OUT raises "adapter not wired" → Sprint B |
| `submit_receipt` | none | receipt recorded, not posted |
| `operationally_accept_receipt` | **IN** per accepted line | `po_line_id=NULL` (no PO → bypasses quarantine gate). Traces via `receiving_ticket_id` + `receiving_line_id`. Idempotent on `ledger_posted_at`. |
| `sc_confirm_handoff` / `sc_dispute_shipment` | none | SC dispute explicitly never touches stock |
| finance track (match/accept/ready/paid) | none | financial track is stock-independent |

**Only `operationally_accept_receipt` posts stock in Sprint A** — and only IN, only for
accepted quantities. Rejected quantities are never posted.

## Source × ledger-event matrix (full design; Sprint A scope noted)

| source_type | dispatch (source side) | receipt/acceptance (dest side) | financial track |
|---|---|---|---|
| EXTERNAL_VENDOR | none (goods from outside) | IN on operational acceptance | full (AWAITING_INVOICE…PAID) |
| CENTRAL_KITCHEN | **OUT at CK** (Sprint B) | IN on operational acceptance | NOT_APPLICABLE |
| WAREHOUSE | OUT at source (Sprint B) | IN on operational acceptance | per policy |
| RESTAURANT / RETURN | OUT at source (Sprint B) | IN on operational acceptance | per policy |
| MANUAL_ADJUSTMENT | none | IN on operational acceptance | AWAITING_INVOICE default |

Sprint A builds the destination-side IN (source-agnostic, safe) for all sources, and the full
financial + SC tracks. Source-side OUT (CK et al.) is deferred to the Sprint B adapters — 
`dispatch_shipment` raises "adapter not wired" for those.

## Idempotency & append-only

- **`ledger_posted_at`** = the hard idempotency gate. `operationally_accept_receipt` refuses if
  already set. `operationally_accepted_at` is the audit stamp; `receipt_status` is descriptive —
  neither is trusted for idempotency.
- **`stock_ledger`** UPDATE/DELETE blocked (append-only). Corrections are new ADJUST rows via
  `correction_of`.
- **`shipment_events`** UPDATE/DELETE blocked (immutable stream).

## Event stream

Every RPC writes a `shipment_events` row. Event types:
`SHIPMENT_CREATED, SHIPMENT_DISPATCHED, SHIPMENT_IN_TRANSIT, RECEIPT_SUBMITTED,
OPERATIONALLY_ACCEPTED, OPERATIONALLY_REJECTED, PARTIALLY_ACCEPTED, SC_CONFIRMED_HANDOFF,
SC_DISPUTED, INVOICE_MATCHED, INVOICE_DISPUTED, INVOICE_REJECTED, FINANCIALLY_ACCEPTED,
READY_FOR_PAYMENT, PAID, LEDGER_POSTED, SHIPMENT_CANCELLED, SHIPMENT_CLOSED`.
