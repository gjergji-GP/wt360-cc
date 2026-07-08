# Workspace Philosophy

Status: Frozen
Authority: Platform
Owner: Platform Architecture
Version: 1.0
Last Updated: 2026-07-08

Purpose: Explains *why* WT360 workspace contracts are shaped the way they are — the rationale behind the template, so contributors understand the reasoning, not only the rules.

Depends On:
- architecture/00-platform-principles
- _spec/documentation-architecture

Related:
- workspaces/_workspace-contract-template (the rules this explains)
- workspaces/receiving-workspace (the reference implementation)

Supersedes:
- None

---

The template tells you *what* a workspace contract must contain. This one page tells you *why*. When a rule feels arbitrary, the answer is here — and understanding the why is what lets you know when a deviation is genuinely justified versus merely convenient.

## Why do workspace contracts exist at all?

Because there is a layer between "the engine's business rules" and "the screen's pixels" that usually goes undocumented — and its absence is where systems rot. That layer is *interaction*: what an operator is trying to do, who is accountable for it, and which engine call realizes it. When it isn't written down, it gets reinvented in every screen, inconsistently, and business logic leaks into the UI. The contract is that missing layer, made explicit and durable.

## Why don't they contain UI?

Because layout changes far more often than interaction does. A "Confirm Arrival" action is stable for years; the button's colour, position, and screen flow change constantly. If the contract contained pixels, every visual tweak would risk touching business meaning, and the two would fuse. Keeping UI out means the contract stays valid across redesigns, devices, and even a full frontend rewrite. A workspace contract is authoritative for **interaction, not implementation**.

## Why do they reference engine RPCs?

Because the engine is the single source of truth for business state, and a workspace that computed its own truth would create a second one. Referencing the frozen RPCs — rather than describing behavior freshly — guarantees the contract can never drift from what the engine actually does. The workspace asks; the engine decides. Every quantity on screen originates from the engine; the workspace derives nothing.

## Why are Intent and User Action different?

Because one intent has many gestures. "Accept this inventory" is a single domain concept, but it can be expressed by a click, a tap, a barcode scan, a voice command, or an API call. If the contract bound itself to "click," it would break the moment a scanner or automation expressed the same intent. Separating Intent (the domain concept) from User Action (the UI gesture) is what lets the same workspace serve every input channel without redefinition.

## Why are Metrics and Watchdogs separated?

Because they answer different questions for different audiences with different urgency. Metrics answer "how are we doing?" — analytics, reviewed periodically. Watchdogs answer "what requires action *now*?" — operational alarms, acted on immediately. Mixing them buries the alarm in the dashboard. They are kept apart so each stays legible.

## Why is "Required Engine Enhancements" not a backlog?

Because it is an *interface*, not a to-do list. The workspace says "I require these capabilities"; Engineering later decides "Sprint B builds 14.1 and 14.3." Those are two different responsibilities held by two different roles. Section 14 is where Architecture states a need and Engineering picks it up — the honest seam between design and delivery. Putting it in the roadmap would collapse that seam and let requirements masquerade as schedule.

## Why the honesty rule — built vs required, always visible?

Because a contract that quietly assumes unbuilt capability is a trap: someone builds against it, and it fails. Every place the engine lacks something is called out explicitly, so the contract is trustworthy the day it's read and the day it's built against. A document you can trust when it's incomplete is worth more than one that pretends to be complete.

---

## Coordinated evolution (applies to every frozen document)

> **If changing this document requires changing another frozen document, update both in the same revision or neither.**

Frozen documents evolve as a coordinated set, never independently. This is the rule that prevents cross-document drift — the failure mode where two frozen docs quietly disagree and the system has two "truths."
