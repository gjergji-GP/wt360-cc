# Shipment Engine — Testing

## The harness

`SELECT * FROM run_shipment_engine_tests();` → returns `(test_case, passed)` for 18 cases.

Self-contained and repeatable: seeds real fixtures (shipments, receipts, a fiscal invoice),
exercises the full engine, asserts, and **rolls back all fixtures** (nothing persists — verified
zero residue). Safe to run anytime, including after any future migration or in CI.

Implementation: `_shipment_engine_test_core()` does the work and carries results out via a
`HARNESS_RESULTS:` exception (forcing rollback); `run_shipment_engine_tests()` catches it and
returns the parsed grid.

## The 18 cases

| Case | Proves |
|---|---|
| T1 | CK shipment → NOT_APPLICABLE |
| T2 | CK dispatch raises "adapter not wired" |
| T3 | Vendor shipment → AWAITING_INVOICE |
| T4 | submit_receipt creates receipt + EXPECTED/UNEXPECTED lines |
| T5 | Generated variance_qty = -2 (DB computes, engine doesn't) |
| T6 | Finance blocked before SC handoff (cross-field invariant) |
| T7 | Partial acceptance posts exactly 25 (accepted), rejects 3 |
| T7b | receipt_status → PARTIALLY_ACCEPTED |
| T8 | Idempotency: re-accept refused, no extra ledger rows |
| T9 | sc_confirm_handoff → SC_CONFIRMED_HANDOFF |
| T10 | Phantom invoice rejected (existence check) |
| T11 | match_invoice → INVOICE_MATCHED after handoff |
| T12 | Dispute back-edge INVOICE_MATCHED → INVOICE_DISPUTED |
| T13 | Full finance chain → PAID |
| T15 | SC dispute → DISPUTED_BY_SC, ledger untouched |
| T16 | Finance blocked while DISPUTED_BY_SC |
| T17 | shipment_events immutable (UPDATE + DELETE blocked) |
| T18 | stock_ledger append-only (UPDATE blocked) |

Latest run: **18/18 pass.**

## Three encoded harness lessons

Learned during Sprint A dry runs; baked into the harness as correct patterns:

1. **Deterministic selection** — never select a row by positional `created_at ASC/DESC`; rows
   inserted in one transaction share a timestamp and the order is ambiguous. Select by a
   distinguishing attribute (`line_type`, `expected_qty`, etc.).
2. **Isolated exception scopes** — never bundle a real state change with an expected-failure call
   in the same `BEGIN...EXCEPTION` block. A caught exception rolls back the whole subtransaction,
   silently undoing the state change. Each should-fail assertion gets its own scope with nothing
   else in it.
3. **Seed-and-rollback** — create real fixtures inside a subtransaction that always rolls back;
   never assume test data can be cleaned up afterward.

## Dry-run discipline (how Sprint A was built)

Every migration was proven in a `DO $$ ... RAISE EXCEPTION 'DRY RUN OK'` rollback block against
real data before `apply_migration`. This caught, pre-commit and with zero production impact:
- `receiving_tickets_source_check` didn't allow SHIPMENT (→ M3.6)
- `variance_qty`/`variance_pct` are GENERATED ALWAYS (→ removed from inserts)
- `line_type` CHECK didn't allow SHIPMENT (→ use EXPECTED/UNEXPECTED)
- three test-harness bugs (positional ordering, bundled exception scope, phantom invoice)

None reached production.
