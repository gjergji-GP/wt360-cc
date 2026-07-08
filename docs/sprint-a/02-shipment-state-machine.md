# Shipment Engine — State Machine

Two **independent** status fields on `receiving_tickets`, meeting at reconciliation. Two fields
= two owners: this separation IS the SC/Finance boundary, made physical. Enforced by the
column-aware trigger `guard_rt_domain_transitions` (M3).

## sc_confirmation_status (SC owns — exists for ALL sources)

```
PENDING_SC_REVIEW ──confirm──► SC_CONFIRMED_HANDOFF
        │                              │
        └──dispute──► DISPUTED_BY_SC ◄─┘  (retained authority: can dispute AFTER handoff)
                            │
                            ├──► SC_CONFIRMED_HANDOFF   (dispute resolved, re-confirm)
                            └──► PENDING_SC_REVIEW      (reset to review)
```

Legal edges:
- `PENDING_SC_REVIEW → SC_CONFIRMED_HANDOFF`
- `PENDING_SC_REVIEW → DISPUTED_BY_SC`
- `SC_CONFIRMED_HANDOFF → DISPUTED_BY_SC`  ← retained legitimacy authority post-handoff
- `DISPUTED_BY_SC → SC_CONFIRMED_HANDOFF`
- `DISPUTED_BY_SC → PENDING_SC_REVIEW`

**SC dispute never reverses stock.** Any physical reversal is a NEW ledger event (RETURN/ADJUST),
never an edit — append-only doctrine.

## financial_status (System→Finance→CFO — NOT_APPLICABLE for CK)

```
NOT_APPLICABLE   (CENTRAL_KITCHEN; immutable both ends — cannot enter or leave)

AWAITING_INVOICE ──► INVOICE_MATCHED ──► FINANCIALLY_ACCEPTED ──► READY_FOR_PAYMENT ──► PAID
        │                 │ ▲                                                            (terminal)
        └──► INVOICE_DISPUTED ◄┘  (back-edge: Finance manual dispute from INVOICE_MATCHED)
                  │
                  ├──► INVOICE_MATCHED    (corrected)
                  └──► INVOICE_REJECTED   (terminal sink)
```

Legal edges:
- `AWAITING_INVOICE → INVOICE_MATCHED`
- `AWAITING_INVOICE → INVOICE_DISPUTED`
- `INVOICE_MATCHED → INVOICE_DISPUTED`  ← Finance manual dispute back-edge
- `INVOICE_MATCHED → FINANCIALLY_ACCEPTED`
- `INVOICE_DISPUTED → INVOICE_MATCHED`
- `INVOICE_DISPUTED → INVOICE_REJECTED`
- `FINANCIALLY_ACCEPTED → READY_FOR_PAYMENT`
- `READY_FOR_PAYMENT → PAID`

Stage ownership: INVOICE_MATCHED = system/reconciliation · FINANCIALLY_ACCEPTED = Finance human
approval · READY_FOR_PAYMENT = CFO queue · PAID = payment complete.

## receipt_status (operational lifecycle)

`DRAFT / SUBMITTED / OPERATIONALLY_ACCEPTED / OPERATIONALLY_REJECTED / PARTIALLY_ACCEPTED / CANCELLED`

`OPERATIONALLY_ACCEPTED` (all accepted) vs `PARTIALLY_ACCEPTED` (some rejected). Operational
acceptance posts the stock ledger IN — independent of the financial track.

## Cross-field invariant (the SC/Finance boundary in code)

> IF `financial_status <> NOT_APPLICABLE`:
> `financial_status` may not advance past `AWAITING_INVOICE`
> unless `sc_confirmation_status = SC_CONFIRMED_HANDOFF`.

Finance cannot pay for goods SC hasn't confirmed legitimate. Scoped to exclude CK
(NOT_APPLICABLE has no financial track, so the gate doesn't apply).

## Guard mechanics

- **Column-aware**: `guard_rt_domain_transitions` no-ops unless `financial_status`,
  `sc_confirmation_status`, or `receipt_status` actually changes — so legacy procurement RPC
  writes (which touch other columns) pass through untouched. Firewall preserved both directions.
- **shipment_events immutable**: `guard_shipment_events_immutable` blocks UPDATE + DELETE.
- **NOT_APPLICABLE**: immutable both ends — cannot transition into or out of it. Source-determined
  at creation (CENTRAL_KITCHEN only).
