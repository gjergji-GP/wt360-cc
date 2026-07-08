# ADR-006: FOR UPDATE lock is minimum correctness, not optimization

Status: Accepted
Date: 2026-07 (Sprint B / B2, B5)

## Context
`dispatch_shipment` and `submit_receipt` both read a shipment's state, decide whether an action is legal, then mutate (post ledger movements / create a receipt). Under a client retry, automation, scanner, or offline-sync path, two calls can interleave: both read the same pre-mutation state, both pass the guard, both mutate. For dispatch that is a double stock depletion; for submit that is two receipts against one shipment.

## Decision
Both RPCs lock the shipment row with `SELECT ... FOR UPDATE` before validating status and mutating. The lock serializes concurrent calls: the second transaction blocks until the first commits, then re-reads the now-advanced state and refuses. This is treated as part of exactly-once correctness — not a performance optimization to be added later.

## Consequences
- Dispatch posts exactly one OUT per line even under concurrent retry (the "exactly one OUT" adapter invariant — see ADR-004 and the CK adapter constitution).
- Submit enforces one-shipment-one-receipt under concurrency, not only sequentially.
- The status guard alone closes only the sequential case; the lock is what closes the concurrent case. Both are required.
- Append-only ledger (ADR-001) is the backstop: even if a double-post were somehow attempted, movements cannot be silently reconciled away — they would be visible. Lock + status guard + append-only together give exactly-once.
- Runtime-validated in Sprint B / B8 (dispatch and acceptance ran end-to-end; re-dispatch and unauthorized paths refused).

## References
`dispatch_shipment`, `submit_receipt`; ADR-001 (append-only), ADR-004 (adapter owns no business logic); docs/domains/shipment-engine/09-ck-dispatch-adapter.md; validated by Sprint B B8.
