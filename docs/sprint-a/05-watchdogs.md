# Shipment Engine — Watchdogs

Four engine-native watchdog views (M5), keyed off the domain spine. They **coexist** with the
legacy task-based `v_watchdog_*` family — the legacy `v_watchdog_receiving_without_invoice_stale`
(which watches the task system) is untouched. Firewall: engine watchdogs read engine columns.

## The four views

### `v_shipment_watchdog_awaiting_invoice_stale`
Engine receipts operationally accepted (stock posted) but `financial_status='AWAITING_INVOICE'`
for >72h. → Escalate to SC + Finance to chase the supplier invoice.

### `v_shipment_watchdog_awaiting_invoice_depleted`  (high priority)
The harder-tier escalation. Awaiting-invoice receipts whose **accepted stock has since been drawn
down below what was received** — meaning the receipt is now the only remaining evidence of what
arrived. This is the dangerous state: goods consumed, still no matched invoice.

**Approximation note:** `qty_on_hand` is computed net at the location level (stock is fungible;
you cannot perfectly attribute which receipt's units were consumed). This view is an
**investigation signal**, not an accounting attribution. Treat a hit as "go check," not "this
exact receipt's goods are gone."

### `v_shipment_watchdog_sc_review_stale`
Engine receipts `sc_confirmation_status='PENDING_SC_REVIEW'` for >24h. → Notify SC Manager.

### `v_shipment_watchdog_in_transit_stale`
Shipments `status IN (DISPATCHED, IN_TRANSIT)` for >6h with no accepted receipt at destination.
→ Notify SC + destination manager (lost/forgotten delivery).

## Thresholds

| Watchdog | Threshold | Rationale |
|---|---|---|
| awaiting_invoice_stale | 72h | Suppliers typically invoice within days |
| awaiting_invoice_depleted | (any, once depleted) | Depletion + no invoice is the risk, not time |
| sc_review_stale | 24h | SC review should be same/next-day |
| in_transit_stale | 6h | Internal delivery runs are minutes; 6h is generous |

Thresholds are inline intervals in the view definitions; adjust by redefining the view.

## Relationship to existing infrastructure

Reused, not rebuilt: `v_reconciliation_queue`, `v_stock_on_hand`, `v_inventory_valuation`, and
the legacy `v_watchdog_*` / `wd_*` families all remain. The engine watchdogs are additive.
