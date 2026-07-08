# Shipment Engine — Adapter Contract

**The interface every adapter (Vendor, CK, Warehouse, Returns, …) must satisfy before calling
the engine.** This is the authoritative integration spec. Where rules were previously spread
across docs 01–06, this consolidates them into one checklist an adapter passes or fails.

Enforcement posture for Sprint B (decided): **documented call-order, not globally enforced.**
The engine validates local preconditions + state transitions; the *sequence* is the adapter's
responsibility per this contract. Strict global sequencing is deferred until two adapters prove
the real flow.

---

## 1. Responsibility split — engine vs adapter

| Concern | Engine owns | Adapter owns |
|---|---|---|
| Stock ledger posting | ✅ (via gateway inside `operationally_accept_receipt`) | ❌ never posts directly |
| Status transitions | ✅ (guards enforce legality) | calls the RPC; never writes status columns directly |
| Event emission | ✅ (every RPC writes its event) | ❌ never inserts `shipment_events` directly |
| `product_id` resolution | ❌ (receives resolved id) | ✅ resolves barcode/scan/lookup → `product_id` before calling |
| Source-side stock movement (e.g. CK OUT) | deferred to adapter (Sprint B) | ✅ adapter's dispatch wiring |
| Call ordering | validates *local* preconditions only | ✅ calls in the documented order |
| `source_type` selection | validates it's a legal value | ✅ passes the correct source_type |

**Core rule:** the adapter is a *caller*. It never writes engine-owned tables directly — only
through the frozen RPC surface (doc 08).

---

## 2. Required call order (documented)

```
create_shipment
  → dispatch_shipment            (source-side movement; CK/etc. raise "adapter not wired" until Sprint B wires them)
  → submit_receipt
  → operationally_accept_receipt (posts stock IN)
  → sc_confirm_handoff           (vendor/financial sources only; CK skips financial track)
  → match_invoice_to_shipment    (finance track — only after handoff)
  → finance_accept_invoice
  → mark_ready_for_payment
  → mark_paid
```

- The two tracks after acceptance are **independent**: the SC track (`sc_confirm_handoff` /
  `sc_dispute_shipment`) and the finance track can be reasoned about separately, but the finance
  track **cannot advance past AWAITING_INVOICE without SC_CONFIRMED_HANDOFF** (cross-field guard).
- CK / NOT_APPLICABLE sources have **no finance track** — the chain ends at operational acceptance
  (+ optional SC legitimacy confirmation).
- Goods-first is the norm: `operationally_accept_receipt` runs and posts stock **before** any
  invoice exists. The invoice joins later via `match_invoice_to_shipment`.

---

## 3. Mandatory events per stage

The engine writes these automatically; adapters must NOT write them. Adapters may rely on their
presence in `shipment_events` for observability.

| RPC | Event(s) written |
|---|---|
| create_shipment | SHIPMENT_CREATED |
| dispatch_shipment | SHIPMENT_DISPATCHED |
| submit_receipt | RECEIPT_SUBMITTED |
| operationally_accept_receipt | OPERATIONALLY_ACCEPTED \| PARTIALLY_ACCEPTED, + LEDGER_POSTED |
| sc_confirm_handoff | SC_CONFIRMED_HANDOFF |
| sc_dispute_shipment | SC_DISPUTED |
| match_invoice_to_shipment | INVOICE_MATCHED \| INVOICE_DISPUTED |
| finance_accept_invoice | FINANCIALLY_ACCEPTED |
| mark_ready_for_payment | READY_FOR_PAYMENT |
| mark_paid | PAID |

---

## 4. Idempotency & retry semantics (honest current state)

Adapters MUST NOT assume blind-retry safety except where stated. There are no global idempotency
keys in Sprint A.

| RPC | Retry safety |
|---|---|
| `operationally_accept_receipt` | **Idempotent** via `ledger_posted_at` hard gate. Second call errors ("already posted"); no double-post. Safe to retry — a retry after success errors cleanly rather than duplicating. |
| status-transition RPCs (`sc_confirm_handoff`, `sc_dispute_shipment`, `match_invoice_to_shipment`, `finance_accept_invoice`, `mark_ready_for_payment`, `mark_paid`) | **Guard-protected, not idempotent.** A second call attempts the same transition again and **errors** (illegal transition from the now-current state). Safe against *corruption* but not a silent no-op — the adapter must treat the transition-error on retry as "already applied," not as failure. |
| `create_shipment` | **NOT idempotent.** Two calls create two shipments. Adapter must prevent duplicate submission. |
| `submit_receipt` | **NOT idempotent** unless the caller prevents duplicate submission. Two calls create two receipts against the same shipment. |
| `dispatch_shipment` | Adapter-specific behavior deferred (Sprint B). Not globally idempotent yet. |

### Future hardening (Sprint B+)
> Sprint B+ may add an `adapter_request_id` / `idempotency_key` parameter for `create_shipment`,
> `submit_receipt`, and `dispatch_shipment` so adapters with automatic retry can dedupe. Not built
> in Sprint A — do not assume it exists.

---

## 5. Failure semantics

- All engine RPCs raise `SQLSTATE P0001` for business-rule violations with a human-readable
  message. Adapters distinguish P0001 (deterministic business rejection — do not retry blindly)
  from infrastructure errors (transient — may retry per the table above).
- RPCs are transactional: a raised exception rolls back that call entirely (no partial state).
  A failed `operationally_accept_receipt` posts **no** ledger rows and leaves `ledger_posted_at`
  NULL — so a corrected retry is safe.
- The invoice must pre-exist before `match_invoice_to_shipment` — a phantom invoice id raises
  "invoice not found" (P0001), not an FK error.

---

## 6. Invariants adapters may NEVER bypass

1. **Ledger gateway only.** Stock moves solely through `operationally_accept_receipt` (which calls
   `post_stock_ledger_movement_as`). No adapter posts to `stock_ledger` directly. No adapter calls
   `post_stock_ledger_movement_as` itself in Sprint A — acceptance is the sanctioned path.
2. **No direct status writes.** Adapters never UPDATE `financial_status` / `sc_confirmation_status`
   / `receipt_status` — only via the RPCs (the transition guard would reject illegal moves, but
   the contract forbids the attempt entirely).
3. **No procurement-column reads/writes.** Adapters never touch `fiscal_invoice_id`,
   `sc_allocated_at/by`, `reconcile_delta_pct`, `dispute_note`, or `source ∈ {NORMAL,GRN}`. Engine
   receipts carry `source='SHIPMENT'`.
4. **No event stream writes.** `shipment_events` is engine-written and immutable.
5. **NOT_APPLICABLE is source-determined and immutable.** CK adapters must create with
   `source_type=CENTRAL_KITCHEN` and never attempt to give it a financial track.
6. **product_id must be pre-resolved.** The engine never resolves identity; barcode/scan handling
   is the adapter's job (and, in Sprint D, the identity-resolution layer's).

---

## 7. Adapter-specific responsibilities (Sprint B)

**Vendor adapter (complete):**
- Bridge existing procurement/eBills → `create_shipment(source_type='EXTERNAL_VENDOR')`.
- Support both orderings: invoice-first (invoice exists, then received) and goods-first
  (received, `AWAITING_INVOICE`, invoice joins later).
- Own the "Awaiting Supplier Invoice" queue (SC) and the reconciliation match.

**CK adapter (minimal — the abstraction proof):**
- `create_shipment(source_type='CENTRAL_KITCHEN')` → `financial_status=NOT_APPLICABLE`.
- Wire the **source-side ledger OUT at CK** that `dispatch_shipment` currently refuses.
- Prove the chain `Create → Dispatch(OUT) → Receive → Accept(IN)` with no engine change.
- **If CK requires any engine modification, the abstraction leaked — fix the engine, not the adapter.**

---

## 8. Conformance checklist (an adapter is contract-compliant iff)

- [ ] Calls only the 10 frozen RPCs (doc 08); touches no engine table directly
- [ ] Passes resolved `product_id`; performs its own identity resolution
- [ ] Calls in the documented order (§2)
- [ ] Selects correct `source_type`; respects NOT_APPLICABLE for CK
- [ ] Treats transition-error-on-retry as "already applied," not failure (§4)
- [ ] Prevents duplicate `create_shipment` / `submit_receipt` (no idempotency key yet)
- [ ] Never reads/writes procurement-private columns (§6.3)
- [ ] Handles P0001 as deterministic rejection, not transient (§5)
