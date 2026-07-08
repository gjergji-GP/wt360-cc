# Sprint B — Template Validation Test (pre-registered)

Status: Draft
Authority: Platform
Owner: Platform Architecture
Version: 1.0
Last Updated: 2026-07-08

Purpose: Pre-registers the questions Sprint B (CK Adapter) must answer, so we can honestly judge afterward whether the v1.2 workspace template was complete or whether implementation exposed a genuine gap.

Depends On:
- workspaces/_workspace-contract-template (v1.2 — the baseline under test)
- domains/shipment-engine/07-adapter-contract

Related:
- workspaces/receiving-workspace

Supersedes:
- None

---

## Why this exists

v1.2 of the workspace template is declared the WT360 documentation baseline. It is **designed but not yet stress-tested.** Sprint B is the first real implementation that will exercise it. The burden of proof has inverted: the framework is presumed correct, and a change is legitimate only if implementation exposes a deficiency the structure genuinely cannot express.

To keep that judgment honest, the test questions are registered **before** Sprint B, not rationalized after. If the existing structure accommodates them without a new section, the template passed. If it cannot, Sprint B has earned a revision — the legitimate trigger the template prescribes.

## The pre-registered questions

While implementing the CK Adapter, each of these must find a natural home in the existing structure:

1. **Adapter invariants** — e.g. "the CK adapter posts exactly one ledger OUT." Hypothesis: belongs in a contract's *Required Compliance* (§15), named "Required Adapter Compliance." Test: does it fit there without distortion?
2. **Retries** — retry semantics for a dispatch/OUT that fails mid-flight. Hypothesis: the adapter contract (`07-adapter-contract` §4) already owns retry/idempotency honesty; the workspace contract references it, does not restate it. Test: is the boundary clean, or does the workspace need to say something the adapter contract can't?
3. **Idempotency guarantees** — "exactly one OUT" under retry. Hypothesis: same home as retries (adapter contract), backed by an idempotency key if one is added. Test: does §14 (capability) vs §15 (compliance) correctly classify a *missing* idempotency key vs a *violated* exactly-once guarantee?
4. **Transport failures** — the OUT posts but the in-transit signal is lost, or vice versa. Hypothesis: this is Error States (§10) plus adapter-contract failure semantics. Test: is partial-failure expressible, or is there no home for "posted OUT, lost the shipment"?
5. **Reconciliation** — detecting and repairing CK-side OUT vs restaurant-side IN mismatches. Hypothesis: a watchdog (§8) surfaces it; correction is a new ledger event, never an edit (append-only doctrine). Test: does the existing watchdog + append-only correction model cover it, or does reconciliation need its own structural place?

## How to score it

After Sprint B, for each question record one of:
- **Accommodated** — fit an existing section without stretching. (Template passed.)
- **Stretched** — made it fit, but the section is now doing two jobs. (Warning — watch for recurrence before revising.)
- **Exposed a gap** — genuinely no natural home. (Earned revision — make it, coordinated, with a recorded trigger.)

Honesty rule: "Stretched" is not "Accommodated." Do not rationalize a forced fit as a natural one — that is how frameworks rot while appearing healthy.

## The baseline being tested

**v1.2 is the WT360 documentation baseline.** No further template, philosophy, or documentation-architecture work until an implementation exposes a genuine gap. This document is the instrument that decides whether Sprint B is such an exposure.

---

## Sprint B Verdict (scored after implementation + B8 runtime evidence)

Overall result: **PASSED with one Stretch.** No revision earned. The v1.2 template accommodated Sprint B; one question stretched a section and is flagged to watch, not yet a gap.

Runtime evidence: B8 ran the full slice on the dev DB (labeled residue) — CK dispatch posted one OUT per line (10+4), restaurant received the accepted quantity (10+3=13), the rejected unit was correctly not credited (CK out 14, restaurant in 13, difference = the 1 rejected-DAMAGED unit), shipment reached PARTIALLY_RECEIVED, event stream was SHIPMENT_DISPATCHED → RECEIPT_SUBMITTED → PARTIALLY_ACCEPTED → LEDGER_POSTED, and an unpermissioned actor (BOH_ASSISTANT) was refused at both submit and accept. Ledger reversed to net-zero; shipments cancelled; events retained.

### Per-question scores

1. **Adapter invariants** — **Accommodated.** "Exactly one OUT per line" landed cleanly as adapter behavior enforced in `dispatch_shipment` (loop + FOR UPDATE lock). The generalized §15 *Required Compliance* ("an implementation violates an invariant it must satisfy") named it without distortion. The v1.2 generalization of §15 beyond "engine" was the thing that made this fit — vindicated in use.

2. **Retries (sequential)** — **Accommodated.** Sequential re-dispatch and re-acceptance are refused by existing state/idempotency guards (status must be DRAFT/CREATED; `ledger_posted_at` blocks double-post). No new structure needed; the accountability model already carried it.

3. **Idempotency / exactly-once (concurrent)** — **Accommodated.** Closed by the `FOR UPDATE` row lock (dispatch and submit both lock the shipment) plus append-only ledger (no silent double-post). Classified correctly as §15 compliance (a violated exactly-once guarantee is a hole, not a missing feature) — no idempotency *key* was needed, so the §14-capability-vs-§15-compliance distinction held: this was compliance, not capability.

4. **Transport failures ("posted OUT, lost the shipment")** — **Stretched.** This is the one that did not sit cleanly. Single-transaction atomicity means "OUT posted but state move failed" cannot persist (verified in B2) — so *within one call* there is no partial-failure state, and Error States (§10) covers the clean-refusal cases. BUT the genuine physical case — goods dispatched (OUT posted, committed) and then never received because the shipment is lost in transit — has no explicit home. Today it manifests as a shipment stuck in DISPATCHED forever, surfaced (if at all) by the `in_transit_stale` watchdog (§8), not by Error States. That works, but §8 (watchdog) is doing a job that is arguably "unresolved lifecycle," and calling a permanently-undelivered shipment a "metric/watchdog" concern stretches §8 slightly. **Not yet a gap** — the watchdog does surface it — but flagged: if a second lifecycle-abandonment case appears (e.g. a dispatched WAREHOUSE shipment with the same problem), that recurrence earns a dedicated "abandoned/exception lifecycle" treatment rather than overloading the watchdog section.

5. **Reconciliation (CK OUT vs restaurant IN mismatch)** — **Accommodated.** B8 demonstrated it directly: the reversal was done exactly as the hypothesis predicted — compensating movements, never edits (append-only doctrine), net-zero verified. Detection is a watchdog concern (§8), correction is a new ledger event (§6/gateway). The existing watchdog + append-only correction model covered it without new structure. The append-only triggers *forced* this pattern, which is the doctrine enforcing itself.

### Conclusion

The v1.2 template is **confirmed as the baseline** — Sprint B implementation did not earn a revision. Four of five questions were accommodated cleanly; the §15 generalization (v1.2) specifically proved its worth on the adapter-invariant question. The one Stretch (transport-failure / abandoned lifecycle) is recorded as a **watch item**, not a change: one occurrence surfaced by an existing watchdog is not yet a structural gap. If lifecycle-abandonment recurs across source types, that is the earned trigger to add explicit exception-lifecycle handling — coordinated, with this verdict as the recorded evidence.

Burden of proof remains inverted: the framework held under its first real implementation. No documentation revision is made now.
