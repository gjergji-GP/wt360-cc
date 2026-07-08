# Sprint A — Done-Condition Sign-Off

Status: Frozen
Version: 1.0
Last Updated: 2026-07-08

**Shipment / Receipt / Acceptance Engine · WT360 · `knquzjqxhduyxxljuede`**

## Completion checklist

| # | Done condition | Status | Evidence |
|---|---|---|---|
| 1 | Task 0 live-schema reconciliation before any DDL | ✅ | `sprint-a-live-schema-reconciliation.md`; Hybrid strategy chosen |
| 2 | Domain head tables exist | ✅ | `shipments`, `shipment_lines`, `shipment_events` (M1) |
| 3 | Source↔financial coupling enforced | ✅ | `chk_ship_ck_no_invoice`, `chk_ship_vendor_has_invoice` (M1); dry-run proved both fire |
| 4 | Receipt generalized (not duplicated) | ✅ | `receiving_tickets`/`_lines` domain spine (M2); no `receipts` table created |
| 5 | Legacy rows backfilled conservatively | ✅ | 10 rows, no overstated payment, `shipment_id` NULL (M2) |
| 6 | Partial acceptance supported | ✅ | `accepted_qty`/`rejected_qty` + `chk_rl_accept_reject_bounds` (M3.5); T7 |
| 7 | Append-only event stream | ✅ | `guard_shipment_events_immutable` (M3); T17 |
| 8 | State-machine transition guards | ✅ | `guard_rt_domain_transitions`, column-aware (M3); 13-case M3 dry run |
| 9 | Cross-field invariant (SC handoff gate) | ✅ | in transition guard, scoped to ≠ NOT_APPLICABLE (M3); T6, T16 |
| 10 | NOT_APPLICABLE immutable both ends | ✅ | transition guard (M3); M3 dry run P8a/P8b |
| 11 | Ledger posted ONLY via canonical gateway | ✅ | `operationally_accept_receipt` calls `post_stock_ledger_movement_as`; no raw inserts |
| 12 | Idempotent stock posting | ✅ | `ledger_posted_at` hard gate; T8 |
| 13 | SC track RPCs | ✅ | `sc_confirm_handoff`, `sc_dispute_shipment` (M4 G3); T9, T15 |
| 14 | SC dispute never touches stock | ✅ | T15 (ledger row count identical before/after) |
| 15 | Finance track RPCs | ✅ | match/accept/ready/paid (M4 G4); T11–T13 |
| 16 | Invoice must pre-exist (no phantoms) | ✅ | existence check in `match_invoice_to_shipment`; T10 |
| 17 | Dispute back-edge | ✅ | INVOICE_MATCHED→INVOICE_DISPUTED; T12 |
| 18 | CK dispatch deferred to Sprint B | ✅ | `dispatch_shipment` raises "adapter not wired"; T2 |
| 19 | Engine watchdogs | ✅ | 4 views incl. depletion-aware (M5) |
| 20 | Repeatable test harness | ✅ | `run_shipment_engine_tests()` — 18/18 pass, zero residue |
| 21 | Domain docs | ✅ | 6 docs in `docs/sprint-a/` |
| 22 | Firewall (no procurement leakage) | ✅ | engine touches receipts only via `shipment_id`/RPCs; `source='SHIPMENT'` distinct from NORMAL/GRN |

## Scope boundary confirmed

**In Sprint A (source-agnostic engine):** creation, dispatch state, receipt, operational
acceptance + destination-side ledger IN, SC track, Finance track, watchdogs, tests, docs.

**Deferred to Sprint B (adapters):** CK source-side ledger OUT, vendor procurement bridge, and
the CK-minimal abstraction proof. `dispatch_shipment` raises "adapter not wired" for
CENTRAL_KITCHEN/WAREHOUSE/RESTAURANT/RETURN — the seam where adapters plug in.

**Deferred to Sprint D:** `product_barcodes` / identity resolution / barcode-trust switch — the
engine receives a resolved `product_id` and never sees scan detail.

## Zero-impact guarantees upheld

- No ledger schema change (reused `source_type`/`source_id`, dedicated FKs).
- No procurement RPC altered; column-aware guard leaves legacy writes untouched.
- Legacy `v_watchdog_*` family intact; engine watchdogs additive.
- All 10 legacy receipts backfilled truthfully; no synthetic shipment history.

## Sign-off

Sprint A is **complete and verified**. The source-agnostic Shipment Engine — domain head,
generalized receipt, dual-acceptance model, SC/Finance boundary, mandatory ledger gateway,
immutable event stream, watchdogs, and a repeatable 18-case harness — is live in production with
zero disruption to existing flows.

Ready for **Sprint B: first adapters** (vendor complete + CK minimal) onto the unchanged engine.
