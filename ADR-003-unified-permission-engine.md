# ADR-003: one authorization engine (_perm_check), two entrypoints

Status: Accepted
Date: 2026-07-08
Deciders: Gjergji, Platform Architecture

## Context
RPCs resolve the actor from a p_auth_user_id parameter; the existing has_perm() reads auth.uid(). Those can differ. A naive parallel helper (employee_has_perm) would create two authorization implementations that drift over time.

## Decision
One implementation, `_perm_check(perm_key, auth_user_id)`. Two non-ambiguous entrypoints delegate to it: `has_perm(key)` (session, auth.uid(), RLS-facing) and `has_perm(key, auth_user_id)` (explicit user, RPC-facing). No default parameter (avoids overload ambiguity that would break existing RLS). No parallel helper. Permission keys are namespaced (receiving.draft/confirm/accept).

## Consequences
- Authorization is one subsystem, not "session permissions" vs "parameter permissions".
- Existing procurement RLS (6 policies) untouched.
- Any future RPC needing explicit-user auth uses has_perm(key, user) for free.
- Permissions are data (permissions table), re-grantable without code change.

## References
_perm_check, has_perm (both signatures); permissions table; enforced in submit_receipt, operationally_accept_receipt, save/discard_receipt_draft. Validated by Sprint B B8.
