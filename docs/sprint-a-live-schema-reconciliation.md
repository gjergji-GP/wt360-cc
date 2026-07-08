# Sprint A — Live Schema Reconciliation (Task 0)

**WT360 Shipment / Receipt / Acceptance Engine**
Project: `knquzjqxhduyxxljuede` · Reconciled against live production schema.
Status: **Task 0 complete. No migrations written. This document gates all Sprint A DDL.**

---

## Governing principles (adopted after Task 0)

These replace the execution document's original rule *"do not patch the GRN flow"*, which
was written without knowledge of how much of the target lifecycle already exists live.

1. **Reuse proven operational infrastructure. Replace only conceptual deficiencies.**
   Every reuse/replace decision below is justified against this test.

2. **Do not let procurement concepts leak into the Shipment Engine.**
   This — not "never patch the old system" — is the real architectural boundary.
   Whether `receiving_tickets` remains the physical storage table is an implementation
   detail. Whether the *engine* ever reads a procurement column is not.

**Chosen strategy: Option 3 (Hybrid).**
New domain spine (`shipments`, `shipment_lines`, `shipment_events`) sits above a
*generalized* receipt persistence (`receiving_tickets` / `receiving_lines`), and posts
stock exclusively through the existing canonical ledger gateway. No duplicate receipt
tables. No duplicate ledger. No duplicate reconciliation.

---

## Critical finding 1 — The ledger has a canonical, guarded posting gateway

`stock_ledger` is triple-guarded. Direct INSERT is **impossible** from a normal session:

| Guard trigger | Function | Effect |
|---|---|---|
| `prevent_stock_ledger_update` / `_delete` | `prevent_ledger_modification()` | Append-only: UPDATE/DELETE blocked |
| `trg_guard_ledger_direct_insert` | `guard_ledger_direct_insert()` | INSERT blocked unless `app.ledger_insert_authorized='on'` |
| `trg_guard_ledger_direct_write` | `trg_guard_ledger_direct_write()` | INSERT blocked unless `app.ledger_write_authorized='on'` |
| `trg_enforce_stock_ledger_brand_match` | brand consistency | brand_id must match location |
| `trg_enforce_stock_ledger_correction` | correction doctrine | correction rows constrained |
| `trg_stock_ledger_fill_brand_id` / `_group_id` | auto-derivation | brand_id/group_id auto-filled |

Plus two `NOT VALID` CHECKs: `correction_of` requires `movement_type='ADJUST'`;
`created_by` NOT NULL.

**The only legal way to post stock** is the canonical gateway, which arms the sentinel,
inserts, disarms, and audits:

- `post_stock_ledger_movement_as(p_auth_user_id, p_location_id, p_product_id,
  p_movement_type, p_quantity, [p_unit_price], [p_po_line_id], [p_note],
  [p_receiving_ticket_id], [p_receiving_line_id], [p_correction_of], [p_transfer_ref])`
  — richest overload; resolves employee from `auth_user_id`, derives brand from location,
  enforces the **quarantine gate** on `po_line_id`, writes `log_audit(... 'LEDGER_POSTED')`.
- `internal_post_ledger(p_employee_id, p_brand_id, p_location_id, p_product_id,
  p_movement_type, p_quantity, [p_notes], [p_correction_of])`
  — lower-level; takes employee_id + brand directly.

Legal `movement_type` values: `IN`, `OUT`, `ADJUST`, `COUNT_ADJUSTMENT_IN`,
`COUNT_ADJUSTMENT_OUT`, `SALE_OUT`, `SALE_RETURN`, `SALE_WASTE`.

### Disposition — MANDATORY GATEWAY, DO NOT WRAP
The Shipment Engine **calls** `post_stock_ledger_movement_as(...)` for every stock
movement. It does **not** insert into `stock_ledger`, does not set the sentinel itself,
does not create a parallel posting function. This is `LedgerService.post` with a single,
battle-tested implementation.

**Correction of the execution document:** Task 5's `operationally_accept_receipt` and the
CK dispatch must be re-specified as *callers* of the gateway, not as ledger writers.
This removes an entire risk class the greenfield framing would have introduced.

---

## Critical finding 2 — The ledger already carries generic source tracing

`stock_ledger` has `source_type text` and `source_id uuid` (nullable), plus dedicated
`receiving_ticket_id`, `receiving_line_id`, `po_line_id`, `correction_of` FKs.

Live `source_type` values in use: `POS_SALE`, `POS_CANCEL`, `TEST_SEED`.

### Disposition — REUSE, NO DDL
Shipment-originated movements trace via the existing `receiving_ticket_id` /
`receiving_line_id` link (goods-first / vendor) and via `transfer_ref` (CK rail). No new
ledger columns. If a first-class `source_type='SHIPMENT'` tag is wanted it is a **data**
convention, not schema change. **Zero ledger DDL in Sprint A.**

---

## Critical finding 3 — `receiving_tickets` already implements ~70% of the target lifecycle

This is the finding that determined the Hybrid choice. The live table is far richer than
the thin `submit_grn` "invoice pending" side-door implied.

`receiving_tickets` live columns include:

- Lifecycle: `status` (live: `SUBMITTED`), `ledger_posted_at`, `submitted_at/by`
- Source discriminator: `source` (live values: `NORMAL`, `GRN`)
- **SC/reconciliation (already present):** `reconciliation_status`
  (live: `NOT_REQUIRED`, `PENDING_ALLOC`), `sc_allocated_at`, `sc_allocated_by`,
  `reconciled_at`, `reconciled_by`, `reconcile_delta_pct`, `dispute_note`
- **Invoice link (already present):** `fiscal_invoice_id` (nullable),
  `invoice_attached_at`, `invoice_attached_by`
- `location_id`, `brand_id`, `task_id`, `transaction_ref`

`receiving_lines` already carries: `expected_qty`, `received_qty`, `variance_qty`,
`variance_pct`, `condition_state`, `lot_number`, `expiry_date`, `line_note`, `unit_price`,
`uom`, `po_line_id`, `sku_id` (+ `sku_name_raw` for unmapped), snapshot columns.

### Disposition — GENERALIZE behind a domain boundary (not "extend", not "duplicate")
`receiving_tickets` / `receiving_lines` become the **persistence implementation of
Receipt**. We do NOT create `receipts` / `receipt_lines` duplicates. We add a **domain
spine** the engine owns, and firewall the existing procurement columns as adapter-private.

**Domain spine added to `receiving_tickets` (engine-owned):**
- `shipment_id uuid` → link up to the domain (nullable during migration; NOT NULL for
  engine-created receipts)
- `sc_confirmation_status text` → `PENDING_SC_REVIEW` / `SC_CONFIRMED_HANDOFF` /
  `DISPUTED_BY_SC`
- `financial_status text` → `NOT_APPLICABLE` / `AWAITING_INVOICE` / `INVOICE_MATCHED` /
  `INVOICE_DISPUTED` / `INVOICE_REJECTED` / `FINANCIALLY_ACCEPTED` / `READY_FOR_PAYMENT` /
  `PAID`
- `receipt_status text` → `DRAFT` / `SUBMITTED` / `OPERATIONALLY_ACCEPTED` /
  `OPERATIONALLY_REJECTED` / `PARTIALLY_ACCEPTED` / `CANCELLED`
- `quantity_source` lives on the line: `BARCODE_TRUSTED` / `MANUALLY_COUNTED` /
  `RE_MEASURED` / `SYSTEM_IMPORTED`

**Adapter-private (engine MUST NOT read):** `fiscal_invoice_id`, `sc_allocated_at/by`,
`invoice_attached_at/by`, `reconcile_delta_pct`, `dispute_note`, `source`,
`procurement_task` linkage. These are the **vendor adapter's** state. The mechanical rule:
engine code references a receipt only via `shipment_id` and domain RPCs — it never SELECTs
a procurement column. That firewall, not table placement, is what keeps procurement
concepts out of the engine.

**Backfill:** existing 10 `receiving_tickets` rows get `financial_status` derived from
their current state, `sc_confirmation_status` defaulted, `receipt_status` mapped from
`status`, `shipment_id` NULL (legacy, pre-engine). No live transfer/CK data to migrate.

---

## Critical finding 4 — The CK rail already exists at the DB level

- `inventory_transfers` (`from_location_id`, `to_location_id`, `status` default `PENDING`,
  `initiated/shipped/received_by`+`_at`, `ship_task_id`, `receive_task_id`,
  `transfer_ref`) + `inventory_transfer_lines` (`requested/shipped/received_qty`,
  `variance_qty`). **`transfer_rows = 0`** — built, never used, not wired into the app.
- RPCs present: `create_inventory_transfer`, `ship_inventory_transfer`,
  `receive_inventory_transfer`.
- `stock_transfers` — simpler single-product variant with explicit `out_ledger_id` /
  `in_ledger_id`.
- `production_batches` / `production_batch_lines` — CK production source with
  `output_product_id`, `actual_output_qty`, BOM version link, `posted_at/by`; +
  `ck_post_production` / `ck_post_production_with_actuals`. **5 batch rows live.**

### Disposition — REUSE for CK adapter (Sprint B minimal / Sprint C operational)
The CK source plugs into the Shipment Engine via the existing transfer + production
primitives. Because `transfer_rows = 0`, there is no live data to migrate — clean wiring,
not a rebuild. Sprint A only needs the engine to *recognize* `source_type=CENTRAL_KITCHEN`
in the domain model; actual CK wiring is the Sprint B minimal proof.

---

## Critical finding 5 — Watchdog and reconciliation infrastructure partly exists

Already live (reuse and extend, do not rebuild):
- `v_watchdog_receiving_without_invoice_stale` → **the awaiting-invoice watchdog** we
  designed
- `v_reconciliation_queue` → the SC reconciliation cockpit feed
- `v_watchdog_receiving_ticket_pending_review`, `wd_receiving_disputed_stale`,
  `v_watchdog_ghost_receiving`, `v_watchdog_receiving_unmapped_expected`,
  `v_watchdog_sc_allocation_stale`, `v_watchdog_invoice_approved_not_paid`,
  `wd_invoice_approved_unpaid`, `wd_negative_stock`, `v_stock_on_hand`,
  `v_inventory_valuation`

### Disposition — REUSE + EXTEND
New Sprint A watchdogs (depletion-aware escalation; SC-review; in-transit) are added as
**new views alongside** the existing family, keyed off the new domain columns. The
awaiting-invoice watchdog is *re-pointed* at `financial_status = AWAITING_INVOICE` rather
than reinvented.

---

## The one genuinely new domain layer

`shipment_events` does not exist and must be built. Events today are fragmented across
`audit_trail`, `task_events`, and per-table timestamp columns. `shipment_events` becomes
the **single immutable stream** that dashboards, watchdogs, audit, replay, and
notifications subscribe to. This is a real conceptual gain, not a duplication — it
qualifies for build under principle 1 (it is a conceptual deficiency, not existing infra).

---

## Live lifecycles, as they actually are (not as the PRD describes)

**Receiving (live):** `receiving_tickets.status` currently only shows `SUBMITTED` across
10 rows; `source ∈ {NORMAL, GRN}`; `reconciliation_status ∈ {NOT_REQUIRED, PENDING_ALLOC}`.
The `submit_receiving_ticket` RPC (invoice-led, reads `sc_delivery_allocations` by
`fiscal_invoice_id`) and `submit_grn` RPC (invoice-pending manual) both exist and both
write here.

**Invoice (live):** `fiscal_invoices.status ∈ {PENDING, CLASSIFIED, APPROVED_FOR_PAYMENT,
IGNORED}`. RPCs: `approve_invoice_for_payment`, `mark_invoice_paid`. The engine's
`financial_status` is a **parallel domain field** on the receipt; it does not replace
`fiscal_invoices.status` — it references it. The vendor adapter (Sprint B) reconciles the
two; the engine never reads `fiscal_invoices` directly.

**Ledger (live):** movement types in use `IN`, `OUT`, `SALE`; source_types `POS_SALE`,
`POS_CANCEL`, `TEST_SEED`. Gateway as Finding 1.

---

## Preserve / Generalize / Replace — component disposition

| Component | Live status | Disposition | Justification (principle 1) |
|---|---|---|---|
| `stock_ledger` + guards | Mature, triple-guarded | **PRESERVE, mandatory gateway** | Proven infra; no deficiency |
| `post_stock_ledger_movement_as` | Battle-tested | **PRESERVE, call directly** | Proven infra; wrapping adds risk |
| `receiving_tickets/_lines` | 70% of lifecycle | **GENERALIZE (add domain spine)** | Proven infra + conceptual gap (no source-agnostic spine) |
| `inventory_transfers/_lines` | Built, unused (0 rows) | **REUSE for CK rail** | Proven design; no data to migrate |
| `production_batches` | Live (5 rows) | **REUSE as CK source** | Proven infra |
| `v_reconciliation_queue` + watchdogs | Live | **REUSE + EXTEND** | Proven infra |
| `shipments` / `shipment_lines` | Do not exist | **BUILD** | Conceptual deficiency: no domain head |
| `shipment_events` | Fragmented today | **BUILD** | Conceptual deficiency: no unified stream |
| domain status enums (sc/financial/receipt) | Do not exist | **BUILD (on generalized receipt)** | Conceptual deficiency: no acceptance split |

---

## Impact on the execution document's Sprint A tasks

- **Task 2 (Create Core Tables):** `receipts` / `receipt_lines` are **NOT created**.
  Replaced by "generalize `receiving_tickets` / `receiving_lines` with domain spine".
  `shipments`, `shipment_lines`, `shipment_events` created as specified.
- **Task 4 / Task 5 (Ledger rules / RPCs):** ledger posting is **not implemented** in the
  engine — every posting RPC *calls* `post_stock_ledger_movement_as(...)`. Re-specify
  `operationally_accept_receipt`, CK dispatch as gateway callers.
- **Task 6 (Watchdogs):** re-point/extend existing views; do not rebuild the
  awaiting-invoice watchdog.
- All other tasks (enums, guards, events, tests, docs, done-conditions) stand.

---

## Open confirmations still required before Sprint A DDL

1. **Enum edge closures** (from prior lock): dispute back-edge `INVOICE_MATCHED →
   INVOICE_DISPUTED`; `NOT_APPLICABLE` immutable/source-determined; cross-field invariant
   scoped to `financial_status <> NOT_APPLICABLE`.
2. **Hybrid boundary sign-off:** the firewall rule (engine references receipts only via
   `shipment_id` + domain RPCs; never reads procurement columns) is the enforceable form
   of "no procurement leakage". Confirm this is the boundary to enforce in review.
3. RPC-body deep reads (`submit_receiving_ticket`, `ck_post_production_with_actuals`,
   `create/ship/receive_inventory_transfer`) — deferred to their respective wrapping
   tasks; not needed to finalize the schema, needed at implementation of each adapter.
