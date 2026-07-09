# WT360 Product Constitution — Evidence Ledger

Status: Proposed (v0.9 — proving period)
Owner: Product / Platform Architecture
Version: 0.9.2
Last Updated: 2026-07-10
Depends On: docs/product/WT360-PRODUCT-CONSTITUTION.md

---

## Purpose

The constitution states principles as timeless law, with no dates. This ledger carries the proof. Every constitutional principle earns its place through observation from real use, recorded here.

**Discipline (mirrors ADR-005):** a principle is admitted because operational reality demonstrated it, never because it sounded right. No entry here → no evidence → not yet constitutional. Argument is not evidence.

**This ledger accumulates. It is never overwritten.** Each principle grows a dated list of evidence over the life of the product. Append; never replace. Every production incident becomes permanent organizational learning — this is the mechanism by which the company becomes measurably smarter over time (Constitution, Stage 4).

---

## Purpose-level evidence (numbered incidents)

### Evidence #001 — Organizational Independence

In a discussion with the CEO of a highly admired company, he described his own role as "light," explaining that the operating system was so strong that teams operated independently, with very little friction reaching him.

**Observation.** A sufficiently strong operating system reduces the organization's dependency on any individual — including leadership. The CEO's role had not diminished; it had shifted from resolving daily friction toward strategy, expansion, and strengthening the system further.

**Constitution reinforced.** Purpose — institutionalize operational excellence. Excellence lived in the operating system, not in the CEO's continuous intervention, which is exactly the destination WT360 aims for.

---

## Per-principle evidence

### Principle 1 — Every action makes the next person's work easier
- *Awaiting direct cross-role evidence.* Demonstrated indirectly (2026-07-09, Receiving): RM operational acceptance produces clean, mapped stock data consumed by SC and Finance. A direct incident — a downstream role measurably helped by an upstream change — to be recorded when first observed.

### Principle 2 — The operator's job comes before the software
- *Awaiting a discrete incident.* Receiving refinements (v128→v131) are consistent; a specific observation of hesitation removed or caused to be recorded.

### Principle 3 — Accountability before convenience
- **2026-07-09 · Receiving / Accept Inventory.** The two-statement model (Confirm Arrival ≠ Accept Inventory) was preserved through every efficiency change. "Accept all now" (v130) made acceptance one click while keeping it a *conscious* accountable statement — the operator accepts exactly what they counted seconds earlier — not an auto-post. Lesson: speed and accountability are independent; convenience removed only redundant re-confirmation, never the accountable act.

### Principle 4 — Reduce cognitive load
- *Awaiting a measured incident.* v128→v131 reduced clicks and fields; a discrete before/after measurement of operator effort to be recorded.

### Principle 5 — Count once / never ask what the system can determine
- **2026-07-09 · Receiving / Accept Inventory (v128→v131).** First real use: acceptance required re-entering all quantities just entered at Confirm Arrival — same products, same numbers, twice. RM flagged it as inefficient for high-volume daily use. Change: Accept screen defaults accepted_qty = received_qty; operator edits only exceptions. Lesson: the two-statement accountability model was correct and preserved; the redundant *data entry* was the waste. Reusing the prior accountable statement removed the waste without removing the statement.

### Principle 6 — Optimize the common case
- **2026-07-09 · Receiving / Accept Inventory (v130).** After prefill, the common case still walked a full review screen plus a tab-switch. Change: "Accept all now" posts the clean case in one conscious action; exceptions route to full review-and-edit; "Accept later" defers for batch. Lesson: the common case earned a single action; complexity stayed on the exception path.

### Principle 7 — Make the correct action the easiest action
- **2026-07-09 · Receiving.** accepted defaults to received (correct acceptance is the default); rejection reason field appears only when a rejection is entered; duplicate submission prevented by busy-state guarding. The least-resistance path is the correct, accountable one. Lesson: steering beats permitting — making the right action easiest produces correctness by default under pressure.

### Principle 8 — Decisions, not navigation
- **2026-07-09 · Receiving / Accept panel (v131).** "Back to Incoming" misled: after Confirm Arrival the receipt has moved to To Accept, so the label returned the operator to a queue where the record no longer appeared and implied it was still there. Change: relabeled "Accept later" (behavior unchanged). Actions became "I accept now / I want to inspect-edit / I will accept later." Lesson: navigation labels can lie about state; decision labels communicate intent and avoid implying stale state.

### Principle 9 — The interface remembers
- **2026-07-09 · Receiving.** accepted_qty prefilled from received_qty; auth_user_id / home_location_id carried from session; the just-created receipt id carried into "Accept all now" so the operator never re-selects it. Lesson: the system carried every value it could, leaving the operator only exceptions.

### Principle 10 — Operational truth is never hidden
- **2026-07-09 · Receiving / Confirm Arrival queue.** After the first production Confirm Arrival, the submitted shipment stayed visible as DISPATCHED though a receipt existed and it was no longer receivable. Change: queue redefined as DISPATCHED *and* no receiving_ticket yet (NOT EXISTS guard). Lesson: stale state is a bug, not a delay; first real use exposed a gap SQL-level testing had not.
- **2026-07-09 · Receiving / discrepancy.** A short-receive (received < expected) carried truthfully through both statements — 20 dispatched, 19 accepted, 1 short — no phantom unit, no forced reconciliation. Lesson: the operational truth of a discrepancy is shown, not smoothed.

### Principle 11 — Mistakes are recoverable
- **2026-07-09 · stock_ledger / shipment_events (ongoing).** Append-only (delete-blocked). Every test that posted real stock was reversed via compensating movements (balancing IN/OUT to net-zero) plus shipment cancellation; receipts and events retained as immutable history — never deletion. Lesson: where the data layer is immutable, the interface and workflow carry recoverability; correction is compensating action, not erasure.

### Principle 12 — Technology serves operations
- *Awaiting a clean single-incident illustration.* Governs e.g. FaceShift as a parallel observer only (never interfering with check-in) and blind receiving deferring ledger posting to accountable acceptance. A discrete "we did not build X because operations did not benefit, though technology allowed it" to be recorded.

---

## Proving-period note

At v0.9, several principles (1, 2, 4, 12) rest on architectural reasoning plus partial or indirect evidence, honestly marked above. As the constitution is applied across Inventory Count, Waste, Transfers, and Procurement, each application appends new dated evidence here, and new Purpose-level incidents are numbered (#002, #003, …). When every principle carries direct production evidence across multiple modules, the constitution is ready to freeze at v1.0.

---

## Watched candidates (NOT yet constitutional)

Ideas that recur and may earn principle status once a real build proves they change a design decision. Held here per the moratorium — observed, not yet adopted. Argument is not evidence; a build is.

### Candidate — "Operational knowledge should move toward the moment it is created."

Every minute knowledge stays in a human head, its entropy increases; capture it at the moment of creation, not reconstructed later. Appears to explain, in one law: count-once, accept-now, reason-on-rejection, temperature-at-receipt, waste-at-declaration, inventory-during-counting, maintenance-immediately-after-failure. **Status:** watched. It may be a distinct principle, or it may simply be another face of Knowledge Debt. Decision deferred until it demonstrably forces a design decision across Waste, Inventory Count, or Production that the existing principles did not already cover. Recorded so it is not lost.

### Candidate — Capability scorecard (Capture / Validate / Distribute / Preserve / Improve, /5 per module)

A per-module maturity rubric more actionable than "we're at Stage 3." To be built as its own document and used to score Receiving, Waste, Inventory, and others; if after several modules it predicts reality usefully, it may be referenced constitutionally. **Status:** evidence candidate, separate document.

### Candidate — The flywheel as normative (not just explanatory)

The Reality→Capture→Validate→Execute→Measure→Learn→Improve loop (with preservation as gravity) is currently explanatory — it describes what the system does. Whether it should become *normative* (a rule every module must visibly implement each phase) awaits evidence from modules beyond Receiving. **Status:** explanatory now; watched for normative promotion.
