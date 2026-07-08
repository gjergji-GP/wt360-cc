# Shipment Engine — Frozen API (Sprint A)

Status: Frozen
Version: 1.0
Last Updated: 2026-07-08

**The supported interface.** These 10 RPCs are the stable surface adapters target. Everything
else — helper functions, guards, the test harness internals — is **internal implementation** and
may change without notice. Signatures below are pulled live from the deployed database.

All are `SECURITY DEFINER` and resolve the actor from `p_auth_user_id` → `employees` (active).

---

## The 10 supported RPCs

### Shipment head
```sql
create_shipment(
  p_auth_user_id uuid,
  p_source_type text,                 -- EXTERNAL_VENDOR | CENTRAL_KITCHEN | WAREHOUSE | RESTAURANT | RETURN | MANUAL_ADJUSTMENT
  p_destination_location_id uuid,
  p_lines jsonb,                      -- [{product_id, expected_qty, uom, lot_number?, expiry_date?, batch_id?, source_line_reference?}]
  p_source_location_id uuid DEFAULT NULL,
  p_vendor_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
) RETURNS uuid                        -- shipment_id
```

```sql
dispatch_shipment(
  p_auth_user_id uuid,
  p_shipment_id uuid
) RETURNS uuid                        -- shipment_id
```
Raises "adapter not wired" for CENTRAL_KITCHEN / WAREHOUSE / RESTAURANT / RETURN (source-side
stock = Sprint B).

### Receipt & operational acceptance
```sql
submit_receipt(
  p_auth_user_id uuid,
  p_shipment_id uuid,
  p_location_id uuid,
  p_lines jsonb,                      -- [{product_id, received_qty, uom, quantity_source, shipment_line_id?, lot_number?, expiry_date?}]
  p_header_note text DEFAULT NULL
) RETURNS uuid                        -- receipt_id (receiving_ticket id)
```

```sql
operationally_accept_receipt(
  p_auth_user_id uuid,
  p_receipt_id uuid,
  p_lines jsonb                       -- [{receiving_line_id, accepted_qty, rejected_qty}]
) RETURNS jsonb                       -- {receipt_id, status, ledger_movements}
```
The only Sprint A RPC that posts stock. Idempotent via `ledger_posted_at`.

### SC track
```sql
sc_confirm_handoff(p_auth_user_id uuid, p_shipment_id uuid) RETURNS jsonb
sc_dispute_shipment(p_auth_user_id uuid, p_shipment_id uuid, p_reason text) RETURNS jsonb
```

### Finance track
```sql
match_invoice_to_shipment(
  p_auth_user_id uuid,
  p_shipment_id uuid,
  p_invoice_id uuid,                  -- MUST pre-exist in fiscal_invoices
  p_matched boolean DEFAULT true      -- true → INVOICE_MATCHED, false → INVOICE_DISPUTED
) RETURNS jsonb

finance_accept_invoice(p_auth_user_id uuid, p_shipment_id uuid) RETURNS jsonb
mark_ready_for_payment(p_auth_user_id uuid, p_shipment_id uuid) RETURNS jsonb
mark_paid(p_auth_user_id uuid, p_shipment_id uuid, p_payment_ref text DEFAULT NULL) RETURNS jsonb
```

---

## Explicitly INTERNAL (not part of the frozen surface)

Do not call these from adapters. They may change:

| Internal | Why |
|---|---|
| `post_stock_ledger_movement_as(...)` | The ledger gateway. Reached only *through* `operationally_accept_receipt`. Adapters never call it directly in Sprint A. |
| `guard_rt_domain_transitions()` | Transition-guard trigger. |
| `guard_shipment_events_immutable()` | Event-immutability trigger. |
| `_shipment_engine_test_core()` | Test harness body. |
| `run_shipment_engine_tests()` | Test runner — supported for CI/verification, but not an integration RPC. |
| any legacy procurement RPC | Firewall — not for engine adapters. |

---

## Stability guarantee

- The **names, parameter order, and semantics** of the 10 RPCs above are frozen for Sprint B.
- New **optional** parameters may be added (e.g. a future `p_idempotency_key`) without breaking
  callers, since they'll carry defaults.
- Internal implementation (helper functions, guard bodies, view definitions) may evolve freely as
  long as the 10-RPC contract and the invariants in doc 07 hold.
- Any breaking change to these signatures requires a version bump and is out of scope for the
  Sprint A → Sprint B transition.

---

## Return-shape note

`create_shipment` and `dispatch_shipment` return a bare `uuid` (the shipment_id). The other eight
return `jsonb` status objects. Adapters should read the jsonb `financial_status` /
`sc_confirmation_status` / `status` fields rather than re-querying where possible.
