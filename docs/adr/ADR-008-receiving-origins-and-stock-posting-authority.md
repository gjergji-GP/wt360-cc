# ADR-008: Receiving origins and stock-posting authority

Status: Proposed
Date: 2026-07-09

## Context

Stock arrives at a location in three ways (see docs/RECEIVING-FLOW-RECONCILIATION.md):

- **Case A — CK expected shipment**: information (a shipment) precedes goods. BUILT & proven (Phase 1.1, Confirm Arrival).
- **Case B — blind / unplanned receipt**: goods precede information; no shipment, no PO, no invoice at arrival. Backend captures + allocates but does NOT post to stock (reconciliation proved the allocation→ledger last-mile is missing — Case B is currently *inert*, not dangerous).
- **Case C — SC/vendor expected receipt**: information (invoice/PO/expectation) precedes goods. Exists on the older procurement-task model, not the shipment engine.

Reconciliation established that `receiving_tickets` is the shared spine of all three. The open danger: closing Case B's last-mile means deciding *when a blind receipt becomes real stock* — and doing that carelessly would let blind receiving bypass the two-statement accountability model (physical arrival ≠ inventory ownership) that Case A deliberately preserves.

## Decision

**1. `receiving_tickets` is the universal receipt spine.** Every receiving origin produces a `receiving_tickets` row. `shipment_id` is **nullable**:
- Case A: ticket + CK shipment.
- Case C: ticket + WAREHOUSE/vendor shipment (if/when converged onto the shipment engine).
- Case B: ticket with **no shipment** — a blind receipt has no shipment because nothing was dispatched. Case B stays ticket-native; it is NOT forced into the shipment engine.

**2. Ledger posting requires two things, for every origin:**
- (a) a **mapped SKU** (`master_products.id`) — never a raw name; never a NULL product_id. Upholds hard-invariant #22 (no ghost SKUs enter stock).
- (b) an **accountable acceptance statement** — a deliberate act by an authorized actor that says "this is now our inventory." Physical arrival alone never posts stock.

**3. The two-statement model is universal, not CK-specific.** For ALL origins:
```
physical arrival statement   ≠   inventory ownership statement
(receipt exists)                 (stock posts to ledger)
```
Case A enforces this via submit_receipt (arrival) then operationally_accept_receipt (ownership). Case B must enforce an equivalent boundary — SC mapping a SKU is NOT the ownership statement.

## Case B stock-posting authority — the sub-decision

When does a blind/unplanned receipt post to the ledger? Three options were considered:

- **Option 1 — SC allocation makes stock postable.** After `sc_attach_blind_allocation` maps the SKU, stock posts. *Rejected*: SC mapping is a data-completion act, not an ownership act. It would collapse arrival and ownership into one step, exactly what Case A avoids. Also puts inventory-acceptance authority on SC, who did not physically receive the goods.
- **Option 2 — Finance invoice match makes stock postable.** Stock posts when Finance reconciles the invoice. *Rejected*: ties physical inventory truth to a financial event that may lag by days. Stock would be physically present but not on the books until paperwork clears — the inverse error, and it delays inventory accuracy for an accounting reason.
- **Option 3 — operational acceptance still required after SC allocation (CHOSEN).** The flow becomes: RM receives blind (arrival) → SC maps SKU (data completion) → **an authorized operational actor (RM/LM) accepts the mapped goods into inventory (ownership)** → ledger posts. Finance invoice reconciliation proceeds on its own track (financial_status), independent of stock truth.

**Rationale for Option 3:** it preserves the two-statement model for blind receipts. Goods that arrived unannounced get the *same* acceptance boundary as CK shipments — arguably they warrant more scrutiny, not less, since no expectation vouched for them. SC allocation supplies the missing SKU mapping; it does not confer ownership. Stock truth stays operational (who accepted it), not financial (who invoiced it).

## Consequences

- Closing Case B's last-mile is now scoped by this ADR: back-fill the mapped `sku_id` at allocation, but the **ledger post is gated behind an operational acceptance step**, not fired by allocation alone. The blind path needs an acceptance action analogous to `operationally_accept_receipt`, not a direct allocation→READY_FOR_FINANCE→ledger jump.
- Case C convergence (onto the shipment engine, reusing Confirm Arrival) is compatible with this ADR and remains a separate, still-open decision (see reconciliation Part 2). This ADR does not decide C; it only fixes the spine (`receiving_tickets`, nullable `shipment_id`) that makes convergence clean.
- `sc_delivery_allocations` holds the mapping; the acceptance step is what transfers that mapping onto the ledger-read path and posts stock.
- No migration is authorized by this ADR. It is a decision record. Implementation is a later, separately-scoped step.

## References

docs/RECEIVING-FLOW-RECONCILIATION.md (Parts 1 & 2); ADR-002 (dispatched-is-receivable), the two-statement model proven in Phase 1.1; hard-invariant #22 (no ghost SKUs); `initiate_blind_receiving`, `sc_attach_blind_allocation`, `trg_post_ledger_on_receiving_finalized`.
