# Case B — Blind / Missing-Invoice Receiving — Feature Kickoff

Status: Draft (kickoff — approve before building)
Owner: Platform Architecture
Version: 1.0
Last Updated: 2026-07-10
Depends On: docs/RECEIVING-FLOW-RECONCILIATION.md, docs/adr/ADR-008-receiving-origins-and-stock-posting-authority.md, docs/product/WT360-PRODUCT-CONSTITUTION.md

Purpose: Close the last-mile of Case B (goods arrive, invoice missing) so a physical arrival becomes controlled, mapped, accepted stock — without depending on memory, phone calls, or paper. This is the first feature kickoff gated by the Product Constitution.

---

## The operation (what actually happens on the floor)

A supplier's goods arrive at a location. There is no shipment, no PO, no invoice in the system. Someone must record what physically arrived *now*, so it becomes real, accountable inventory — and the invoice is reconciled later when it turns up. Today this lives in memory and phone calls: "did we get the delivery?", "what did it contain?", "call Supply Chain", "where's the invoice?"

---

## Live backend state (reconciled 2026-07-10)

Case B backend is ~85% built and **inert, not dangerous**:

- `initiate_blind_receiving` / `initiate_unplanned_receiving` — real. Create ticket (source=BLIND/UNPLANNED, reconciliation_status=PENDING_ALLOC), lines carry `sku_name_raw`, `sku_id` NULL. Fire SC allocation task.
- `sc_attach_blind_allocation` — real. Writes `master_product_id` into `sc_delivery_allocations` (with `blind_receiving_ticket_id` link), advances ticket to PENDING_INVOICE, fires FINANCE_RECONCILE_BLIND task.
- `trg_post_ledger_on_receiving_finalized` — fires only on `status='READY_FOR_FINANCE'`, reads `receiving_lines.sku_id`.

**The two confirmed breaks (unchanged from prior reconciliation):**
1. SC allocation writes the mapping to `sc_delivery_allocations`, never to `receiving_lines.sku_id` — which the ledger reads. The mapping never crosses tables.
2. Nothing in the blind path sets `status='READY_FOR_FINANCE'` — the ledger trigger never fires.

**Consequence:** blind goods are captured and mapped, but never post to stock. Safe (no ghost SKUs ever enter stock) but incomplete (inventory truth never lands).

---

## Product Constitution gate (the six checks, answered honestly)

| # | Check | Current state | Required outcome |
|---|---|---|---|
| 1 | Operator avoids duplicate entry? | No UI yet; backend captures once | Operator declares goods once; SC maps once; no re-entry |
| 2 | SC gets clean allocatable data? | **YES** — raw name + qty flows as PENDING_ALLOC task | Preserve |
| 3 | Finance reconciles without chasing people? | Partial — task fires with vendor context | Complete once loop closes |
| 4 | Stock avoids posting before SKU mapping + operational acceptance? | YES, but *by accident* (nothing posts) | Make it **deliberate** per ADR-008 |
| 5 | Next role receives cleaner work? | YES for SC, incomplete for Finance/Inventory | Complete the chain to Inventory |
| 6 | If the handler is absent, does the process still run? | **NO** | **The core reason to build this** |

**Check 6 is the finding that reframes the build.** Today, because stock never posts, a blind receipt's inventory truth exists nowhere durable — it depends on the receiver being present to remember and manually push it through. That fails the constitution's purpose (institutionalize operational excellence; reduce dependence on individuals). Closing Case B is not "make the ledger post"; it is **"turn a physical arrival into institutional knowledge so the operation does not depend on the receiver being there tomorrow."**

---

## ADR-008 constraint (unchanged, governs the build)

> SC mapping completes data, NOT ownership. Ledger posting universally requires a mapped SKU AND an accountable operational acceptance.

So the loop must NOT auto-post when SC allocates. It must gate the ledger behind an **operational acceptance** — the same second statement Case A proved.

---

## Reuse analysis

`operationally_accept_receipt` (Case A's acceptance) does the right *shape* — accept lines, post ledger IN, gate on acceptance — but it is **coupled to shipments** (advances shipment→RECEIVED, writes shipment_events, uses shipment_id). Blind tickets have **no shipment** (ADR-008: ticket-native, shipment_id nullable). Therefore it cannot be directly reused; Case B needs a **sibling acceptance function** with the same discipline, minus the shipment coupling.

---

## Proposed scope (the smallest correct slice)

**Backend (two changes):**

1. **Back-fill `sku_id` at allocation.** Modify `sc_attach_blind_allocation` (and unplanned sibling) to also write the mapped `master_product_id` onto the corresponding `receiving_lines.sku_id`. This makes the mapping reachable by the ledger — but does NOT post stock (ADR-008: allocation ≠ ownership). Ticket still advances to PENDING_INVOICE / awaits acceptance.

2. **Add `operationally_accept_blind_receipt(p_auth_user_id, p_receipt_id, p_lines)`** — a shipment-free sibling of the Case A accept function. Requires the ticket's lines to have `sku_id` populated (allocation done). Posts ledger IN per accepted line, sets receipt_status OPERATIONALLY_ACCEPTED/PARTIALLY_ACCEPTED, advances reconciliation appropriately. No shipment writes. Same reason-code/rejection discipline as Case A. Gated by `receiving.accept` (or a Case-B-appropriate permission).

**Read layer (two RPCs, ADR-007 shape):**
- `list_acceptable_blind_receipts(p_auth_user_id)` — blind tickets that are mapped (sku_id present) and awaiting acceptance.
- `get_acceptable_blind_receipt(p_auth_user_id, p_receipt_id)` — lines with mapped sku_code, product_name, received_qty.

**UI (later increment):**
- Blind-receipt entry (operator declares goods that arrived without paperwork).
- Acceptance surface (reuse the Case A accept UX pattern: prefill, accept-all, exceptions).

---

## What this explicitly does NOT do (non-goals)

- Case C convergence (SC/vendor expected receipts) — separate decision.
- Invoice matching / Finance reconciliation mechanics (`match_invoice_to_shipment`) — the financial side runs on its own track; this closes the *stock* side only.
- Auto-posting on SC allocation — forbidden by ADR-008.
- Removing the two-statement discipline — blind receipts get acceptance too.

---

## Success definition (Case B last-mile complete when)

- Blind goods can be received (declared once), mapped by SC (once), and accepted by an accountable operator → stock posts.
- Stock never posts on SC mapping alone (ADR-008 held).
- A blind receipt becomes durable institutional inventory truth without depending on the receiver's presence or memory (Constitution check 6).
- SC, Finance, and Inventory each receive cleaner work than before (Constitution checks 2, 3, 5).
- No ghost SKUs ever enter stock (hard-invariant #22 held).

## Expected evidence to collect after rollout (kickoff question 4)

- Whether a blind receipt processed by one person can be completed by another (dependency reduction — the direct Check-6 evidence the ledger currently lacks for Principle 1 / Purpose).
- Whether Finance reconciles the later invoice without contacting the receiver.

## Execution order

1. Back-fill sku_id in `sc_attach_blind_allocation` (+ unplanned sibling); verify against a seeded blind ticket.
2. Build `operationally_accept_blind_receipt`; verify it posts ledger only on acceptance, never on allocation.
3. Read RPCs; verify.
4. UI (entry + acceptance) — separate increment.
5. End-to-end verify; append evidence to the constitution ledger.
