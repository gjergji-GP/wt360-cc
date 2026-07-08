# Traceability: documentation <-> implementation

Status: Living (update whenever a function or contract changes)
Last Updated: 2026-07-08

The map between what the docs describe and what the database actually runs. When an installed function changes, this table tells you which docs and validations are affected. Update it in the same PR as the code change.

Implementation Status vocabulary:
- **Planned** — described, not built.
- **Partially implemented** — some of the contract exists.
- **Implemented** — built and introspection-verified.
- **Runtime validated** — exercised end-to-end against a running DB.

| Artifact (doc) | Implements (DB functions) | Validated by | Status |
|---|---|---|---|
| domains/shipment-engine/09-ck-dispatch-adapter | `dispatch_shipment` | Sprint B B8 | Runtime validated |
| workspaces/receiving-workspace | `submit_receipt`, `operationally_accept_receipt` | Sprint B B8 | Runtime validated |
| workspaces/receiving-workspace §14.1 (reason codes) | `operationally_accept_receipt` (+`receiving_lines.rejection_reason`) | Sprint B B8 | Runtime validated |
| workspaces/receiving-workspace §14.3 (drafts) | `save_receipt_draft`, `discard_receipt_draft` | — (installed, not yet in an E2E run) | Implemented |
| ADR-003 / permission model | `_perm_check`, `has_perm(key)`, `has_perm(key,user)` | Sprint B B8 | Runtime validated |
| sprint-a/03-ledger-event-matrix | `post_stock_ledger_movement_as` (8/10/12-arg) | Sprint A + B8 | Runtime validated |
| workspaces/receiving-workspace §5 (lifecycle) | `submit_receipt` (DISPATCHED gate, one-receipt), `operationally_accept_receipt` (status advance) | Sprint B B8 | Runtime validated |

## Deferred / not yet built (do not present as implemented)
| Item | State | Where recorded |
|---|---|---|
| WAREHOUSE / RESTAURANT / RETURN adapters | Raises "adapter not wired" | dispatch_shipment; 09-ck-dispatch-adapter |
| §14.2 attachments | Deferred (decision) | 09-ck-dispatch-adapter, scope decisions |
| §14.4 draft events (DRAFT_CREATED/UPDATED) | Deferred (decision) | 09-ck-dispatch-adapter, scope decisions |
| dispatched_qty (vs expected_qty) | Future additive capability | ADR-004; 09-ck-dispatch-adapter |
| Transport-failure / abandoned lifecycle | Watch item (one Stretch in B8 verdict) | sprint-b-template-validation verdict |
