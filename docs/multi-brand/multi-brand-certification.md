# Multi-Brand Certification

**WT360 · Green & Protein · Supabase `knquzjqxhduyxxljuede`**
Status: **ARCHITECTURE ARTIFACT — not a remediation ticket.** No code changes proposed here; this defines *what must be true* before a second brand, and *how we prove it*.

Two governing principles (both load-bearing):
- **Stages 1–2 are a loop, not a waterfall.** The sovereignty/shared matrices and the capability audit refine each other. A capability audit will expose a shared edge the matrix missed (the Central Kitchen is the canonical example — its status changes the correct answer for five capabilities at once). Draft → test against capabilities → revise → repeat until stable.
- **Certification is severity-gated, not perfection-gated.** The goal is a platform that can *safely* host two businesses, not a perfectly elegant one. We define a **minimum-safe gate** (blocks brand creation) distinct from a **full go-live gate** (blocks a brand going fully live). This prevents the milestone becoming an endless rewrite.

---

## 0. Administrative Hierarchy (governance framework)

This section is the **lens for every authorization, workflow, and UI decision** in the platform. Where §3–§10 define *what must be isolated* (the data boundary), this defines *who governs each layer* (the authority boundary). Together they are the reference point, so future decisions are looked up, not re-argued.

### The three layers (with room reserved for a fourth)

```
Platform          owns the software
    ↓
[Organization]    RESERVED — an org may someday own multiple brands; not built, not foreclosed
    ↓
Brand             owns the business
    ↓
Location          owns operations
```

| Layer | Owns | Examples |
|---|---|---|
| **Platform** | The software / tenancy | Brands, licensing, global catalogs, authentication, integrations, platform audit, feature flags |
| **Brand** | The business | Locations, employees, menus, recipes, vendors, pricing, inventory, finance |
| **Location** | Daily operations | Receiving, waste, production, sales, daily counts, on-site staff |

**Organization layer (reserved, not built):** an Organization could own multiple brands (e.g. a food group owning Green & Protein + other brands). Nothing frozen here may foreclose inserting `Organization` between Platform and Brand later. Green & Protein never needs to know Organizations exist; the platform must not make them impossible.

### Guiding principles (frozen)

1. **Users work inside a brand. Administrators work above brands.**
   Explains at a glance why locations belong to Brand administration while brands belong to Platform administration. Operational work happens *inside* a brand; tenant management happens *above* it.

2. **Administration follows ownership. Operational permissions follow usage.**
   These are different axes and must not be conflated:
   - A Brand belongs to *Platform* administration even though it contains locations.
   - A Location belongs to *Brand* administration even though it contains inventory.
   - Inventory belongs to *Brand* administration even though restaurants manipulate it hourly.
   - Employees belong to *Brand* administration even though Location Managers supervise them daily.

   This is the guardrail against permission drift: without it, things slowly migrate to whoever *uses* them most, quietly dissolving the tenant boundary. Ownership determines administration; usage determines operational permissions.

3. **Authorities are architectural; roles are assignments to them.**
   The model names **Platform / Brand / Location Authority** — not job titles. Current roles are simply mapped to authorities and may evolve. One company calls the Platform Authority holder "Owner," another "CEO," another "Board," another "Platform Administrator" — the architecture only needs to know *who holds Platform Authority*.

   | Authority | Current role(s) | May become |
   |---|---|---|
   | Platform Authority | `SYSTEM_ADMIN` | Owner / dedicated Platform Admin |
   | Brand Authority | `COO`, `CFO` (where appropriate) | Brand Director, GM |
   | Location Authority | `LOCATION_MANAGER`, `RESTAURANT_MANAGER` | Store Manager |

   A single person may hold authorities at **multiple layers** (the Owner holds Platform + Brand; the CFO holds Brand-layer Finance plus a Platform-adjacent cross-brand view) — but each *authority* is still cleanly assigned to one layer, and multi-layer holding must be **explicit and auditable**, never ambient.

### Brand lifecycle authorities

Brand lifecycle is **not** one operation under one role. It decomposes by authority, separating technical administration from business governance:

| Action | Authority | Notes |
|---|---|---|
| Create Brand | Platform Authority (SYSTEM_ADMIN today) | Creates a tenant. Gated behind the §7 minimum-safe certification gate. |
| Configure Brand | Platform Authority / delegated | Branding, defaults, domains, integrations. |
| Activate (Go Live) | Brand Authority — Owner + COO (± CFO approval) | Business decision *after* certification, not technical. |
| Suspend Brand | Platform Authority (Owner) | Stops operations, preserves data. |
| Archive Brand | Platform Authority (Owner) | Permanently inactive, retained for audit. |
| Hard Delete | **No UI. DB-only emergency op.** | Should practically never happen. Never a button. |

### Where brand management lives (frozen boundary)

**Brand management does NOT belong in any Command Centre.** A Command Centre is an *operational workspace* — you operate *inside* a brand. A brand is the *root tenant* — you administer it from *above*. These must not mix.

A separate **Platform Administration** area is hereby recorded as a permanent architectural boundary:

```
Platform Administration
    ├── Brands
    ├── Organizations (reserved)
    ├── Licensing
    ├── Authentication
    ├── Integrations
    ├── Platform Audit
    └── Feature Management
```

This is **not a roadmap item — it is a boundary.** The UI may not be built for years (there is one brand today). But the boundary exists now, so that when brand #2 arrives nobody adds Brand Management to an existing CC "because it's expedient" and permanently welds tenant administration to business operations.

---

## 1. Purpose

Define the conditions under which WT360 can safely host a second independent brand alongside Green & Protein, without unintended data visibility or operational coupling.

"Multi-Brand Certified" means: **the platform can host two independent businesses such that neither can see the other's data, and shared infrastructure (if any) is shared by explicit design, not by accident.**

This is a first-class architectural milestone with a clear definition of done — not an open-ended "support multiple brands" program.

---

## 2. Current audit verdict

Measured against the live schema:

| Layer | Total | Enforces brand | Gap |
|---|---|---|---|
| Brand-scoped tables (RLS) | 62 | 62 RLS-on; 50 brand-aware policy | **12 RLS-on but not brand-aware** |
| SECURITY DEFINER functions | 334 | 180 reference brand; 20 location | **109 reference neither (bypass RLS)** |
| Views | 100 | 76 reference brand; 78 security_invoker | **13 reference neither** |

**Verdict: schema is multi-brand *capable*; enforcement is ~75% complete; the remaining ~25% is concentrated, findable, and fixable — but real. The failure mode is one business seeing another's data.**

The single largest item is the **109 brand-blind SECURITY DEFINER functions** — but (critical reframing) a brand-blind function is only a *bug* if the data it touches is *brand-owned*. That verdict depends entirely on the Sovereignty Matrix (§3). Some of the 109 are correct (they touch platform data); some are breaches. The matrix is what tells them apart.

Confirmed concrete leaks already visible (all Critical/High):
- `audit_trail` — RLS policy `is_cfo() OR is_finance() OR is_system_admin()`, **no brand filter**. Brand A's CFO would read Brand B's entire audit history.
- `system_config` — has `brand_id`, but SELECT policy is `current_employee_id() IS NOT NULL` (any employee). Brand-scoped config readable across brands.
- `production_tolerance_rules` — readable by any employee, brand-blind.
- `shipments` — **0 RLS policies** (currently default-deny, reachable only via engine RPCs — not a live leak, but brand-unscoped the moment it's opened for direct read).

---

## 2a. Decision Log

Single source of truth for every open decision this document depends on. The `⚠ REQUIRES OWNER DECISION` markers throughout §3–§5 are all surfaced here so they are *trackable*, not buried. Nothing in the Critical gate (§7) can close while its blocking decisions are `OPEN`.

| # | Date | Decision | Owner | Gates | Status |
|---|---|---|---|---|---|
| D1 | TBD | **Central Kitchen** — shared vs brand-owned | Owner | Inventory Ledger, Production, Receiving, Shipments, Transfers (5 capabilities) | **OPEN** |
| D2 | TBD | **Warehouse / HQ** — shared vs brand-owned | Owner | Inventory, Receiving, Storage | **OPEN** |
| D3 | TBD | **Cross-brand CFO/COO/Owner access** — ⚠ ALREADY EXISTS (v126): CFO + SC Command Centres contain brand switchers defaulting to "All Brands", filtered client-side, ungated + unaudited. Decision is no longer *whether* to allow it but how to make it **explicit, authorized, server-enforced, and auditable**. | Owner | §5 identity model; `current_brand_id()` → auditable brand-context; **reclassified from design-decision to remediation** | **OPEN — CRITICAL** |
| D4 | TBD | **Vendors** — shared vs brand-owned | Owner | Procurement, Finance | **OPEN** (default: brand-owned) |
| D5 | TBD | **Products / Recipes** — shared vs brand-owned | Owner | Inventory, Menu, Production | **OPEN** (default: brand-owned) |
| D6 | TBD | **Customers (future CRM)** — shared vs brand-owned | Owner | CRM, Orders | **OPEN** |
| D7 | TBD | **Notifications** — brand-owned vs platform-level system notices | Owner | Notifications capability | **OPEN** (default: brand-owned) |
| D8 | TBD | **Brand creation authority** — confirm Platform Authority level (§0 lifecycle table) | Owner | `create_brand` RPC, §7 gate | **OPEN** (default: Platform Authority / SYSTEM_ADMIN) |
| D9 | TBD | **Authority→role mapping** — do we add a distinct `OWNER` role, or keep SYSTEM_ADMIN as Platform Authority holder? Architecture ties to *authorities* (§0), not titles; this is only about which DB role(s) map to Platform Authority. | Owner | §0 authority model | **OPEN** (default: SYSTEM_ADMIN = Platform Authority for now) |

**Status vocabulary:** `OPEN` (undecided) → `DECIDED` (owner ruled; record date + outcome) → `IMPLEMENTED` (remediation reflects it) → `CERTIFIED` (tested in §10).

**Rule:** D1 and D2 are the critical-path blockers — they determine whether the tables in §4's undecided rows *should* isolate or *should* share, which in turn determines which of the 109 brand-blind functions are bugs. Resolve D1/D2 before any Stage-3 remediation begins.

---

## 3. Brand Sovereignty Matrix

For every table: **who owns this data?** Once ownership is explicit, brand filtering is almost mechanical:
- **Platform-owned** → never filters by brand (filtering would fragment shared knowledge — an anti-goal).
- **Brand-owned** → almost always must filter by brand.
- **Location-owned** → inherits brand *through* location (filter by location, brand follows).

First draft below, derived mechanically from the schema (presence of `brand_id`, catalog/reference nature, location-scoping). **Rows marked `⚠ DECISION` require owner input — they are business calls, not technical ones.**

### Platform-owned (global forever — must NOT filter by brand)
Confirmed brand-free by schema (no `brand_id`):
`status_catalog`, `permissions`, `pos_permissions`, `roles`, `task_types`

Should also be platform (verify none accidentally grow a brand_id):
countries, currencies, measurement units, barcode types, permission catalog.

> **Anti-goal reminder:** do not add brand filters to these. Duplicating platform knowledge per brand creates drift.

### Brand-owned (must filter by brand)
Derived from tables carrying `brand_id` that hold brand business data:
`employees`, `employee_documents`, `employee_invitations`, `employee_status_log`, `staff_contracts`, `timesheet_audit_log`, `locations`, `menu_products`, `menu_product_activations`, `pos_menus`, `pos_menu_publications`, `pos_orders`, `pos_payment_events`, `pos_*` (all POS tables), `stock_ledger`, `inventory_transfers`, `physical_counts`, `fiscal_invoices`, `purchase_orders`, `purchase_order_lines`, `po_receipts`, `po_receipt_lines`, `production_batches`, `production_batch_lines`, `waste_logs`, `retail_price_records`, `audit_trail`, `notifications`, `org_messages`, `org_groups`, `shift_checkins`, `face_embeddings`, `face_recognition_events`, `faceshift_devices`, `sc_delivery_allocations`, `shipments`, `brand_configs`, `system_config` *(has brand_id despite the name — treat as brand-owned)*.

### Location-owned (inherit brand through location — no own brand_id)
`receiving_tickets`, `procurement_tasks`, `procurement_allocations`, `stock_transfers`, `shift_schedules`, `shift_schedule_lines`, `delivery_discrepancies`, `employee_onboarding_requests`, `employee_offboarding_requests`, `menu_product_activation_scopes`, `location_capabilities`, `location_inventory_settings`.

> These are safe *if and only if* the location→brand link is never bypassed. The audit's finding that `is_hq()`/`is_cfo()` branches skip the location filter is exactly where location-owned tables can leak for privileged roles.

### ⚠ REQUIRES OWNER DECISION (sovereignty undetermined)
| Domain | Default assumption (provisional) | Status |
|---|---|---|
| Vendors | Brand-owned | ⚠ DECISION — could be shared supplier master |
| Products (`master_products`) | Brand-owned | ⚠ DECISION |
| Recipes (`menu_bom_*`, `sf_bom_*`, formulas) | Brand-owned | ⚠ DECISION |
| Central Kitchen | **UNDECIDED** | ⚠ DECISION — highest-impact single call |
| Warehouse / HQ | **UNDECIDED** | ⚠ DECISION |
| Customers (future CRM) | Undetermined | ⚠ DECISION |
| Notifications | Brand-owned (likely) | ⚠ DECISION — could have platform-level system notices |

---

## 4. Shared vs Isolated Matrix

The decision that determines what "correct isolation" even means. Until this is settled, **no function without a brand filter can be judged right or wrong.**

| Domain | Shared | Brand-owned | Status |
|---|---|---|---|
| Locations | ❌ | ✅ | Settled |
| Employees | ❌ | ✅ (w/ cross-brand admin exception — see §5) | Settled |
| Inventory / stock_ledger | ❌ | ✅ | Settled |
| Finance / fiscal_invoices | ❌ | ✅ | Settled |
| Audit trail | ❌ | ✅ | Settled |
| Orders (POS) | ❌ | ✅ | Settled |
| Platform catalogs (status, roles, permissions, task_types, units, currencies) | ✅ | ❌ | Settled |
| **Vendors** | ? | probably ✅ | ⚠ REQUIRES OWNER DECISION |
| **Products / Recipes** | ? | probably ✅ | ⚠ REQUIRES OWNER DECISION |
| **Central Kitchen** | ? | ? | ⚠ REQUIRES OWNER DECISION *(gates 5 capabilities)* |
| **Warehouse / HQ** | ? | ? | ⚠ REQUIRES OWNER DECISION |
| **Customers** | ? | ? | ⚠ REQUIRES OWNER DECISION |
| Notifications | Maybe | Maybe | ⚠ REQUIRES OWNER DECISION |

**Why the Central Kitchen is the pivotal call:** if CK is *shared* (one kitchen producing for both brands), then `production_batches`, `stock_ledger` (CK movements), `shipments` (CK→restaurant), `inventory_transfers`, and `receiving_tickets` at CK are all *legitimately* cross-brand — and forcing brand filters on them would break the sharing. If CK is *brand-owned* (each brand its own kitchen), those same tables must strictly isolate. **One decision, five capabilities' correct behavior.** This is why Stages 1–2 loop: you cannot finish the production/inventory capability audit until CK sovereignty is fixed.

---

## 5. Cross-brand roles decision

Not a leak to fix — a **feature to design.** Some roles are *deliberately* cross-brand.

Current reality: `current_brand_id()` returns **exactly one brand** per user (from employee or home location). A genuinely cross-brand user is today locked to one brand's data at the *data* layer.

**⚠ v126 UI FINDING — cross-brand viewing already exists (this is no longer theoretical):**
Reading the live app (v126) revealed that **two Command Centres already contain brand switchers**:
- **CFO Command Centre** — a brand selector with an explicit **"All Brands"** default (consolidated view across all brands).
- **Supply Chain Command Centre** (`SCHeader`) — a brand dropdown, also defaulting to "All Brands", re-scoping SC data by selected brand.

Both read from `brand_configs`, and both **filter client-side** by the selected brand. Three consequences:
1. **The capability is already built, not future.** The moment brand #2 exists, these switchers are the cross-brand access surface — live, by default.
2. **It is ungated and unaudited.** No permission check on who may select "All Brands"; no logging of consolidated-view access. This is exactly the *ambient* cross-brand access the Authority Principle (§0) forbids.
3. **Client-side filtering is the leak vector.** If the underlying RPC returns all-brands data and the UI narrows it in JavaScript, the other brand's data already reached the client. Real isolation must be **server-enforced** — which ties directly to the 109 brand-blind SECURITY DEFINER functions. A client-side brand filter over an unfiltered RPC is not isolation.

Per §0, this is a **Platform-layer authority (viewing across tenants) currently held ambiently by Brand-layer roles.** That is permissible *only* when made explicit, permissioned, server-enforced, and audited. Until then it is a Critical-tier finding, not a design question.

**No brand CREATE/UPDATE/DELETE exists anywhere in v126** — confirmed: zero writes to the `brands` table in the entire app, matching the data layer (no `create_brand` RPC; `brands` writes default-deny). Brand *creation* is correctly absent. Brand *viewing across brands* is the surface that already exists and must be governed.

⚠ **REQUIRES OWNER DECISION:**
- Which roles, if any, see **consolidated cross-brand** data? (Provisional: Owner, possibly CFO/COO for group financials.)
- Is cross-brand access **explicit and auditable** (a deliberate "view all brands" mode that logs access) or ambient (the role simply isn't brand-filtered)?

**Architectural consequence:** if cross-brand roles exist, `current_brand_id()` must evolve into a brand-*context* with an explicit switcher (`current_brand_context()` returning the *active* brand, plus an "all brands" capability gated to specific roles and logged). This is a real change hiding inside "Employees → brand-owned," and it must be **explicit, permissioned, and audited** — never an unfiltered bypass.

Default until decided: **Employees brand-owned; cross-brand admin is an explicit, logged exception, not an ambient absence of filtering.**

---

## 6. Capability audit by severity

Reviewed by **business capability** (the real attack surface), not by function inventory. For each: *Can Brand A ever see or affect Brand B?* Then drill into the supporting functions/tables/views/policies. This avoids reviewing helper functions that cannot leak, and catches leaks the function-count misses.

### CRITICAL (blocks brand creation — §7)
| Capability | Key surfaces | Known findings |
|---|---|---|
| **Finance** | `fiscal_invoices`, payment RPCs, finance views | brand-owned; verify every finance RPC filters brand |
| **Inventory Ledger** | `stock_ledger`, gateway `post_stock_ledger_movement_as` | brand-owned (unless CK shared); gateway derives brand from location — verify no cross-brand post |
| **Audit Trail** | `audit_trail` | **CONFIRMED LEAK** — CFO/Finance policy has no brand filter |
| **Procurement / PO** | `purchase_orders`, `purchase_order_lines`, `po_receipts` | location-scoped; `is_hq()` branch bypasses — verify HQ role brand-bounded |

### HIGH (blocks full go-live — §8)
| Capability | Key surfaces | Notes |
|---|---|---|
| Receiving | `receiving_tickets`, Shipment Engine RPCs | location-owned; Shipment Engine already firewalled but brand-unscoped in `shipments` policies (0 policies) |
| Production | `production_batches`, `production_tolerance_rules` | `production_tolerance_rules` **brand-blind readable** — leak; also gated by CK decision |
| Orders (POS) | `pos_orders`, `pos_payment_events`, all `pos_*` | brand-owned; verify POS session/device resolution can't cross brand |
| Waste | `waste_logs`, `waste_log_photos` | brand-owned; lower data sensitivity but still isolate |

### MEDIUM (harden before full confidence)
| Capability | Key surfaces | Notes |
|---|---|---|
| Reporting / Dashboards | ~100 views | 78 security_invoker (safe); **13 brand-blind views** to check |
| Analytics | aggregate views/RPCs | ensure aggregates don't pool across brands |
| Tasks | `tasks`, `task_types` | `task_types` platform-global (correct); `tasks` instances brand/location-owned — verify |
| Notifications | `notifications`, `org_messages` | ⚠ depends on shared-vs-isolated decision |

### LOW (platform-global — must NOT be brand-filtered)
| Capability | Surfaces | Notes |
|---|---|---|
| Reference / Catalogs | `status_catalog`, `roles`, `permissions`, `pos_permissions`, `task_types` | correctly brand-free; **do not add brand filters** |
| Configuration | `system_config`, `brand_configs` | **have brand_id** — these ARE brand-owned despite "config" name; `system_config` currently readable by any employee → **fix** |

---

## 7. Minimum-safe certification gate

**The gate that must be cleared before a second brand row may be created at all.** Clears the Critical tier only. A brand cannot exist until:

- [ ] Sovereignty Matrix (§3) finalized — all ⚠ DECISION rows resolved
- [ ] Shared-vs-Isolated Matrix (§4) finalized — **especially Central Kitchen + Warehouse**
- [ ] Cross-brand roles (§5) decided; if any exist, `current_brand_id()` → auditable brand-context implemented
- [ ] **Finance** capability certified isolated
- [ ] **Inventory Ledger** capability certified isolated (respecting CK decision)
- [ ] **Audit Trail** leak fixed (add brand filter to policy) + certified
- [ ] **Procurement/PO** certified — HQ/privileged-role bypass branches brand-bounded
- [ ] `create_brand` RPC exists with owner/system-admin-level authority (brand creation is above CFO/COO — see §10)
- [ ] Cross-brand access test passes for all 4 Critical capabilities (see §10)

Until every Critical box is checked, **brand #2 must not be created.**

---

## 8. Full go-live certification gate

**Additional boxes before a created brand may go *fully* operational** (staff, sell, transact at scale). Clears High + Medium:

- [ ] Receiving, Production, Orders, Waste (High) each certified isolated
- [ ] `production_tolerance_rules` brand-blind read fixed
- [ ] `shipments` RLS policies added (brand-aware) if direct read is enabled
- [ ] Reporting/Dashboards: 13 brand-blind views reviewed; non-invoker ones fixed
- [ ] Analytics aggregates verified not to pool across brands
- [ ] Tasks + Notifications isolation confirmed (per §4 decision)
- [ ] `system_config` per-employee read restricted appropriately
- [ ] Full cross-brand + escalation + admin test suite passes (§10)

---

## 9. Remediation backlog

Ordered by the severity gate, not by discovery order. Each item is dry-run-first, per standing discipline.

**Blocks-creation (Critical):**
1. Fix `audit_trail` RLS — add brand scoping to the CFO/Finance/admin SELECT policy.
2. Audit the 109 brand-blind SECURITY DEFINER functions **filtered to Critical capabilities first** (finance, ledger, PO) — classify each as (correct: platform data) / (bug: brand-owned, needs filter). Only the bugs get fixed.
3. Verify ledger gateway + finance RPCs derive and enforce brand on every path.
4. Build `create_brand` RPC with owner-level authority.
5. Implement auditable brand-context if cross-brand roles are approved.

**Blocks-go-live (High/Medium):**
6. `production_tolerance_rules` + `system_config` read policies.
7. `shipments` brand-aware policies (before any direct-read exposure).
8. Remaining brand-blind functions (High/Medium capabilities).
9. 13 brand-blind views.

**Never do:**
- Do not add brand filters to platform catalogs (§3, §6-LOW). Over-scoping is its own bug.

---

## 10. Sign-off criteria

The platform is **Multi-Brand Certified** when — and only when — every box below is proven, not asserted. Proof = a passing test, not a code read.

**Isolation (per capability):**
- [ ] Inventory isolated  · [ ] Finance isolated · [ ] Procurement isolated · [ ] HR isolated
- [ ] Production isolated · [ ] Orders isolated · [ ] Receiving isolated · [ ] Waste isolated
- [ ] Reporting isolated · [ ] Analytics isolated · [ ] Tasks isolated · [ ] Notifications isolated

**Cross-brand behavior (tested with two real brands + seeded data):**
- [ ] Cross-brand **read** test — Brand A user cannot SELECT any Brand B row through any RPC/view/table
- [ ] Cross-brand **escalation** test — no privileged role (HQ/SC/Finance/CFO) leaks across brands via a bypass branch
- [ ] Cross-brand **admin** test — intended cross-brand roles see consolidated data *only* through the explicit, audited brand-context; no ambient leakage
- [ ] Platform-global data confirmed **shared** (catalogs identical across brands, not duplicated)
- [ ] Shared infrastructure (if CK/warehouse shared) confirmed shared **by design**, with movements correctly attributed

**Governance:**
- [ ] `create_brand` restricted to owner/system-admin level
- [ ] Every ⚠ DECISION in §3–§5 has a recorded owner decision

**Definition of done:** the platform can host two independent businesses with no unintended data visibility or operational coupling. Minimum-safe gate (§7) permits brand creation; full go-live gate (§8) permits full operation; this section (§10) certifies the milestone complete.

---

## Provisional defaults (until owner decides — do not treat as settled)

Cross-referenced to the Decision Log (§2a). Provisional defaults hold *only* until the corresponding `D#` is marked `DECIDED`.

| Log # | Decision | Provisional default | Authority |
|---|---|---|---|
| D1 | Central Kitchen | UNDECIDED | Owner |
| D2 | Warehouse / HQ | UNDECIDED | Owner |
| D4 | Vendors | Brand-owned | Owner |
| D5 | Products / Recipes | Brand-owned | Owner |
| — | Employees | Brand-owned + explicit cross-brand admin exception | Owner |
| D3 | CFO/COO/Owner cross-brand | Possible; must be explicit + auditable | Owner |
| D8 | Brand creation authority | Owner / System-Admin (above CFO/COO) | Owner |

These are **business decisions, not technical calls.** The technical remediation cannot be judged correct until they are made.

---

## Baseline status

**This document is the FROZEN ARCHITECTURE BASELINE for multi-brand work.** Changes to the sovereignty model, severity gates, or certification criteria should be made as deliberate revisions to this baseline (with a Decision Log entry), not ad hoc. The audit verdict (§2) is a point-in-time snapshot — re-run the four-layer scan before beginning remediation, as the schema will have moved.
