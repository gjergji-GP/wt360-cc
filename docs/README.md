# WT360 Documentation

This directory is **authoritative**. It is part of the product, versioned with the code it describes. It is not a wiki, not a scratchpad, and not a place for "better explanations."

## The one rule
> A document is updated for exactly two reasons: (1) the implementation changed, or (2) runtime validation proved the document wrong. Never because someone thought of a better explanation.

See ADR-005. This rule is what prevents both drift (docs lagging code) and sprawl (docs expanding endlessly).

## Directory map (by rate of change)
```
architecture/   almost frozen — governing principles, boundaries
adr/            immutable — one decision per file; supersede, never edit meaning
domains/        slow — business behavior + engine contracts (e.g. shipment-engine)
workspaces/     medium — how operators interact with a domain (no UI)
implementation/ often — notes tied to installed functions/migrations
_spec/          the framework itself (documentation-architecture, validation tests)
multi-brand/, sprint-a/  historical/domain records
```
Reviewers: expect churn in `implementation/` and `workspaces/`, almost none in `architecture/` and `adr/`.

## Every document carries a header
```
Status: Draft | Stable | Frozen | Deprecated | Superseded | Archived
Authority: Platform | Brand | Location
Owner:
Version:
Last Updated:
Implementation Status: Planned | Partially implemented | Implemented | Runtime validated
Depends On:
```
`Implementation Status` tells a reader instantly whether they are reading theory or reality.

## The PR documentation gate
Every pull request answers one mandatory question — exactly one box checked:
```
[ ] No documentation affected
[ ] Documentation updated in this PR
[ ] Documentation intentionally deferred — Issue: DOC-___
```
A migration and the document describing it are the same change. Frozen docs evolve as a coordinated set (change one, change its pair in the same commit, or neither).

## Traceability
`TRACEABILITY.md` maps docs <-> installed functions <-> validations. When you change an installed function, that table tells you which docs and validations are affected. Update it in the same PR.

## Per-release drift review (~30 min)
- Does the implementation still match each contract?
- Does each contract still match the architecture?
- Did any ADR become obsolete (mark Superseded, don't delete)?
- Are any deferred items now implemented (update TRACEABILITY status)?

## CI
`ci/check-docs.sh` verifies: every doc has a metadata header, referenced files exist, no orphan docs, version present. Simple checks catch surprising decay. Run it in CI on every PR touching `docs/`.
