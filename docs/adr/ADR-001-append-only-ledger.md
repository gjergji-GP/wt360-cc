# ADR-001: stock_ledger and shipment_events are append-only

Status: Accepted
Date: 2026-07-08
Deciders: Gjergji, Platform Architecture

## Context
Inventory accounting and shipment history must be auditable and non-repudiable. A ledger row or lifecycle event that can be silently edited or deleted destroys trust in the books.

## Decision
`stock_ledger` and `shipment_events` are append-only, enforced by triggers (`prevent_ledger_modification`, `guard_shipment_events_immutable`). Rows are never UPDATEd or DELETEd. Corrections are compensating movements (a reversing IN/OUT), never edits. The insert sentinel authorizes INSERT only — not DELETE.

## Consequences
- Reversal of any ledger impact is a new compensating movement, leaving both the original and the reversal visible. (Verified in B2 and B8: net-zero reversal via compensating entries.)
- Testing the engine against a live DB permanently marks the data — immutable events cannot be removed. Validation runs leave labeled, accepted residue, or use a disposable branch.
- The doctrine is self-enforcing: cleanup DELETEs are rejected by the triggers, forcing the compensating-movement pattern.

## References
dispatch_shipment, operationally_accept_receipt, post_stock_ledger_movement_as; validated by Sprint B B8.
