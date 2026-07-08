# ADR-005: implementation drives documentation

Status: Accepted
Date: 2026-07-08
Deciders: Gjergji, Platform Architecture

## Context
Documentation frameworks rot in two opposite ways: neglect (docs lag code) and over-refinement (docs expand endlessly on "better explanations"). Sprint B showed the framework holds only if change is disciplined.

## Decision
A document is updated for exactly two reasons: (1) the implementation changed, or (2) runtime validation proved the document wrong. Never because someone thought of a better explanation. Documentation is an output of engineering (migration -> implementation -> runtime validation -> doc update if required), not a parallel activity. Framework changes require a real implementation exposing a genuine gap, recorded as the trigger.

## Consequences
- The v1.2 documentation baseline is frozen; changes are earned, not proposed.
- Burden of proof is inverted: the framework is presumed correct.
- Prevents both drift (via the PR documentation gate) and sprawl (via this rule).

## References
docs/_spec/documentation-architecture.md; docs/_spec/sprint-b-template-validation.md (the pre-registered test that enforced this in Sprint B).
