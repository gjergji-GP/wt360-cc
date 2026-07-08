# Shipment Engine — SC / Finance Boundary

## The core separation

```
Operational acceptance → posts STOCK ledger (independent of invoice)
SC confirmation        → hands the case to Finance
Financial acceptance   → authorizes PAYMENT (independent of stock)

Stock truth ≠ invoice truth.
```

Stock is based on physical receipt (operational acceptance). Payment is based on invoice
reconciliation (financial track). These are two independent streams that meet at reconciliation.

## Goods-first flow (invoice missing at receipt)

```
Restaurant posts receipt
→ operational acceptance → stock ledger IN posts   [inventory real, no invoice needed]
→ financial_status = AWAITING_INVOICE
→ SC owns the "Awaiting Supplier Invoice" queue:
     verifies supplier/delivery legitimacy, chases invoice, flags suspicious deliveries
→ SC confirms → SC_CONFIRMED_HANDOFF  (hands financial track to Finance)
→ invoice arrives → match_invoice_to_shipment → INVOICE_MATCHED
→ finance_accept_invoice → FINANCIALLY_ACCEPTED
→ mark_ready_for_payment → READY_FOR_PAYMENT  (CFO queue)
→ mark_paid → PAID
```

SC does **not** allocate after receipt — the goods already landed at a known location, there is
nothing to distribute. SC **confirms** and **hands off**. Allocation only exists when an invoice
exists to be allocated (invoice-first / procurement flow).

## Ownership

| Concern | Owner | Field / RPC |
|---|---|---|
| Delivery legitimacy | **SC** | `sc_confirmation_status`, `sc_dispute_shipment` |
| Invoice presence & correctness | **Finance** | `financial_status`, `match_invoice_to_shipment`, `finance_accept_invoice` |
| Payment execution | **CFO** | `mark_ready_for_payment`, `mark_paid` |

SC retains legitimacy-dispute authority **even after handoff** (`SC_CONFIRMED_HANDOFF →
DISPUTED_BY_SC` is legal). Handoff transfers invoice-chasing to Finance; it does not extinguish
SC's standing to dispute the delivery itself.

## Dispute routing

```
Price / invoice / payment mismatch      → Finance  (financial_status: INVOICE_DISPUTED)
Delivery legitimacy / wrong supplier    → SC       (sc_confirmation_status: DISPUTED_BY_SC)
Any physical reversal after dispute     → NEW ledger event (RETURN/ADJUST), never an edit
```

## The cross-field guard (boundary enforced at data layer)

> IF `financial_status <> NOT_APPLICABLE`:
> cannot advance past `AWAITING_INVOICE` unless `sc_confirmation_status = SC_CONFIRMED_HANDOFF`.

Prevents Finance from paying for goods SC never confirmed. Verified: T6 (blocked pre-handoff),
T16 (blocked while disputed), T9→T11 (proceeds after handoff).

## CK special case

CENTRAL_KITCHEN shipments are `financial_status = NOT_APPLICABLE` — no financial track, no
Finance, no CFO. SC confirmation still exists (legitimacy of internal transfer) but the handoff
has no financial consequence. `NOT_APPLICABLE` is immutable and source-determined.
