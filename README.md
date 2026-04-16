# WT360 — Workforce & Operations Platform

WT360 is a multi-tenant F&B operations platform built for **Green & Protein** (Albania) and designed as a generalizable product for broader F&B operator use.

The platform covers:
- **Command Centre** — role-based dashboards for HR, Finance, Supply Chain, Restaurant Manager, CFO, COO
- **Partners Portal** — employee-facing shift check-in, tasks, inbox, and profile
- **POS** — full point-of-sale terminal with session management, cash reconciliation, and commercial intelligence layer
- **KDS** — kitchen display system
- **FaceShift** — computer vision attendance (parallel observer mode)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite (single-file architecture) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Hosting | Vercel (current) → GCP Cloud Run (planned) |
| Language | JavaScript (JSX) — no TypeScript |
| Styling | CSS-in-JS via inline styles + CSS classes |
| Icons | Lucide React (via Icon component — never window.LucideReact) |
| Font | DM Sans |

---

## Prerequisites

Before running locally, make sure you have:

- **Node.js** v20 or higher — https://nodejs.org
- **npm** v9 or higher (comes with Node)
- A code editor — **VS Code** recommended — https://code.visualstudio.com

---

## Environment Variables

Create a `.env` file in the project root with the following:

```env
VITE_SUPABASE_URL=https://knquzjqxhduyxxljuede.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Never commit `.env` to Git.** It is already listed in `.gitignore`.
> Get the anon key from the Supabase dashboard → Project Settings → API.

---

## Running Locally

```bash
# 1. Clone the repository
git clone https://github.com/gjergji-GP/wt360-cc.git
cd wt360-cc

# 2. Install dependencies
npm install

# 3. Add your .env file (see Environment Variables above)

# 4. Start the development server
npm run dev
```

The app will open at **http://localhost:5173**

The POS terminal is at **http://localhost:5173/pos**

---

## Building for Production

```bash
npm run build
```

Output goes to the `dist/` folder. This is what gets deployed.

---

## Deploying

### Current method (manual via Vercel)

```bash
# From project root
./deploy-pos.sh
```

This script base64-encodes the built app and pushes to Vercel.

### Target method (automatic via GCP + GitHub)

Once CI/CD is configured, deployment is automatic:

```bash
git add .
git commit -m "Your change description"
git push origin main
# → Cloud Build triggers → Docker build → Cloud Run deploy
```

---

## Project Structure

```
wt360-cc/
├── src/
│   └── App.jsx          # Single working file — entire platform lives here
├── public/
├── index.html
├── vite.config.js
├── package.json
├── deploy-pos.sh         # Manual Vercel deploy script
├── Dockerfile            # For GCP Cloud Run deployment
├── nginx.conf            # Nginx config for container serving
└── .env                  # Local only — never commit
```

> **Note:** The entire platform is currently a single-file architecture (`App.jsx`). This will be modularised into components as the team grows.

---

## Architecture Overview

### Frontend routing

Routes are determined by the authenticated user's `role_code` after login:

| Role | Destination |
|---|---|
| `CFO` | CFO Command Centre |
| `FINANCE_MANAGER` | Finance Command Centre |
| `HR_MANAGER` / `COO` / `SYSTEM_ADMIN` | Leadership Command Centre |
| `RESTAURANT_MANAGER` | Restaurant Manager CC |
| `SUPPLY_CHAIN_MANAGER` | Supply Chain CC |
| `MARKETING_MANAGER` | Marketing CC |
| `TECHNICAL_DIRECTOR` | Technical Director CC |
| `FOH_OPERATOR` / `BOH_ASSISTANT` etc. | Partners Portal |
| `POS_STAFF` | POS Terminal |

### Supabase project

- **Project ID:** `knquzjqxhduyxxljuede`
- **Region:** eu-central-1
- **Auth:** Email/password via Supabase Auth
- **Storage buckets:** `employee-documents`, `employee-photos`, `waste-photos`, `brand-logos`
- **Edge Functions:** 12 active functions (fiscal, auth, ebills, FaceShift)

---

## Key Development Rules

These are non-negotiable invariants that every developer must follow:

1. **No TypeScript syntax in JSX files** — no `as any`, no `!` non-null assertions, no type annotations
2. **No `window.LucideReact`** — always use the `Icon` component with a string name prop
3. **No inline `createClient()`** — use the global `SB` instance only
4. **All derived variables that reference `activeLines` must be declared AFTER `activeLines`** in the component body — violating this causes blank screen crashes
5. **Sub-components must be defined at module level** — never as inline arrow functions inside a parent component (causes 1-char-per-keystroke focus loss)
6. **`CFO` is NOT in `LEADERSHIP_ROLES`** — it has its own dedicated route
7. **`system_config` upserts must use** `ON CONFLICT ON CONSTRAINT uq_system_config_brand_key`
8. **No emojis in UI** — use Lucide icons only (except POS category indicators)
9. **Design system is law** — see Design System section below

---

## Design System (WT360 Universal Design System v1)

| Token | Value |
|---|---|
| Font | DM Sans |
| Sidebar background | `#0D0E1A` |
| Active sidebar item | `#171A27` |
| App background | `#F4F5F7` |
| Panel background | `#FFFFFF` |
| Primary CTA | `#009DE0` (`--wt-blue-600`) — **never green** |
| Border radius sm | 12px |
| Border radius md | 14px |
| Border radius lg | 16px |
| Border radius xl | 20px |
| Border radius pill | 999px |
| Panel shadow | `0 8px 30px rgba(16,24,40,.06)` |
| Modal shadow | `0 20px 50px rgba(16,24,40,.16)` |

Spacing scale: **4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48** only.

---

## Brand Identifiers (Green & Protein)

```
Brand ID:    a2911ac0-bcac-42c4-b39b-fed6813d321e
Location 1:  Blloku Restaurant
Location 2:  Central Kitchen
```

---

## Test Credentials (Development Only)

| Role | Email | Password |
|---|---|---|
| CFO | gjergji@greenandprotein.al | (ask admin) |
| HR Manager | hr@greenandprotein.al | Wt360hr! |
| Restaurant Manager | dhuratatoska485@gmail.com | Wt360rm! |

> Rotate credentials before any public demo.

---

## Contributing

1. Clone the repo and create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the development rules above
3. Test locally at `http://localhost:5173`
4. Push your branch and open a Pull Request against `main`
5. At least one review required before merge
6. Merging to `main` triggers automatic deployment (once CI/CD is configured)

---

## Contact

**George** — CFO & Product Owner — gjergji@greenandprotein.al

Platform built and maintained by the WT360 engineering team.
