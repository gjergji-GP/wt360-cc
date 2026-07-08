# Workspace Contract Template

Status: Frozen
Authority: Platform
Owner: Platform Architecture
Version: 1.2
Last Updated: 2026-07-08

Purpose: The reusable section-by-section structure every WT360 workspace contract follows, so any operator, developer, or agent knows where to find any concept in any workspace.

Depends On:
- architecture/00-platform-principles
- architecture/01-administrative-hierarchy
- _spec/documentation-architecture

Related:
- workspaces/receiving-workspace (the reference implementation of this template)

Supersedes:
- None

---

## What this is

A workspace contract defines **how operators interact with a domain — without specifying UI.** It is the layer between a Domain document (business behavior + engine contracts) and a UI specification (presentation + implementation). It names objects, intents, commands, states, and reads; it contains no pixels.

This template was extracted from `workspaces/receiving-workspace`, the first fully-worked contract. Every subsequent workspace (Inventory, Procurement, Production, Finance, HR, ...) should follow this section order so the system stays navigable at scale.

## Frozen — deviations must be justified

This template is **Frozen** as of v1.0, with exactly one reference implementation (Receiving). This is deliberate: freezing now, while only one workspace exists, is cheap. Once two or three workspaces follow it, changing the template means retrofitting all of them. So the canonical structure is declared now, and every future workspace **justifies deviations** (as a Decision Log entry) rather than casually introducing them. Changes to this template are deliberate revisions with a recorded decision — not ad hoc edits.

---

## The three laws every workspace contract inherits

These are not optional per-workspace choices; they are inherited invariants. State them (or reference them) in every contract.

1. **The workspace never decides business logic.** It calls engine RPCs and displays engine state. If a screen needs to "figure out" whether an action is allowed or what status results, that logic belongs in the engine.

2. **The quantity invariant.** Every quantity shown originates from the engine. The workspace never derives quantities, variance, balances, or ledger movements — the sole exception being operator *input* (a measured value the operator is accountable for), which the engine records, never the client.

3. **Built vs required is always visible.** Features the engine does not yet provide live in a dedicated *Required Engine Enhancements* section, never asserted inline as if present. A contract may *require* engine capability; it may never *assume* it.

**And the boundary that places all three:** a workspace contract is **authoritative for interaction, not implementation.** It owns how an operator interacts with a domain. It does not own the engine's rules (that is the Domain doc), the screen's layout (the UI spec), or the code (the components). When someone asks "does this belong here or in the UI spec?", this is the answer: interaction here, implementation there.

---

## A workspace contract answers five questions

Every section below is really answering one of these. Hold this mental model while reading any contract:

1. **What exists?** (Implementation Status, Domain Objects, Read Models, States)
2. **Who is accountable?** (Accountability Model, Users & Permissions)
3. **What may an operator express?** (Intent -> Command, Information Architecture)
4. **What does the engine do?** (RPC mapping, Events, Error States)
5. **What still needs to be built or fixed?** (Dependencies, Required Engine Capabilities, Required Engine Compliance, Future Extensions)

---

## Section order (the template)

Every workspace contract uses these sections, in this order. Omit a section only if it genuinely does not apply, and say so rather than dropping it silently.

| # | Section | Answers |
|---|---|---|
| — | **Header** (Status/Authority/Owner/Version/Last Updated/Purpose/Depends On/Related/Supersedes) | Is this valid, who governs it, why does it exist? |
| — | **Implementation Status** | What exists today? |
| — | **Dependencies** | What must exist before this can be Stable? (distinct from status) |
| 0 | **The Hard Rule + invariants** | The non-negotiable laws (the three above, specialized to this workspace) |
| 1 | **Purpose & Scope** (incl. in-scope, out-of-scope, domain framing) | What is this for, and what is deliberately not here? |
| 1a | **Business Outcome** | One paragraph: what does this workspace achieve for the business? (a measurable objective) |
| 2 | **Accountability Model** | Who makes which accountable statement, and why the acts are separate? |
| 3 | **Users & Permissions** | Which roles may perform which acts? (enforced server-side) |
| 4 | **Domain Objects** | The engine-owned entities (never UI components) |
| 5 | **Read Models** | The projections/views the workspace consumes (never raw tables) |
| 6 | **Intent -> Command -> RPC -> Event** | What the operator expresses, and the single call that realizes it |
| 7 | **States** | The engine-owned lifecycle the workspace displays |
| 8 | **Operational Metrics vs Watchdogs** | "How are we doing?" (metrics) vs "what needs action now?" (watchdogs) — kept separate |
| 9 | **Information Architecture** | Navigation between surfaces (not layout) |
| 10 | **Error States** | Engine errors the UI must display (never pre-empt with its own logic) |
| 11 | **Out of Scope (restated)** | The boundaries, restated for whoever builds the UI |
| 12 | **Upstream Dependencies** | Honest preconditions from other subsystems |
| 13 | **Definition of Done** | What promotes this Draft -> Stable |
| 14 | **Required Engine Capabilities** | Capabilities the engine must add — NOT YET BUILT (absence), never assumed present |
| 15 | **Required Compliance** | Where an implementation violates an architectural invariant it is already required to satisfy — LIVE VIOLATION, higher priority than capabilities |
| 16 | **Future Extensions** | Declared extension points, so future additions don't pollute the core |

---

## Notes on the load-bearing sections

**Business Outcome (1a).** One paragraph, no more. States what the workspace achieves for the business as a measurable objective — distinct from Purpose (what the *document* is). Examples: Receiving — "ensure inbound inventory becomes accurate stock exactly once, with a complete accountable history from physical arrival through operational acceptance." Production — "transform raw inventory into semi-finished inventory while maintaining full material traceability." Procurement — "transform supplier purchases into verified inventory while maintaining financial integrity." This gives every workspace a yardstick to be judged against.

**Accountability Model (2).** The heart of most workspaces. Name each accountable statement as a distinct act with a distinct meaning, map each to its own RPC, and state explicitly when two acts must never be fused (even if one person does both in one sitting, they stay two backend calls and two events). This is what makes operational history valuable.

**Intent -> Command -> RPC -> Event (6).** Separate the three layers: *User Action* (a UI gesture — click/tap/scan/voice/API, belongs to the UI, not the contract), *Intent* (the domain concept; one intent, many gestures), *Command/RPC* (the single engine call). This is what lets scanners, APIs, mobile, and automation all express the same intent without redefining the workspace.

**Read Models (5).** A workspace is mostly reads. Consume projections/views, never raw table queries. Rule: if the UI SELECTs a table directly, a read model is missing — add the view.

**Required Capabilities & Compliance (14, 15).** Keep these here, not in the Roadmap. The workspace says "I require these"; Engineering decides "when." Two distinct sections because they are different kinds of gap:

- **Capabilities (14)** are *absence* — functionality that doesn't exist yet (nothing is wrong, it's just unbuilt). Prioritized by product value; may wait several sprints; a Roadmap item.
- **Compliance (15)** is *violation* — **where an implementation violates an architectural invariant it is already required to satisfy.** This is deliberately general: the violating layer may be the engine (permissions enforced in UI instead of server-side), an **adapter** (e.g. "the CK adapter must post exactly one ledger OUT"), an integration, or the UI itself. Prioritized by architectural/security risk; should be closed quickly; an architecture/defect item, not a feature.

A capability gap is a feature to add; a compliance gap is a hole to close — the system currently *claims* a property it doesn't enforce. For each item: state what exists today, what's required, the proposed schema/signature/invariant (additive per the frozen-API stability rule where it touches the API), and mark it clearly. Both are Decision Log candidates where they change behavior.

> When titling these in a specific contract, name the violating layer: "Required Engine Compliance," "Required Adapter Compliance," etc. The section number (15) and its meaning stay constant; the qualifier identifies who must fix it.

**Metrics vs Watchdogs (8).** Never mix them. Metrics answer "how are we doing?" (analytics); watchdogs answer "what requires action now?" (operational alarms). They have different audiences and different urgency.

---

## How to start a new workspace contract

1. Copy this section order.
2. Fill the header; set Status: Draft.
3. Specialize the three laws (§0) to the workspace.
4. Work top-to-bottom; when you hit a capability the engine lacks, do not invent it inline — add it to §14.
5. Keep it pixel-free. The UI spec is a separate `ui/` artifact that implements the contract and is bound by §0.
6. Promote Draft -> Stable only when §13's definition-of-done is met and §14's required enhancements exist.

---

## Coordinated evolution (applies to every frozen document)

> **If changing this document requires changing another frozen document, update both in the same revision or neither.**

Frozen documents evolve as a coordinated set, never independently. If a template change implies a change to the Receiving contract (or Platform Principles to the Administrative Hierarchy, or the Shipment Engine frozen API to the adapter contract), the linked documents move together in one revision. This is the rule that prevents cross-document drift — the failure mode where two frozen docs quietly disagree and the system has two "truths."

---

## Revision history

- **v1.2** (2026-07-08) — Generalized section 15 from "Required Engine Compliance" to "Required Compliance": a compliance gap is any implementation violating an architectural invariant it must satisfy — engine, adapter, integration, or UI — not only the engine. Trigger: Sprint B introduces adapter-level invariants (e.g. "post exactly one ledger OUT") that are compliance, not engine capability. Specific contracts name the violating layer ("Required Adapter Compliance").
- **v1.1** (2026-07-08) — Split "Required Engine Enhancements" into **Required Engine Capabilities (14)** and **Required Engine Compliance (15)**, renumbering Future Extensions to 16. Trigger: the Receiving Workspace (the reference implementation) exposed that a missing feature (absence) and an unenforced law (violation) are different kinds of gap needing independent triage. This is the legitimate reason to revise a frozen template — a real workspace surfaced a deficiency — not a speculative improvement. Coordinated with receiving-workspace v0.6 in the same revision.
- **v1.0** (2026-07-08) — Initial frozen template, extracted from receiving-workspace.
