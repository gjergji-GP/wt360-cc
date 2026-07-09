# Receiving Flow Reconciliation — Cases A / B / C

Status: Draft (reconciliation only — no design, no UI decisions yet)
Owner: Platform Architecture
Version: 1.0
Last Updated: 2026-07-09
Depends On: docs/workspaces/receiving-workspace.md, ADR-001, ADR-002

Purpose: Document what ALREADY EXISTS in the backend for the three ways stock arrives at a location, before deciding any UI shape. The rule that governs receiving: **what exists before the goods do.**

---

## The three cases

| Case | What exists first | Example |
|---|---|---|
| **A — CK expected shipment** | Information (the shipment) precedes goods | CK dispatches to Blloku; goods follow; RM confirms against expected qty |
| **B — blind / unplanned receipt** | Goods precede information | Supplier truck arrives, no PO/invoice/shipment in system; RM declares what arrived; SC/Finance reconcile later |
| **C — SC/vendor expected receipt** | Information (invoice/PO/expectation) precedes goods | SC/procurement pushes an expected order; RM confirms against it when goods arrive |

---

## CASE A — CK expected shipment  →  BUILT & PROVEN (Phase 1.1)

- Path: `dispatch_shipment` (CK adapter) → shipment `DISPATCHED` → `list_receivable_shipments` / `get_receivable_shipment` (read) → `submit_receipt` (creates `receiving_tickets` row, SUBMITTED) → acceptance (`operationally_accept_receipt`) posts ledger IN.
- UI: Confirm Arrival (v127), proven in production 2026-07-09.
- Two-statement model: Confirm Arrival (receipt) ≠ Accept Inventory (ledger). Verified.

**Status: complete. Not in question here.**

---

## CASE B — blind / unplanned receipt  →  BACKEND EXISTS, FULLY IMPLEMENTED, NOT WIRED TO UI

Two real, non-stub functions exist. Both are **safe by design** — they do NOT post to `stock_ledger` and do NOT require a mapped SKU at receive time. This is the critical finding: **the dangerous part (goods-first, possible unmapped SKU) is deliberately deferred to an SC allocation step, not posted to inventory blindly.**

### `initiate_blind_receiving(p_location_id, p_vendor_name, p_note, p_lines)`
- Creates a `receiving_tickets` row: `status='SUBMITTED'`, `source='BLIND'`, `reconciliation_status='PENDING_ALLOC'`, stores `blind_vendor_name`, `blind_note`.
- Inserts `receiving_lines` with `line_type='BLIND'`, storing **`sku_name_raw`** (a typed/scanned name string — NOT a mapped `sku_id`), plus received_qty, uom, unit_price.
- Fires a task `SC_BLIND_ALLOCATE` assigned to SUPPLY_CHAIN_MANAGER: "attach allocation."
- Returns `{ticket_id, sc_task_id, status: PENDING_ALLOC}`.

### `initiate_unplanned_receiving(p_location_id, p_note, p_lines)`
- Same shape, `source='UNPLANNED'`, `line_type='UNPLANNED'`, stores `sku_name_raw` from `group_name`.
- Fires `SC_UNPLANNED_ALLOCATE` task to SC: "received without a purchase order. Review and allocate."

**Key architectural facts for Case B:**
1. **No ledger posting at receive time.** The goods are recorded as a ticket in `PENDING_ALLOC`, NOT as stock. Inventory is only affected later, after SC allocates/maps the raw names to real SKUs. This respects hard-invariant #22 (no ghost SKUs enter stock) — the raw name sits in `sku_name_raw` until a human maps it.
2. **The unmapped-SKU danger is handled by deferral, not by blocking.** The operator can receive an unknown product (types its name); it becomes SC's job to map it. Stock doesn't move until that mapping happens.
3. **This is a fundamentally different flow from Case A.** Case A receives *against* an expected shipment; Case B *creates* the record from nothing and hands a reconciliation task to SC.

**Status: backend built & internally coherent. NO UI. NOT reconciled against the shipment engine (these write receiving_tickets directly, they do not create a `shipment`).** Whether these should relate to the shipment engine at all is an open question (see §Open Questions).

---

## CASE C — SC/vendor expected receipt  →  PARTIAL; TASK-BASED, NOT SHIPMENT-ENGINE-BASED

Case C machinery exists but is built on the **older task/PO model**, not the shipment engine:

- `create_receiving_ticket_from_task_as(p_auth_user_id, p_task_id, p_location_id, p_notes)`: creates a DRAFT `receiving_tickets` row from a **task**, copying expected SKUs from **`procurement_task_lines`** (line_type='EXPECTED', sku_id populated). This is the "invoice/PO expectation exists → receive against it" path — but sourced from a procurement task, not a shipment.
- `submit_receiving_ticket(p_task_id, p_fiscal_invoice_id, ...)`: submits a ticket WITH a fiscal invoice (invoice-first).
- `match_invoice_to_shipment(p_auth_user_id, p_shipment_id, p_invoice_id, p_matched)`: **this one IS shipment-engine-aware** — sets `receiving_tickets.financial_status` to INVOICE_MATCHED/DISPUTED, writes a `shipment_events` row. This is the reconciliation bridge between an invoice and a shipment-engine receipt.
- `finance_link_invoice_to_receiving(p_fiscal_invoice_id, p_receiving_ticket_id, p_notes)`: Finance links a fiscal invoice to a receiving ticket, closes the `RECEIVING_WITHOUT_INVOICE` watchdog task, writes audit_trail.

**Key architectural facts for Case C:**
1. There are **TWO expectation sources** in the codebase: the **shipment engine** (Case A, `shipments`/`shipment_lines`) and the **procurement task model** (`procurement_task_lines` + `tasks`). Case C currently lives in the *task* model.
2. `match_invoice_to_shipment` shows the intended reconciliation: a receipt (from either model) gets an invoice matched to it, tracked via `financial_status` on the ticket + a shipment_event.
3. The `financial_status` field on `receiving_tickets` (AWAITING_INVOICE / INVOICE_MATCHED / INVOICE_DISPUTED) is the backbone of invoice-reconciliation for both B and C.

**Status: backend exists but split across two models (task-based + shipment-engine). Not unified. This is the tangle.**

---

## What this reconciliation reveals (the honest picture)

1. **All three cases have real backend.** None is greenfield. Case A is proven; B is built-but-unwired; C is built-but-on-the-old-task-model.

2. **The danger in Case B is already handled** — by NOT posting to ledger at receive time and deferring SKU mapping to an SC allocation task. A casual UI could still misuse it, but the backend won't let unmapped goods become stock. That's the invariant holding.

3. **The real tangle is Case C**, because the platform has **two parallel expectation models**: the shipment engine (`shipments`) and the procurement task model (`procurement_task_lines`/`tasks`). Case A is shipment-engine. Case C's existing functions are task-model. The old `RMReceiving` UI (still in the file) is task-model. Confirm Arrival (new) is shipment-engine. **These two models coexist and overlap — that is the architectural debt to resolve before adding UI.**

4. **`receiving_tickets` is the shared spine.** All three cases produce a `receiving_tickets` row; they differ in `source` (CK-shipment vs BLIND vs UNPLANNED vs task/PO) and in what expectation they receive against. `financial_status` + `reconciliation_status` track the invoice side.

---

## Open questions (to answer BEFORE any UI design)

1. **Two expectation models — converge or coexist?** Should Case C be migrated onto the shipment engine (a WAREHOUSE/vendor `source_type` shipment, reusing Confirm Arrival), or stay on the procurement-task model? This is the biggest decision. Converging means the deferred WAREHOUSE adapter + reusing the proven UI; coexisting means maintaining two receiving paths forever.
2. **Should Case B relate to the shipment engine at all,** or is "no expectation" fundamentally outside the shipment model (a ticket that never had a shipment)? Current design: B is ticket-only, no shipment. That may be correct — a blind receipt has no shipment because nothing was dispatched.
3. **Does the new Confirm Arrival replace the old task-based `RMReceiving`,** or do they serve different cases (new = A, old = C)? Right now both are in the file. This is the "retire old flow" decision, now entangled with Case C.
4. **SKU mapping for Case B:** where does `sku_name_raw` → `master_products.id` happen? Is there an SC allocation UI/RPC, or is that also unbuilt? (Not yet reconciled — the `SC_BLIND_ALLOCATE` task exists but the allocation *action* wasn't in this pass.)

---

## Recommended next step (NOT taken yet)

Reconcile the **SC allocation side** — what happens to a `PENDING_ALLOC` ticket after SC picks up the `SC_BLIND_ALLOCATE` / `SC_UNPLANNED_ALLOCATE` task. That closes the Case-B loop understanding. AND decide open-question #1 (converge vs coexist the two expectation models), because that governs whether Case C is "reuse Confirm Arrival" or "separate flow." Only then design UI.
