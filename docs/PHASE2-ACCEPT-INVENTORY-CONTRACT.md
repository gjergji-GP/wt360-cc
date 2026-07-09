# Phase 2 — Accept Inventory — Reconciliation & Execution Contract

Status: Draft (approve before building)
Owner: Platform Architecture
Version: 1.0
Last Updated: 2026-07-09
Depends On: docs/RECEIVING-FLOW-RECONCILIATION.md, ADR-008, UI-RECONCILIATION-REPORT (Phase 1.1)

Purpose: Close the SECOND statement of the two-statement model in the UI. Phase 1.1 proved "goods arrived" (submit_receipt → receipt). Phase 2 proves "stock accepted into inventory" (operationally_accept_receipt → ledger IN). Case A only.

---

## Reconciled facts (verified against DB 2026-07-09)

### 1. The write function — `operationally_accept_receipt(p_auth_user_id, p_receipt_id, p_lines)` → jsonb
Fully built, validated in Sprint B / B8. Per-line `p_lines` shape:
```
{ receiving_line_id, accepted_qty, rejected_qty, reason_code, reason_note }
```
Behavior (already enforced server-side — UI does NOT duplicate):
- `accepted_qty + rejected_qty <= received_qty` (else raises).
- `reason_code` REQUIRED when `rejected_qty > 0`.
- `reason_code = 'OTHER'` requires `reason_note`.
- Posts ledger IN of `accepted_qty` per line (via gateway).
- Sets `receipt_status` = OPERATIONALLY_ACCEPTED (all accepted) or PARTIALLY_ACCEPTED (any rejected).
- Advances shipment → RECEIVED / PARTIALLY_RECEIVED.
- Writes shipment_events (accept event + LEDGER_POSTED).
- Guards double-post via `ledger_posted_at IS NOT NULL` → refuses.

### 2. Reason code enum (CHECK on receiving_lines.rejection_reason)
`DAMAGED, TEMPERATURE, EXPIRED, WRONG_ITEM, SHORT_SHIPMENT, QUALITY, PACKAGING, CONTAMINATION, OTHER`

### 3. Permission — `receiving.accept`
Granted to: RESTAURANT_MANAGER, LOCATION_MANAGER, SYSTEM_ADMIN. (Test RM has it.)

### 4. Receiving-line columns for acceptance
`id, received_qty, accepted_qty, rejected_qty, condition_state, rejection_reason, line_note, sku_id, uom` — all present.

### 5. Ticket status columns — CRITICAL: there are TWO
- `status` — workflow lifecycle; currently only 'SUBMITTED'.
- **`receipt_status`** — acceptance tracking: SUBMITTED → OPERATIONALLY_ACCEPTED / PARTIALLY_ACCEPTED. **This is the column that matters for the accept queue.**
- `ledger_posted_at` — set on accept; hard double-post guard.
- Also: `operationally_accepted_at/by`, `shipment_id`, `location_id`, `submitted_by`.

**"Awaiting acceptance" filter = `receipt_status = 'SUBMITTED'` AND `ledger_posted_at IS NULL`.**

### 6. THE GAP — no read path for acceptance
Only `list_receivable_shipments` / `get_receivable_shipment` exist (pre-submit / Confirm Arrival). There is NO endpoint to list submitted receipts awaiting acceptance, nor to fetch a receipt's lines for the accept screen. RLS-deny on the tables. **This is the one permitted backend addition** — reconciliation proves the read capability is absent (same justification as Phase 1.1, per the read-RPC precedent + ADR-007).

---

## The one permitted backend addition — two typed read RPCs (ADR-007 shape)

**`list_acceptable_receipts(p_auth_user_id, p_limit, p_offset)`** RETURNS TABLE — queue headers:
- receipt_id, shipment_id, source/destination names, submitted_at, line_count, total_received_qty
- filter: receipt at actor's location, `receipt_status='SUBMITTED'`, `ledger_posted_at IS NULL`
- gate: `has_perm('receiving.accept', p_auth_user_id)`

**`get_acceptable_receipt(p_auth_user_id, p_receipt_id)`** RETURNS TABLE — detail lines:
- header (repeated per row): receipt_id, source/dest names, submitted_at
- per line: receiving_line_id, product_id, sku_code, product_name, received_qty, uom
- location-scope guard (refuse cross-location receipt ids), same as get_receivable_shipment
- gate: `has_perm('receiving.accept', ...)`
- expose ONLY fields the accept screen renders (ADR-007).

Read-only, STABLE, SECURITY DEFINER. No business logic. No status mutation.

---

## The UI slice (smallest, incremental — mirrors Phase 1.1 discipline)

Home: RestaurantManagerCC `rm-receive` page already renders RMReceivePage (Confirm Arrival). Accept Inventory is a SECOND surface. Placement TBD (decision below).

Flow:
```
Submitted-receipts queue (list_acceptable_receipts)
  → open receipt (get_acceptable_receipt)
  → per line: accepted_qty + rejected_qty inputs
  → if rejected_qty > 0: reason_code required (dropdown of 9 enum values); OTHER → reason_note
  → Accept button → operationally_accept_receipt
  → ledger IN posts; receipt leaves queue
  → toast: "Inventory accepted" (or "Partially accepted")
```

Increments:
1. Acceptable-receipts queue (list + loading/empty/error).
2. Receipt detail (lines with received_qty shown).
3. Accept/reject entry + reason dropdown + submit.
4. UX polish (permission-aware, busy state) — deferred, informed by first render.

---

## Placement decision (needs approval)
Confirm Arrival (Phase 1.1) lives in the `rm-receive` page. Accept Inventory is a distinct step. Options:
- **(A) Same page, two sections/tabs** ("To Receive" / "To Accept") — one Receiving surface, two queues. Recommended: keeps receiving unified, matches the two-statement mental model.
- **(B) Separate nav item** ("Acceptance") — more discoverable but splits receiving across two tabs.

Recommendation: (A) — a segmented control at the top of rm-receive: "Incoming" (Confirm Arrival) | "To Accept" (Accept Inventory). One module, two statements, visible together.

---

## Non-goals (out of scope, do NOT build)
blind receiving · Case C convergence · attachments · draft events · old RMReceiving cleanup · the Receiving-tab badge fix.

## Success definition (Phase 2 complete when)
- ✓ RM sees submitted receipts awaiting acceptance.
- ✓ Receipt lines load with received_qty.
- ✓ Per-line accept/reject entry; reason required on rejection; OTHER requires note.
- ✓ operationally_accept_receipt succeeds → ledger IN posts.
- ✓ Receipt leaves the acceptance queue.
- ✓ Shipment advances to RECEIVED / PARTIALLY_RECEIVED.
- ✓ Backend errors surface verbatim.
- ✓ No backend logic changed beyond the two read RPCs.

## Execution order
1. Build + verify the two read RPCs (this is the backend step; verify against DB with a real submitted receipt).
2. Queue UI.  3. Detail UI.  4. Accept/reject + reason + submit.  5. Verify end-to-end.  6. Clean up test residue (append-only).
