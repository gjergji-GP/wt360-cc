# ADR-004: adapters translate, they do not decide

Status: Accepted
Date: 2026-07-08
Deciders: Gjergji, Platform Architecture

## Context
The CK dispatch adapter could accrete business rules (quantity re-measurement, production coupling, destination effects) until it becomes a second workflow engine.

## Decision
An adapter translates a Shipment dispatch into canonical ledger movements for the source location. It owns no business rules and performs no inventory calculations. Quantity posted = shipment_lines.expected_qty (Current Engine Model); a distinct dispatched_qty is a future additive capability, not an adapter concern. The adapter never touches stock_ledger directly, never derives brand, never mutates production, never touches destination inventory.

## Consequences
- Future features are tested against the constitution: "is this the adapter's responsibility?" — not absorbed by default.
- The exactly-one-OUT-per-line invariant is adapter compliance (§15), enforced by a FOR UPDATE lock + append-only ledger.

## References
docs/domains/shipment-engine/09-ck-dispatch-adapter.md; dispatch_shipment. Validated by Sprint B B8.
