# WT360 Product Constitution

Status: Proposed (v0.9 — proving period)
Owner: Product / Platform Architecture
Version: 0.9.2
Last Updated: 2026-07-10
Depends On: docs/product/WT360-PRODUCT-CONSTITUTION-EVIDENCE.md

---

## Purpose

> **WT360 does not exist to build software. It exists to capture, preserve, and continuously improve the operational intelligence of the business, so that excellence becomes systematic instead of personal.**

Every principle, ADR, invariant, workflow, and future capability below ultimately serves that sentence.

### WT360 exists to institutionalize operational excellence.

**What an operating system is:** a system that continuously converts operational reality into institutional knowledge, and institutional knowledge back into daily execution. This single definition explains every module WT360 will ever contain — Receiving, Waste, Inventory, Production, Maintenance, Finance, HR — because each one is the same loop: reality becomes knowledge, knowledge guides execution, execution produces evidence, evidence sharpens knowledge. The alternative every module replaces is: reality → spreadsheet → forgotten.

Though the first domain is restaurants, nothing in these principles is restaurant-specific. They describe how any organization captures reality, retains knowledge, coordinates people, and improves over time. The voice of this document stays concrete and operational — goods arriving during lunch rush, not abstractions — because the concreteness is its power; but the bones generalize.

Operational excellence must live in the operating system — not inside the memories, habits, or heroics of individuals. The role of the software is to capture operational knowledge, enforce operational truth, and continuously reduce operational friction, so that excellence becomes repeatable, teachable, and scalable.

When the operating system becomes stronger: people become more independent, teams become more coordinated, leadership spends less time firefighting, and the business becomes more resilient.

The goal is not to reduce dependence on people. The goal is to **preserve excellence** so it does not leave when a person goes home. Reduced dependence follows as a consequence — and it protects people as much as the business: no one becomes a single point of failure, and no one is trapped as indispensable. Leadership's role does not disappear; it *shifts* — from resolving daily friction to building the next location, the next capability, the next improvement. The system absorbs operational variability so that people can spend their attention on leverage rather than firefighting.

### WT360 captures, validates, distributes, and preserves operational knowledge.

This is the distinction that defines what WT360 is becoming — the company's institutional memory, not a database. A notebook *preserves* knowledge; a database *stores* it. WT360 does four distinct jobs: it **captures** operational knowledge as it happens, **validates** it (mapping, acceptance, accountability), **distributes** it to the next role who needs it, and **preserves** it as permanent, reusable institutional memory — and over time, improves it through the evidence loop.

The difference between data and operational knowledge:

- A temperature reading is *data*. Knowing that a temperature deviation requires rejection is *operational knowledge*.
- A received quantity is *data*. Knowing who must acknowledge ownership before stock moves is *operational knowledge*.
- A purchase invoice is *data*. Knowing how Finance, Supply Chain, and Restaurant Management cooperate around that invoice is *operational knowledge*.

WT360 captures the knowledge, not just the data.

### The loop, and the gravity beneath it

The operating system runs a continuous loop:

```
                          P R E S E R V A T I O N
                    (the immutable foundation of every phase)
                                    │
   Reality → Capture → Validate → Execute → Measure → Learn → Improve → Reality
```

Every phase feeds the next, and the cycle returns to a changed reality — the business becomes measurably better each turn. Preservation is **not a step in the loop**. It is the substrate beneath all of them — gravity, not a phase. Capture is preserved, validation is preserved, execution is preserved, measurement is preserved, learning is preserved. This is why the append-only doctrine (ledgers and events that cannot be deleted, only compensated) is not a technical detail but a constitutional property: nothing WT360 does is ever un-preserved, so everything it does can be learned from and audited. Learning is the goal; preservation is what makes the learning trustworthy.

### Knowledge Debt — the liability no accounting system records

Software has technical debt. Operations suffer something worse: **Knowledge Debt** — operational knowledge trapped inside a single person's head.

- Only one person knows how supplier X's invoices work.
- Only one RM truly understands receiving.
- Only one cook knows the fryer calibration.
- Only Finance understands a given reconciliation.

Every one of these is an unrecorded liability: if that person is absent, the operation degrades or stops. WT360 exists to continuously **pay down Knowledge Debt** — to move knowledge out of heads and into the operating system, where it is preserved, distributed, and improvable. This reframes what a feature *is*: not "which feature do we build next," but **"which Knowledge Debt does this pay down."** That question changes engineering priorities, because it points at the knowledge still trapped in people rather than the feature that seems most interesting.


### The organizational maturity this drives toward

Underneath software maturity is a deeper progression — how a business holds its own knowledge:

- **Stage 1 — Knowledge lives in people.** Business = people. Loss of a person is loss of capability.
- **Stage 2 — Knowledge lives in documents.** Business = SOPs. Better, but passive.
- **Stage 3 — Knowledge lives in software.** Business = operating system. The software actively guides work.
- **Stage 4 — Knowledge continuously improves itself.** Business → software → evidence → improvement → business. Every production incident becomes permanent organizational learning; the company becomes measurably smarter over time. This is where the evidence ledger stops being documentation and becomes part of the company's learning loop — and where accumulated operational learning becomes the thing competitors cannot copy, because they would be copying years of learning, not code.

**Honest present position (v0.9):** WT360 sits between Stage 3 and Stage 4, unevenly, module by module. Receiving now actively guides work (Stage 3) and has begun feeding the evidence loop (Stage 4). Most of the business is still Stage 2 or not yet built. These stages are a direction and a destination, not a claim of arrival.

### How success is measured

Not "did we automate this," nor "did we save five clicks," but:

> **Did operational excellence become less dependent on any particular individual?**

The evaluation question for any feature: *if the person who runs this daily disappeared tomorrow, would the operation still run — and does this feature move that answer toward yes?* That is a far higher bar than task completion, and it is the true test.

### The design direction (adapted from Jobs)

> **Start with operational reality, then work backwards to the technology.**

Operational reality is more than one operator's day — it includes handoffs, interruptions, accountability, exceptions, delays, inventory movement, financial reconciliation, audit, communication, and recovery. The operator is one participant inside that reality. Designing from operational reality outward naturally includes everyone in the chain; designing from technology inward rarely does.

---

## North Star

> **WT360 exists to make running a restaurant feel easier every day than it did yesterday.**
>
> **Every feature must reduce operational friction without reducing accountability.**
>
> **Technology is successful only when operators stop noticing it.**

If a developer reads nothing else, they read the Purpose above and these three sentences.

---

## Status: v0.9 — proving period

This is not yet frozen. Unlike an ADR, provable when written, a constitution about human behavior and organizational outcome is proven only by watching its principles hold across modules that do not yet exist. As of this version, evidence comes primarily from one module (Receiving).

Before promotion to v1.0, these principles will be consciously applied and tested across Receiving, Inventory Count, Waste, Transfers, and Procurement. Principles that prove imprecise will be refined; new ones that emerge from real use will be added with evidence. Only after validation across several modules is this frozen at v1.0. The constitution earns 1.0 the same way any principle earns its place: by observation, not declaration.

---

## Preamble

WT360 exists to reduce operational thinking, not create it. Operators should think about the restaurant — the shipment, the customer, the food — never about the software.

This constitution stands **alongside** the ADRs. Together they govern two independent dimensions:

- **ADRs** answer: *what is the correct architecture?*
- **The Constitution** answers: *what is the correct product?*

Both deserve first-class governance. A system can be architecturally perfect and still fail as a product nobody wants to use daily; this document exists to prevent that.

Relationship to the other governance layers:

- ADRs protect correctness.
- Invariants protect data.
- Permissions protect accountability.
- The design system protects visual consistency.
- **This constitution protects the operator — and through the operator, institutionalizes the operation's excellence.**

These principles are operational law derived from real production use, not aspiration. A principle earns its place by observation, recorded in the companion evidence ledger. No evidence → not yet constitutional. Argument is not evidence.

### Two layers — do not confuse them

**Layer A — Constitutional Principles** (this document): truths that should survive as long as WT360 serves restaurants. They change only if the company's operational reality changes.

**Layer B — Derived Design Rules** (the design system and a living appendix): current tactical consequences — "prefill confirmed quantities," "one-click accept-all," "segmented controls." These evolve and are expected to. Never mistake a Layer B tactic for a Layer A law.

### The resolution clause — read before applying any principle

Principles collide. When they do, the constitution resolves the conflict:

1. **Accountability wins over speed.** Speed may remove redundant confirmation of a fact already stated; never a required accountable statement.
2. **Operational truth wins over reduced load.** Hide *incidental* complexity (that a shipment, receipt, and allocation are different backend objects). Never hide *operational* truth (a discrepancy, rejection, shortage). "Reduce load" is never a license to suppress what the next person needs.
3. **Predictability wins over cleverness.** A new pattern is acceptable only if it becomes predictable after a single use. Recurring surprise is failure.

### A note on the two principle groups

The principles are organized into **Operational Principles** (behavior — how the operation flows) and **Product Principles** (implementation — how the software behaves). One spine crosses both: **accountability** (Operational P3) and **truth-visibility** (Product P10) are the same commitment seen twice — who stated a truth, and whether the truth is shown. Never optimize one while eroding the other.

---

# Operational Principles

*These define behavior — how the operation should flow.*

### Principle 1 — Every action makes the next person's work easier.

A restaurant is a relay, not a set of individuals. **The value of an action is measured not only by the person performing it, but by how much work it removes from everyone downstream.**

**Why.** WT360 optimizes an operation, not a person. Accountable data is not paperwork; it is what makes the next person fast — and it is how operational knowledge moves out of one head and into the shared system.

**Pass.** The output of an action is directly usable by the next role with no rework, re-keying, or clarification.

**Fail.** An action produces data the next person must clean, re-enter, interpret, or chase before acting.

### Principle 2 — The operator's job comes before the software.

The application supports the operation. Never the reverse.

**Why.** If a person must stop thinking about the restaurant to understand the interface, the interface failed at its only job. The highest compliment is "I didn't even think about the app" — invisibility.

**Pass.** The operator completes the task without pausing to decode the software.

**Fail.** The operator has to stop and figure out what the screen wants before acting. (Invisibility is measured by absence of hesitation, not a feeling.)

### Principle 3 — Accountability before convenience.

Speed and accountability are unrelated axes, not a trade-off.

**Why.** A fast tool that blurs responsibility corrupts trust in the data, and a distrusted tool gets worked around with paper. Convenience that removes only *redundant* confirmation costs nothing.

**Pass.** Each distinct accountable statement (I counted / I accept / I approve) is preserved as a conscious act, even when the flow is fast.

**Fail.** An efficiency change collapses two distinct accountable statements into one.

### Principle 4 — Reduce cognitive load.

Every unnecessary click, confirmation, popup, and field is operational waste. Treat it like food waste: measure it, remove it.

**Why.** Cognitive load is inventory waste; it compounds across every operator, shift, and day.

**Pass.** The screen asks the minimum the operator must supply, and nothing the system could have known.

**Fail.** The screen contains a click, field, confirmation, or step removable without losing an accountable statement or an operational truth.

### Principle 5 — Count once / never ask what the system can determine.

Information already confirmed in this flow is never requested again. **The software should never ask the operator for information it can determine itself** — location, user, prior selections, derivable values.

**Why.** People remember exceptions; computers remember everything. The computer carries everything it can, so the human carries only the exceptions.

**Pass.** Confirmed values are reused; derivable information is inferred, not requested. The operator edits only exceptions.

**Fail.** The operator re-enters a value already confirmed this flow, or supplies information the system could have determined.

### Principle 6 — Optimize the common case.

Ninety percent of operations are normal. Normal must require almost no effort. Complexity belongs only to the exception path.

**Why.** Making the common case pay for the rare case taxes every operator on every normal transaction.

**Pass.** The normal outcome is achievable in a single conscious action; exceptions get the fuller path.

**Fail.** The common, no-exception case requires the same detailed steps only an exception needs.

---

# Product Principles

*These define implementation — how the software should behave.*

### Principle 7 — Make the correct action the easiest action.

Do not merely *allow* the correct thing. Make it the path of least resistance.

**Why.** Operators under pressure follow the path of least resistance. If it is also correct, correctness happens by default; if it is wrong, the operation drifts wrong at speed. Silently governs: default accepted = received, "Accept all now," reason fields only when rejecting, hidden irrelevant controls, prevented duplicate submissions.

**Pass.** The path of least resistance leads to the correct, accountable outcome.

**Fail.** The easiest available action is not the correct one, or a correct action takes more effort than an incorrect one.

### Principle 8 — Decisions, not navigation.

Controls describe the decision, never the movement.

**Why.** Operators decide at speed. "Accept later" / "Reject shipment" is understood instantly; "Back" forces reconstruction and may lie about the state the operator will find.

**Pass.** Every action control names the operator's decision or intent.

**Fail.** A control is labeled by navigation when the operator is making a decision, or implies a state that no longer exists.

### Principle 9 — The interface remembers.

Prefill. Carry forward. Reuse prior choices. Infer the inferable. The operator supplies only what the computer cannot know.

**Why.** The implementation consequence of Principles 4 and 5: memory is the system's job.

**Pass.** Known and previously-supplied information is present without re-entry.

**Fail.** The operator re-supplies information the system already holds or could derive.

### Principle 10 — Operational truth is never hidden.

The screen always reflects current truth. Stale or wrong state is a bug, not a delay. Discrepancies, shortages, and rejections are shown.

**Why.** The operator must *believe* the numbers. A screen showing a state the operator knows is false erodes trust and the tool gets bypassed. Operational truth outranks reduced load.

**Pass.** The screen reflects true current state and surfaces every operational exception the operator or next person needs.

**Fail.** The screen shows stale state, or suppresses an operational truth for simplicity.

### Principle 11 — Mistakes are recoverable.

Operators make mistakes at speed. Every action recoverable, every error says what to do next, no mistake corrupts data or requires an engineer.

**Why.** A daily tool under service pressure receives fat-fingered entries, interruptions, dropped connections. Where the data layer is immutable (append-only ledgers), the interface carries recoverability — correction through compensating action, never deletion.

**Pass.** Every action has a recovery path; errors state the next step; correction never requires engineering.

**Fail.** A mistake is unrecoverable in the interface, corrupts data, produces an error that doesn't say what to do, or needs an engineer to undo.

### Principle 12 — Technology serves operations.

Never build because the technology allows it. Build because the operation benefits. The backend may hold twenty concepts; the human should hold three.

**Why.** Every capability is justified by operational benefit, not technical possibility. Incidental complexity is the system's to absorb, never the operator's to carry.

**Pass.** Each feature traces to a concrete operational benefit and hides incidental complexity behind a small human mental model.

**Fail.** A feature exists because it was technically possible, or exposes backend concepts the operator has no operational reason to know.

---

## The gate — every screen must pass before it ships

Yes/no answers, not opinions:

1. **Next person:** Output directly usable by the next role without rework? (P1)
2. **No decoding:** Operator can act without figuring out the screen? (P2)
3. **Accountability intact:** Every required accountable statement still a conscious act? (P3)
4. **Asked once:** No re-requesting anything already stated this flow or determinable by the system? (P5)
5. **Common case fastest:** Normal outcome a single conscious action? (P6)
6. **Correct = easiest:** Path of least resistance is the correct, accountable one? (P7)
7. **Decision labels:** Every control names a decision, not a navigation? (P8)
8. **Tells the truth:** Reflects current state and surfaces every operational exception? (P10)
9. **Recoverable:** Operator can recover from a mistake without engineering? (P11)
10. **Dependency:** If the person who runs this daily disappeared tomorrow, would the operation still run — and does this move that answer toward yes? (Purpose)

If any answer is "no," the feature is not complete — regardless of test coverage. This changes code review: beyond "is the SQL correct, does RLS hold, does React compile," reviews now ask the ten questions above.

---

## Feature kickoff — the constitution enters before a line is written

Before any module is built, its kickoff answers:

1. Which constitutional principles does this feature touch?
2. Which does it make *easier* to honor?
3. Which does it make *harder*, and how will we protect them?
4. **What evidence do we expect to collect after rollout?**
5. **If the person who runs this daily disappeared, would the operation still run — and does this feature move that toward yes?**

Question 4 turns each module into a designed experiment: predict which principles it will demonstrate, then the ledger records what actually happened. Predictions that hold strengthen the constitution; predictions that fail refine it.

---

## Amendment and proving period

During v0.9, principles may be refined or added freely as real use reveals what's precise; each change is recorded in the evidence ledger. At v1.0 and after, Layer A principles change only when operational reality changes — rarely, with recorded reasoning. Layer B rules evolve without ceremony. A new Layer A principle may be added only when backed by production evidence — never argument alone. This mirrors ADR-005: implementation drives documentation; here, operational reality drives the constitution.

### The moratorium (a governance rule, not a suggestion)

**No new constitutional principle may be added until at least three more modules have been built under v0.9** (Case B, Waste, Inventory Count are the first three). After each module, the kickoff asks one question: *did the Constitution force a different design decision?* If yes, append the evidence. If no, either the Constitution is incomplete, or the idea was never constitutional. Ideas may accumulate as **watched candidates** in the evidence ledger during the moratorium, but they do not become principles until a real build proves they change decisions.

The test for any proposed principle: **what production decision would have been different if this principle already existed?** If the answer is "none," it is not constitutional yet.

### What this document must remain

This Constitution is not a collection of brilliant ideas. It is a collection of **expensive lessons**. Its authority comes from the fact that nearly every sentence exists because a specific decision in production proved it — not because it sounded wise. Anyone can write principles; very few organizations can point to a sentence and say "that exists because we made that exact mistake." Protect that. The moment this becomes a document of clever aspirations rather than distilled experience, it loses the only thing that makes it worth obeying.

---

## Closing

> **The goal is not to build software that people use. The goal is to build an operating system that makes the business continuously better — one that captures operational reality, preserves it permanently, and turns it back into sharper daily execution, so that excellence survives any individual and compounds over time.**

Software is the mechanism. The operating system is the point. An organization that learns faster than it forgets is the destination.
