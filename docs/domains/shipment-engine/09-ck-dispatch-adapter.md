# CK Dispatch Adapter

Status: Draft
Authority: Brand
Owner: Platform Architecture
Version: 0.2
Last Updated: 2026-07-08

Purpose: Defines the responsibilities and hard boundaries of the CK Dispatch Adapter — the Sprint B component that wires source-side stock depletion for CENTRAL_KITCHEN shipment dispatch.

Depends On:
- domains/shipment-engine/07-adapter-contract
- domains/shipment-engine/03-ledger-matrix
- domains/shipment-engine/08-frozen-api

Related:
- workspaces/receiving-workspace

Supersedes:
- None

---

## The adapter's one-sentence responsibility (frozen)

> **The CK Dispatch Adapter translates a Shipment dispatch into canonical ledger movements for the source location. It owns no business rules and performs no inventory calculations.**

This sentence is the adapter's constitution. Every proposed future feature (temperature logs, signatures, transport-failure handling, retries, dispatched-quantity variance) is evaluated by asking: *is this the adapter's responsibility?* — not by expanding the adapter until it becomes another workflow engine.

## Responsibilities (the whole list)

The adapter, invoked from within `dispatch_shipment` for `source_type='CENTRAL_KITCHEN'`:

1. Validate the shipment is dispatchable (delegated — the guard already exists in dispatch_shipment).
2. Read the shipment's lines.
3. Post exactly one canonical OUT movement per line through the ledger gateway (`post_stock_ledger_movement_as`).
4. Return control to `dispatch_shipment`, which performs the state transition and event.

## Explicit non-responsibilities (never)

- Never calculate inventory (on-hand, availability, variance).
- Never write `stock_ledger` directly — only via the gateway.
- Never derive brand — pass the CK location_id; the gateway derives brand.
- Never mutate `production_batches` or any production state.
- Never touch destination inventory (that is receipt/acceptance, a different flow).
- Never re-measure quantity at dispatch (see quantity model below).

## Quantity model

**Current Engine Model:** the OUT posts `shipment_lines.expected_qty` (the planned quantity). This is what the schema supports today; the shipment *is* the dispatch record. Stated as the current model, not the permanent business truth.

**Future Capability (if operations ever need it):** a distinct `dispatched_qty` (actual quantity dispatched, possibly ≠ planned) would be an *additive* capability — a new column + additive RPC parameter — not a change to today's semantics. Deferred; not in Milestone A.

## The boundary in one line

The adapter's responsibility begins at "CK currently owns stock" and ends at "CK no longer owns that stock." How the stock arrived at CK (production, adjustment, opening balance, seed) is irrelevant to it.

---

## Confirmed architectural facts (from B1 reconciliation + integration validation)

Established against the live database (`knquzjqxhduyxxljuede`), read-only reconciliation plus one live integration exercise:

- **The adapter replaces only the CENTRAL_KITCHEN branch** of the dispatch guard. WAREHOUSE / RESTAURANT / RETURN keep raising "adapter not wired" until their own adapters exist.
- **`SELECT ... FOR UPDATE` on the shipment row is minimum correctness, not optimization.** Without it, concurrent retry is a double-depletion path. It belongs in B2.
- **One OUT per shipment line**, `movement_type='OUT'`, **positive quantity** (direction is in the type, not the sign — confirmed: all live IN and OUT rows store positive magnitude).
- **Ledger gateway only** — the 12-arg `post_stock_ledger_movement_as`, passing the CK `location_id` (gateway derives brand) and the shipment id as `p_transfer_ref` (lands in `notes`). The adapter never inserts `stock_ledger` directly; the sentinel is inside the gateway.
- **Quantity = `shipment_lines.expected_qty`** (Current Engine Model). A distinct `dispatched_qty` is a future additive capability, not in Milestone A.

## Sprint B architectural finding: append-only is real and self-enforcing

Integration validation attempted to clean up test data by DELETE and was refused by two triggers:
- `stock_ledger` — `prevent_ledger_modification()` blocks DELETE **even with the insert sentinel armed**. A posted OUT is irreversible except by a compensating IN.
- `shipment_events` — `guard_shipment_events_immutable()` blocks DELETE. A dispatch event is permanent.

This is not a testing nuisance; it is the append-only doctrine confirming itself against the real triggers on the real adapter path. Consequences:
1. **Reversal is always a compensating movement, never a delete** — the adapter's OUTs, once posted, can only be offset by INs, leaving an honest audit trail (verified: net CK effect returned to 0.0 via 2 compensating INs).
2. **Testing the adapter against the live DB permanently marks the data** — immutable events cannot be removed. B4 dispatch tests must use a disposable Supabase branch, or accept labeled, cancelled test-data residue. This is a methodology constraint for the rest of Sprint B.

## Evidence discipline (three separate artifacts)

Per the pre-registered validation contract, these are kept distinct and must not be conflated:
1. **Architecture** (this document) — predicts. Frozen facts above.
2. **Migration** — executes. The real `apply_migration` rewriting `dispatch_shipment`. Not yet written.
3. **Validation** (`_spec/sprint-b-template-validation.md`) — observes. Scored only *after* the migration exists and its tests pass. The integration exercise done during design is **not** the final validation; it observed the design's invariants under live execution, which is weaker than validating the installed adapter.

---

## Sprint B scope decisions (B6.3 / B6.4 deferred)

**B6.3 Expanded draft events — DEFERRED (decision, not gap).**
Drafts are working data; `shipment_events` is immutable accountable history. Emitting DRAFT_CREATED / DRAFT_UPDATED / DRAFT_DISCARDED into `shipment_events` would pollute the accountable shipment timeline (SHIPMENT_CREATED, SHIPMENT_DISPATCHED, RECEIPT_SUBMITTED, OPERATIONALLY_ACCEPTED, LEDGER_POSTED) with non-accountable edit-noise. If draft history is ever needed, it belongs in a *separate* `receiving_draft_events` table, not the shipment stream. Deferred until a real operational reporting need exists.

**B6.4 Attachments / evidence — DEFERRED.**
Useful receipt decoration, not on the accountability/ledger path. Deferred; not required to prove the vertical slice.

Rationale: the core vertical slice (CK dispatch OUT → receivable → submit → accept-with-reasons → ledger IN → role enforcement) is complete. Per the pre-registered plan, the single end-to-end validation (B8) is the evidence that proves Sprint B — not additional capability. B6.3/B6.4 are earned scope only if B8 surfaces a genuine need.
