# ADR-002: DISPATCHED is the receivable state (no distinct IN_TRANSIT)

Status: Accepted
Date: 2026-07-08
Deciders: Gjergji, Platform Architecture

## Context
After a CK shipment dispatches, it must become receivable at the destination. The status vocabulary reserves IN_TRANSIT, PARTIALLY_RECEIVED, RECEIVED — but nothing transitioned into them.

## Decision
For CK, DISPATCHED *means* in-transit and receivable. IN_TRANSIT stays reserved vocabulary, unused, until a real transport event exists (e.g. driver_confirm_pickup with a real actor and timestamp). Do not model an event nobody records. Acceptance advances the shipment to RECEIVED (all accepted) or PARTIALLY_RECEIVED (any rejected).

## Consequences
- submit_receipt gates on status = DISPATCHED; acceptance advances to terminal receiving states.
- One-shipment-one-receipt is enforced (row lock + existence check).
- If a real pickup/handoff event is ever recorded, IN_TRANSIT activates as a distinct state — additive, no rework.

## References
dispatch_shipment, submit_receipt, operationally_accept_receipt (B5); validated by Sprint B B8.
