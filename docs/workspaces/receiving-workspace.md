# Receiving Workspace

Status: Draft
Authority: Location
Owner: Platform Architecture
Version: 0.6
Last Updated: 2026-07-08

Purpose: Defines the RM/BOH-facing interaction contract for receiving inbound shipments and turning physical arrival into real stock — domain objects, read models, intents, commands, permissions, states, events, and RPC mapping — without specifying any pixels.

Depends On:
- domains/shipment-engine/07-adapter-contract
- domains/shipment-engine/08-frozen-api
- domains/shipment-engine/02-state-machine
- architecture/01-administrative-hierarchy

Related:
- domains/shipment-engine/04-sc-finance-boundary
- domains/shipment-engine/05-watchdogs

Supersedes:
- None

---

## Implementation status

```
Shipment Engine (acceptance core)   Built (Sprint A, frozen, tested)
This Workspace Contract             Draft
RM Acceptance UI                    Not started
```

The RM-facing acceptance core (confirm -> accept -> ledger IN) is **built and frozen in Sprint A**. Several features this contract specifies are **not yet built** and are collected honestly in sections 14 (capabilities) and 15 (compliance). This doc goes Stable only when its dependencies below exist. See section 13.

## Dependencies (must exist before Stable)

```
CK Adapter                  todo   dispatch + CK ledger OUT + in-transit (section 12)
Rejection reason codes      todo   section 14.1
Receipt attachments         todo   section 14.2
Persistent draft / discard  todo   section 14.3
Server-side role gate       todo   section 15.1  (compliance, not capability)
Expanded event set          todo   section 14.4
```

Implementation status is *what exists*; dependencies are *what this contract requires before it can be trusted as Stable*. They are different questions and kept separate.

---

## 0. The one hard rule

> **The Receiving Workspace never decides business logic. It calls engine RPCs and displays engine state.**

Every command maps to exactly one frozen RPC (doc 08-frozen-api). The UI computes nothing the engine owns: not stock, not status transitions, not variance, not idempotency, not permissions, not validation of reason codes. It collects operator input, calls the RPC, renders what the engine returns. This is the UI-layer restatement of the adapter contract's invariant. If a screen ever needs to "figure out" whether an action is allowed or what status results, that logic belongs in the engine. The screen asks; the engine decides.

### The quantity invariant (the numeric form of the hard rule)

> **Every quantity shown in the workspace originates from the engine. The workspace never derives inventory quantities, variance, acceptance quantities, stock balances, or ledger movements.**

The one exception is *operator input* — the accepted_qty / rejected_qty a person physically enters at acceptance. That is not a derivation; it is a measurement the operator is accountable for, which the engine then records and posts. Everything else on screen — expected, received, variance, on-hand, any total or rollup — is read from the engine, never computed in the client. If the UI ever adds two numbers together to show a third, the invariant has been broken.

---

## 1. Purpose & scope

Where a **Location** (a restaurant, via RM/BOH staff) turns an inbound shipment into real on-hand stock: receipt -> operational acceptance -> ledger IN. It is the destination-side surface of the Shipment Engine, a **Location-authority** workspace operating inside one location's inbound queue.

### In scope
- Viewing inbound shipments addressed to this location
- Capturing what physically arrived (draft, then confirm arrival)
- Accepting in full, accepting partially (per-line accepted/rejected with reason), or rejecting
- Displaying engine-owned state, variance, events for those shipments

### Explicitly out of scope
- **Dispatch / source-side movement** — the sending location's concern (CK adapter for CK shipments). Destination-only here.
- **The Finance track** — invoice match, financial acceptance, payment. CK shipments are financial_status = NOT_APPLICABLE; vendor finance is a *different* workspace.
- **SC allocation** — an invoice-first procurement concept; absent from goods-first receiving.
- **Brand/platform administration.**
- **Product identity resolution / barcode scanning** — Sprint D; the engine receives a resolved product_id.

### Domain framing (anticipated, not renamed today)
This workspace is one surface inside a broader **Inbound Inventory** domain. Others (Returns, Cross-docking, Transfers) may join it later. When a second inbound workspace appears, the folder becomes domains/inbound-inventory/ holding receiving-workspace.md, returns-workspace.md, etc. **Not renamed now** — one workspace does not justify the parent. Recorded so the evolution is anticipated, not forced.

---

## 1a. Business Outcome

Ensure inbound inventory becomes accurate stock **exactly once**, with a **complete accountable history** from physical arrival through operational acceptance — so that on-hand reflects reality, discrepancies carry a reason, and every quantity can be traced to who stated it.

---

## 2. The accountability model (the spine of this workspace)

Three system acts, three different meanings, escalating accountability:

```
Draft   = working data                    (capturing reality; not yet a statement)
Confirm = accountable arrival statement   ("this is what physically arrived")   [RPC: submit_receipt]
Accept  = inventory ownership statement   ("I accept this stock into inventory") [RPC: operationally_accept_receipt]
```

- **Draft** lets the person doing the physical work record counts as they go. A draft is *not* an official statement — so the person capturing it need not be the person accountable for it.
- **Confirm Arrival** turns the draft into the official receiving record. This is an accountable statement about physical reality. (The internal RPC is submit_receipt; the operator verb is "Confirm Arrival" — operators confirm deliveries, they do not "submit".)
- **Accept** posts the ledger IN. This is the inventory-ownership statement and belongs to whoever is accountable for the location's stock.

Two derived laws:

**Law 1 — Confirm and Accept are never fused.** Even when one person does both in one sitting, they remain **two backend actions** (submit_receipt then operationally_accept_receipt) and two events. The UI may present them as one continuous flow; the audit trail must keep them separate. This is what makes the Dispatched / Received / Accepted / Rejected history operationally valuable — e.g. Supervisor confirms Received: 20, RM later accepts 16 and rejects 4 (spoiled). Fusing them destroys that record.

**Law 2 — Acceptance authority is the inventory-accountability boundary.** Only the role accountable for the location's stock (RESTAURANT_MANAGER, and LOCATION_MANAGER as its superset) may post the ledger IN. This mirrors the engine principle that stock truth has a single accountable owner.

---

## 3. Users & permissions

Physical work and accountable statements are separated deliberately.

| Role | Draft receipt | Confirm arrival | Accept / Reject |
|---|:---:|:---:|:---:|
| BOH Assistant | yes | no | no |
| BOH Supervisor | yes | yes | no |
| Restaurant Manager | yes | yes | yes |
| Location Manager | yes | yes | yes |

The escalation: the Assistant *captures reality* (draft) but makes no accountable statement; the Supervisor *confirms physical arrival*; the RM *accepts ownership*. Default flow is **two-step** — Supervisor confirms on arrival, RM accepts (possibly later). Degrades gracefully: RM present, they do both; RM absent, two-step still works. All roles are **Location authority**.

> **Enforcement note (Required Engine Compliance — see 15.1):** these permissions must be enforced **server-side by the engine RPCs**, not by the UI hiding buttons. Today the acceptance RPCs resolve the actor from p_auth_user_id but do **not** gate by role. The role gate (Assistant cannot confirm; only RM/LM may accept) is a required precondition for Stable. Until built, the split is a UI convention only — insufficient for real accountability.

---

## 4. Domain Objects

Engine-owned entities. (Named "Domain Objects" to distinguish from UI components/widgets/cards, never defined here.)

| Domain Object | Source | Notes |
|---|---|---|
| **Inbound Shipment** | shipments, destination = this location | The expectation. CK source => source_type=CENTRAL_KITCHEN, financial_status=NOT_APPLICABLE. Read-only here. |
| **Receipt** | receiving_tickets (source='SHIPMENT') | Carries receipt_status (DRAFT...). Owns evidence (see 14.2, not yet built). |
| **Receiving Line** | receiving_lines | Per product: expected / received / accepted / rejected. variance_qty DB-generated — **display only, never input**. Rejection reason (see 14.1, not yet built). |
| **Event** | shipment_events | Immutable history stream. Read-only. |

---

## 5. Read Models (what the workspace consumes)

A workspace is mostly reads. It consumes **projections/views**, never raw table queries. (Views marked proposed are created alongside the RM UI; naming indicative.)

| Read Model | View (proposed) | Feeds |
|---|---|---|
| Inbound Queue | v_receiving_workspace_queue | the queue, grouped by state (section 9 IA) |
| Receipt Detail | v_receipt_details | per-receipt line grid: expected/received/accepted/rejected + variance + reason |
| Shipment Timeline | v_shipment_timeline | the event stream for a selected shipment |

Rule: if the UI finds itself SELECTing a table directly, a read model is missing — add the view, don't query the table. Keeps the read side as governed as the write side.

---

## 6. Intent -> Command -> RPC -> Event

Three layers, deliberately separated:
- **User Action** = a UI gesture (click, tap, scan, voice, API call). Belongs to the UI, not this contract.
- **Intent** = the domain concept the operator is expressing. One intent, many possible gestures (desktop, tablet, scanner, API, voice all express the same intent).
- **Command / RPC** = the single engine call that realizes the intent.

| Intent | Command | RPC | Resulting Event / State |
|---|---|---|---|
| Capture counts | Draft Receipt | *(see 14.3 — draft persistence RPC, not yet built; local until then)* | DRAFT (target event: DRAFT_CREATED / DRAFT_UPDATED) |
| Discard capture | Discard Draft | *(see 14.3 — discard RPC, not yet built)* | draft removed (pre-submit only; never deletes a submitted Receipt) |
| Confirm arrival | Confirm Arrival | submit_receipt(auth, shipment_id, location_id, lines, note?) | RECEIPT_SUBMITTED; posts **no** stock |
| Accept inventory (all) | Accept Receipt | operationally_accept_receipt(auth, receipt_id, lines) all accepted | OPERATIONALLY_ACCEPTED + LEDGER_POSTED |
| Accept inventory (partial) | Accept Receipt | operationally_accept_receipt(...) per-line accepted/rejected **+ reason (14.1)** | PARTIALLY_ACCEPTED + LEDGER_POSTED |
| Reject inventory (all) | Reject Receipt | operationally_accept_receipt(...) all rejected **+ reason (14.1)** | OPERATIONALLY_REJECTED; posts nothing |
| Confirm internal transfer (optional) | Confirm Handoff | sc_confirm_handoff(auth, shipment_id) | SC_CONFIRMED_HANDOFF (CK: legitimacy only, no financial effect) |

accepted_qty / rejected_qty are **operator input**, never computed from variance. The operator decides what they physically accept; the engine records and posts it.

---

## 7. States (engine-owned)

```
DRAFT -> SUBMITTED -> OPERATIONALLY_ACCEPTED
                   -> PARTIALLY_ACCEPTED
                   -> OPERATIONALLY_REJECTED
                      (CANCELLED — administrative)
```

OPERATIONALLY_ACCEPTED = all accepted; PARTIALLY_ACCEPTED = some rejected. Operational acceptance is the **only** action here that posts stock — IN only, accepted quantities only. Idempotent via ledger_posted_at: a second accept errors cleanly; UI treats it as "already posted," not failure. For CK shipments the financial/SC tracks are irrelevant here.

Draft note: a draft is a **persistent** system object, resumable by any authorized user until confirmed, and discardable before confirmation (see 14.3). It survives interruptions — shift change, power loss, phone call. It is never an accountable statement.

---

## 8. Operational Metrics vs Watchdogs (kept separate)

**Operational Metrics** (analytics — how are we doing?):

| Metric | Source |
|---|---|
| Acceptance rate | accepted vs received across receipts |
| Variance | variance_qty (DB-generated; never operator-entered) |
| Rejection reasons breakdown | rejection reason_code (see 14.1) |
| Inbound awaiting receipt | dispatched shipments with no receipt yet |

**Watchdogs** (operational alarms — what requires action now?):

| Watchdog | View |
|---|---|
| In-transit stale (>6h, no accepted receipt) | v_shipment_watchdog_in_transit_stale |

(Awaiting-invoice watchdogs are Finance/SC concerns — CK shipments have no invoice track, so they never appear here.)

---

## 9. Information Architecture (navigation, not layout)

```
Receiving Workspace
+-- Inbound Queue
    +-- Awaiting Receipt      (dispatched, in transit, no receipt)
    +-- Draft                 (counts captured, not yet confirmed)
    +-- Awaiting Acceptance   (confirmed, not yet accepted)
    +-- Completed             (accepted / partially accepted / rejected)

Select a shipment
        |
        v
Shipment Detail  (expectation + event timeline)
        |
        v
Receipt          (capture counts -> draft -> confirm arrival)
        |
        v
Acceptance       (accept all / partial + reason / reject + reason -> ledger IN)
```

The bridge from Workspace Contract to the future UI Specification (under ui/): the UI spec lays out *how* each surface looks; this defines *what* surfaces exist and how you move between them.

---

## 10. Error states the UI must handle

Engine raises P0001 for business-rule violations with readable messages. The UI displays them; it never pre-empts them with its own logic.

| Situation | Engine behavior | UI behavior |
|---|---|---|
| Re-accepting an accepted receipt | ledger_posted_at gate errors | Show "already accepted"; treat as success, not failure |
| Accept before confirm | precondition fails | Surface message; keep operator on confirm step |
| accepted + rejected != received (line) | chk_rl_accept_reject_bounds rejects | Surface bound violation; never auto-correct |
| Reject without reason_code (14.1) | *(once built)* RPC rejects | Surface "reason required"; block the reject until chosen |
| reason_code=OTHER without note (14.1) | *(once built)* RPC rejects | Surface "note required for Other" |
| Assistant confirms / non-RM accepts (15.1) | *(once role gate built)* RPC rejects | Surface permission error; never rely on hidden buttons for security |
| Shipment not dispatched / in transit | nothing to accept | Show "awaiting arrival" — the CK-adapter dependency (section 12) |

---

## 11. Out of scope (restated for the UI builder)

No dispatch, no Finance track, no SC allocation, no barcode/identity resolution, no brand/platform admin. If any appear in a receiving screen, the boundary has leaked.

---

## 12. Upstream dependency (honest precondition)

Inbound queue is **empty for CK shipments until the Sprint B CK adapter exists.** The adapter must: (1) dispatch_shipment for CENTRAL_KITCHEN (currently raises "adapter not wired"), (2) post the **CK-side ledger OUT**, (3) put the shipment **in transit**. Only then does a real inbound shipment appear here.

**Build order:** CK adapter -> engine compliance (section 15, closes the live gap first) -> engine capabilities (section 14) -> this contract finalized -> RM acceptance UI.

---

## 13. What "done" means for this contract

Promotes Draft -> Stable when: the CK adapter lands (full flow real end-to-end); the engine capabilities (section 14) are built and the engine compliance gap (section 15) is closed; the Intent->Command->RPC table is verified against deployed signatures; the read-model views exist; and the RM UI is specified against it. It never contains pixels — the UI spec is a separate ui/ artifact that *implements* this contract and is bound by section 0.

---

## 14. Required Engine Capabilities (NOT YET BUILT — do not treat as present)

Capabilities the engine does **not** provide today but which this contract depends on. Each is a backend addition (schema and/or additive frozen-RPC parameter), a Roadmap item, and where it alters behavior, a Decision Log candidate. **Nothing here is a built capability.** This is *absence* — a feature not yet built, not a violation. (Compliance gaps — where the engine violates a law it is already subject to — are separated into section 15.)

### 14.1 Rejection reason codes
Today operationally_accept_receipt takes {receiving_line_id, accepted_qty, rejected_qty} — **no reason**. Required behavior:

```
if rejected_qty > 0:        rejection_reason_code is REQUIRED
if rejection_reason_code = OTHER:   rejection_reason_note is REQUIRED (free text)
```

Proposed enum (CHECK constraint):
```
DAMAGED, TEMPERATURE, EXPIRED, WRONG_ITEM, SHORT_SHIPMENT,
QUALITY, PACKAGING, CONTAMINATION, OTHER
```

Engine work: add reason_code (enum) + reason_note (text) columns to receiving_lines; extend operationally_accept_receipt line payload with optional reason fields; enforce the two conditional-required rules **server-side** (never in UI). Additive to the frozen API (new optional line fields, defaulted) per the stability rule. Enables the Rejection-reasons metric (section 8).

### 14.2 Receipt attachments / evidence
The Receipt is the canonical operational record; evidence belongs with it. No attachment table is wired to receiving_tickets today (precedent exists: waste_log_photos). Required: photos, documents, optional driver signature, optional temperature record — owned by the Receipt. Engine work: attachment table FK to receiving_tickets + storage wiring. Purely additive; no behavioral change to acceptance.

### 14.3 Persistent draft + discard RPCs
The contract treats Draft as a persistent, resumable, discardable object (sections 2, 7). Today receipt_status has DRAFT in its vocabulary, but there is **no RPC to create/update/persist a draft receipt, and none to discard one** before submission. Required: a save-draft RPC (create/update DRAFT receiving_ticket + lines) and a discard-draft RPC (remove a pre-submit draft only — never a submitted Receipt). Emits DRAFT_CREATED / DRAFT_UPDATED (see 14.4).

### 14.4 Expanded event set
History is cheap to write and impossible to reconstruct later — so the target event set is richer than today's. The two are stated separately so no one mistakes a target event for a live one.

**Current engine events (fire today):**
```
RECEIPT_SUBMITTED, OPERATIONALLY_ACCEPTED, PARTIALLY_ACCEPTED,
OPERATIONALLY_REJECTED, LEDGER_POSTED
(+ the shipment-level events: SHIPMENT_CREATED, SHIPMENT_DISPATCHED, SC_CONFIRMED_HANDOFF, ...)
```

**Target events (do NOT fire today — required):**
```
DRAFT_CREATED, DRAFT_UPDATED, ACCEPTANCE_STARTED
```

Engine work: emit the target events from the corresponding RPCs (14.3 provides the draft events). Until built, any UI history view shows only the current set — it must not display target events as if absent-by-error.

---

## 15. Required Engine Compliance (LIVE VIOLATION — not absence)

Distinct from section 14. These are **not** missing features — they are places where the engine does not yet comply with an architectural law it is *already subject to*. A capability gap is absence; a compliance gap is a violation. It is triaged with higher urgency because the system currently *claims* a property it does not enforce.

### 15.1 Server-side role enforcement
The accountability model (section 2) and permission matrix (section 3) are architectural law: BOH_ASSISTANT cannot confirm arrival; only RESTAURANT_MANAGER / LOCATION_MANAGER may accept (post the ledger IN). Today the acceptance RPCs resolve the actor from p_auth_user_id but **do not gate by role** — so the accountability model is currently enforced only by UI convention, which any direct RPC call bypasses. **This is a live violation of the platform rule "permissions are enforced server-side, never by the UI hiding buttons"** (section 0 / adapter contract). Required: enforce the role matrix inside the RPCs. Precondition for Stable, and higher priority than any section 14 capability because it closes a hole, not adds a feature.

---

## 16. Future Extensions (extension points, not roadmap)

Declared here so future additions have a designated home and never pollute the core contract. These are *where new capability plugs in*, not commitments:

- Barcode / QR scanning at receipt (Sprint D identity layer)
- Temperature probe integration (cold-chain)
- Driver signature capture
- Mobile offline mode (draft created offline, synced on reconnect)
- ASN (Advance Ship Notice) support
- OCR of packing slips / delivery notes
- AI anomaly detection (variance/rejection patterns)
- Returns / cross-dock as sibling workspaces under Inbound Inventory (section 1 domain framing)

When one of these is built, it extends this contract at its declared point; it does not rewrite the core.

---

## Coordinated evolution

> **If changing this document requires changing another frozen document, update both in the same revision or neither.**

This contract is bound to the Shipment Engine frozen API, the adapter contract, and the workspace template. If a change here implies a change there (or vice versa), they move together in one revision — never leaving two frozen documents in quiet disagreement.
