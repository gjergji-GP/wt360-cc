# WT360 Documentation Architecture

Status: Frozen
Authority: Platform
Owner: Platform Architecture
Version: 1.0
Last Updated: 2026-07-08

Purpose: Defines the approved structure, header standard, and governance rules for the entire WT360 documentation system. This is the specification the one-time Drive migration must produce.

Depends On:
- Platform Principles
- Administrative Hierarchy

Related:
- README (the system map that implements this spec)

Supersedes:
- None

---

## 0. Status of this document

This is the **approved target architecture**, frozen as a decision. The live Google Drive does **not** yet match it — the current Drive tooling cannot move, rename, or delete folders, so the migration is deferred until a move/rename/trash capability exists. When it does, the migration is a single 10–15 minute operation that makes Drive match this spec exactly.

**The tooling limitation does not shape the architecture.** Drive conforms to this document; this document never bends to Drive.

Until migration, the current Drive state is: a single `WT360 Docs/` root containing a flat `architecture/` folder (holding the 3 architecture docs), a `shipment-engine/` folder (9 docs), empty `locations/` and `workspaces/` folders, and a `README`. That state is the recovery point. It is left untouched.

---

## 1. The canonical root

There is exactly **one** documentation root, forever:

```
WT360 Docs/
```

No parallel trees. No `v2`. No dated snapshots. If the structure needs to change, it changes in place, once, deliberately — never by forking the root.

---

## 2. The approved tree

```
WT360 Docs/
├── 00-README
├── 01-Roadmap
├── 02-Decision Log
├── 03-Glossary
│
├── architecture/
│
├── domains/
│   ├── shipment-engine/
│   ├── inventory/
│   ├── procurement/
│   ├── production/
│   ├── finance/
│   ├── hr/
│   ├── locations/
│   └── brands/
│
├── ui/
├── integrations/
├── testing/
└── archive/
```

The four top-level governance documents (`00`–`03`) are numbered so they sort above the folders and establish reading order. Everything else is a folder.

---

## 3. What each part is for

| Part | Role |
|---|---|
| **00-README** | The system map. Points to authoritative docs; never restates them. |
| **01-Roadmap** | Intended future work. The *only* place "we plan to…" statements are allowed. |
| **02-Decision Log** | Architectural decisions + rationale. Split into Accepted and Open. |
| **03-Glossary** | The canonical vocabulary. One definition per term. |
| **architecture/** | Universal, cross-cutting rules (principles, hierarchy, multi-brand certification). |
| **domains/** | Business subsystems — each a first-class domain with its own folder. |
| **workspaces/** | User-facing operational surfaces (interaction contracts: Objects/Commands/KPIs/Events/Permissions/Automation). |
| **ui/** | Visual/UI specifications, once UI work begins. |
| **integrations/** | External system contracts (eBills, FaceShift, payment, etc.). |
| **testing/** | Test strategy, harnesses, certification test suites. |
| **archive/** | Superseded/archived docs, retained for history only. |

The distinction that anchors the whole tree: **architecture defines universal rules; domains define business subsystems; workspaces define operational surfaces.** Shipment Engine is a *domain*, not an architecture document — that was the founding correction of this structure.

---

## 4. The folder rule (frozen)

> **Every folder represents a first-class architectural domain or category.**
> **Empty folders are permitted only if they are part of this approved architecture.**
> **Ad-hoc folders are never permitted.**

Folders are architecture; documents are knowledge. An intentional empty `domains/inventory/` declares "Inventory is a first-class domain" — that is useful and honest. An accidental `misc/`, `temp/`, `new/`, or `stuff/` is rot and is forbidden. The `.gitkeep` convention is the mental model: an empty folder can be a deliberate structural statement.

A new folder may be added only by adding it to this spec first (a Decision Log entry), never ad hoc.

---

## 5. The document header standard (frozen)

Every document begins with its H1 title, immediately followed by a metadata block. **H1 first — it is always the first thing a human sees** — then the block, then the body.

```
# <Document Title>

Status: <Draft | Stable | Frozen | Deprecated | Superseded | Archived>
Authority: <Platform | Brand | Location>
Owner: <team or role>
Version: <x.y>
Last Updated: <YYYY-MM-DD>

Purpose: <one sentence — why this document exists>

Depends On:
- <doc or none>

Related:
- <doc or none>

Supersedes:
- <doc or none>
```

The header answers, at a glance: is this valid, can I change it, who governs it, why does it exist, and what breaks if I change it. If Drive ever moves to Git, a trivial script converts this block into YAML front matter — but today's readability wins over a hypothetical future migration.

### Status vocabulary

| Status | Meaning |
|---|---|
| **Draft** | Actively evolving. Not authoritative. |
| **Stable** | Accurate representation of the current system. Expected to grow. |
| **Frozen** | Baseline or specification. Changes only by deliberate revision. |
| **Deprecated** | Still valid historically but should not guide new work. |
| **Superseded** | Replaced by another document. Read only for history. |
| **Archived** | Retained only for record keeping. |

### Authority values

`Platform`, `Brand`, or `Location` — tying every document directly to the Administrative Hierarchy, so each doc communicates *who governs it*.

### The Purpose field

One sentence: **why does this document exist?** This single field prevents drift — anyone proposing a change can immediately tell whether it belongs in this document or another.

---

## 6. Governing rules (frozen)

1. **The documentation describes the system. It never describes intentions.**
   Good: "Shipment Engine posts inventory through `post_stock_ledger_movement_as()`."
   Bad: "We plan to post inventory through…"
   Future work belongs in `01-Roadmap` only — never inside an architecture or domain document.

2. **One concept has one canonical home.**
   A concept is defined in exactly one document. Everything else *references* it; nothing copies it. The Administrative Hierarchy lives in `architecture/01-administrative-hierarchy` alone; the Multi-Brand Certification doc references it, does not restate it. (Migration action: the certification doc's former inline §0 becomes a reference to the hierarchy doc — see §8.)

3. **README is a map, never the system.** It lists what exists and points to it. When the map and a document disagree, the document wins.

4. **One domain = one folder. One concept = one file.** Documents mature independently. No single doc becomes a catch-all.

5. **Frozen docs change only by deliberate revision** with a Decision Log entry — not ad hoc edits.

6. **Live system of record is the database.** Docs describe intent and contracts; the Supabase schema (`knquzjqxhduyxxljuede`) and deployed app are the final authority on current runtime state.

---

## 7. The four governance documents

### 01-Roadmap
The single home for intended work. Everything the system *will* do but doesn't yet. Sourced from the standing backlog (Workspace Catalog, multi-brand remediation gated on D1/D2, location docs, UI, etc.). Keeps intentions out of the descriptive docs.

### 02-Decision Log
Two sections, and decisions **move** between them rather than being edited in place:

```
Accepted Decisions
------------------
D1 … (with date + outcome)

Open Decisions
--------------
D8 … (still requires owner input)
```

When an Open decision is resolved, it moves to Accepted with its date and outcome. This preserves the full history of architectural choices while keeping it obvious what still needs attention. Seeded from the multi-brand Decision Log (D1–D9), which currently has all nine Open.

### 03-Glossary
One canonical definition per term. Grows to hundreds of entries; becomes the shared vocabulary for developers, operations, AI agents, and new hires. Seed set:

| Term | Meaning |
|---|---|
| Shipment | Source-agnostic movement of goods |
| Receipt | Physical confirmation of received goods |
| Operational Acceptance | The point at which received stock becomes real in the ledger |
| Financial Acceptance | The point at which an invoice is accepted for payment |
| SC Confirmation | Supply Chain confirms delivery legitimacy and hands the financial track to Finance |
| Location | A physical operational site |
| Brand | A business tenant |
| Capability | What a location is permitted to do |
| Workspace | A user-facing operational surface |
| Task | A unit of work |
| Event | An immutable business fact |
| Authority | An architectural governance level (Platform / Brand / Location) |
| Ledger Gateway | The sole sanctioned path to post stock (`post_stock_ledger_movement_as`) |

### 00-README
The map. Implements this spec: lists the tree, the authoritative source per domain, built-vs-planned status, and the planned (not-yet-authored) domains.

---

## 8. Migration checklist (execute once, when move/rename/trash exists)

This is the exact sequence to make Drive match this spec. It is a one-time ~10–15 minute operation.

1. **Create governance docs** at root: `00-README`, `01-Roadmap`, `02-Decision Log`, `03-Glossary` (rename existing `README` → `00-README`).
2. **Create `domains/`**; move `shipment-engine/` and `locations/` folders into it.
3. **Create the remaining approved domain folders** (empty, intentional): `inventory/`, `procurement/`, `production/`, `finance/`, `hr/`, `brands/`.
4. **Create category folders** (empty, intentional): `ui/`, `integrations/`, `testing/`, `archive/`.
5. **Retrofit the header block** (§5) onto all existing docs — H1 first, metadata second — filling Status/Authority/Owner/Purpose per doc.
6. **De-duplicate the hierarchy:** replace the certification doc's inline §0 with a reference to `architecture/01-administrative-hierarchy` (rule §6.2). The hierarchy doc is the one canonical home.
7. **Verify** every doc from the old flat structure now exists in the new tree with a header.
8. **Trash the now-empty old folders** (`architecture/` stays — it is still in the approved tree; only the emptied `shipment-engine/` and `locations/` at the old top level are removed after their contents move into `domains/`).

Suggested Authority/Status assignments for existing docs:

| Doc | Status | Authority |
|---|---|---|
| architecture/00-platform-principles | Frozen | Platform |
| architecture/01-administrative-hierarchy | Frozen | Platform |
| architecture/02-multi-brand-certification | Frozen | Platform |
| domains/shipment-engine/00-done-condition-signoff | Stable | Brand |
| domains/shipment-engine/01-domain | Stable | Brand |
| domains/shipment-engine/02-state-machine | Stable | Brand |
| domains/shipment-engine/03-ledger-matrix | Stable | Brand |
| domains/shipment-engine/04-sc-finance-boundary | Stable | Brand |
| domains/shipment-engine/05-watchdogs | Stable | Brand |
| domains/shipment-engine/06-testing | Stable | Brand |
| domains/shipment-engine/07-adapter-contract | Frozen | Brand |
| domains/shipment-engine/08-frozen-api | Frozen | Brand |

---

## 9. Why this is frozen now

Freezing the architecture before the Drive matches it is deliberate: it means the eventual migration is mechanical execution of an approved design, not a fresh set of decisions made under time pressure. The structure is governed by architectural intent, not by what the tooling happened to allow on the day. When the capability to migrate arrives, this document is the instruction set.
