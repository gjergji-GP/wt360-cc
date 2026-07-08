# Shipment Engine — Domain Overview

**Sprint A · WT360 · Project `knquzjqxhduyxxljuede`**
Status: **BUILT & VERIFIED** (18/18 harness cases passing).

## Governing principles

1. **Reuse proven operational infrastructure. Replace only conceptual deficiencies.**
2. **Do not let procurement concepts leak into the Shipment Engine.** Enforced mechanically:
   the engine references a receipt **only** via `receiving_tickets.shipment_id` and domain RPCs —
   it never SELECTs a procurement-private column (`fiscal_invoice_id`, `sc_allocated_at`,
   `reconcile_delta_pct`, `source` values `NORMAL`/`GRN`, etc.).

## Strategy: Hybrid (Option 3)

New domain head sits above a *generalized* receipt persistence, posting stock through the
existing canonical ledger gateway. No duplicate receipt tables, no duplicate ledger, no
duplicate reconciliation.

## Tables

### New (the domain head)
| Table | Role |
|---|---|
| `shipments` | Source-agnostic expected movement. Carries `source_type`, dual-track status. |
| `shipment_lines` | Expected goods. `product_id` already resolved (no barcode/scan detail — that's Sprint D). |
| `shipment_events` | Immutable append-only event stream. Single source of truth for history. |

### Generalized (receipt persistence — `receiving_tickets` / `receiving_lines`)
Domain spine added (engine-owned):
- `receiving_tickets.shipment_id` → link to domain head (NULL for legacy)
- `receiving_tickets.receipt_status` → DRAFT / SUBMITTED / OPERATIONALLY_ACCEPTED / OPERATIONALLY_REJECTED / PARTIALLY_ACCEPTED / CANCELLED
- `receiving_tickets.financial_status` → the Finance-owned track (see state-machine doc)
- `receiving_tickets.sc_confirmation_status` → the SC-owned track
- `receiving_tickets.operationally_accepted_at` / `_by` → acceptance stamp (audit)
- `receiving_lines.accepted_qty` / `rejected_qty` → partial acceptance
- `receiving_lines.quantity_source` → BARCODE_TRUSTED / MANUALLY_COUNTED / RE_MEASURED / SYSTEM_IMPORTED
- `receiving_tickets.source='SHIPMENT'` → identifies engine receipts (distinct from procurement NORMAL/GRN)

Procurement-private columns (engine must NOT read): `fiscal_invoice_id`, `sc_allocated_at/by`,
`invoice_attached_at/by`, `reconcile_delta_pct`, `dispute_note`, and `source ∈ {NORMAL,GRN}`.

### Reused (unchanged)
- `stock_ledger` + triple guards — the mandatory ledger. Engine posts **only** via
  `post_stock_ledger_movement_as(...)`.
- `inventory_transfers` / `production_batches` — for the CK adapter (Sprint B), currently unwired.
- `v_reconciliation_queue` + legacy `v_watchdog_*` — coexist with the new engine watchdogs.

## Authority model

```
shipments          = domain head / expectation
receiving_tickets  = receipt persistence + AUTHORITATIVE lifecycle state
shipment_events    = immutable audit stream
```

The authoritative status lives on the **receipt**, not the shipment. `shipments` has no
transition guard (single authority — avoids two competing state machines). The M1 CHECK
invariants on `shipments` govern only the source↔financial coupling at creation.

## Migration record

| Migration | Content |
|---|---|
| M1 | `shipments` / `shipment_lines` / `shipment_events` + source↔financial CHECK invariants |
| M2 | Generalize receipt: domain spine + 10-row conservative backfill |
| M3 | State-machine guards (append-only events, column-aware transition guard, cross-field invariant) |
| M3.5 | `accepted_qty` / `rejected_qty` + acceptance stamps (partial acceptance) |
| M3.6 | Extend `receiving_tickets.source` to admit `SHIPMENT` |
| M4 G1 | `create_shipment`, `dispatch_shipment` |
| M4 G2 | `submit_receipt`, `operationally_accept_receipt` (ledger IN via gateway) |
| M4 G3+4 | SC track + Finance track RPCs |
| M5 | Four engine watchdog views |
| Task 7 | `run_shipment_engine_tests()` — 18-case repeatable harness |
