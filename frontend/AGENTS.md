# Frontend AI & Engineering Guidelines (AGENTS.md)

This document defines the architectural standards, domain invariants, and code conventions for any AI agent or engineer working on `frontend/` of **CharityChain**.

---

## 1. Project Overview & Role

* **Client:** **Malkia**, a registered university charity group (students and staff).
* **Core Principle:** Money stays off-chain on existing payment rails (**M-Pesa**, **Bank wire**, and physical items dropped at the university hospital pharmacy).
* **Role of Blockchain:** **Polygon Amoy** is an immutable, notarized audit ledger. Contracts never hold or custody money.
* **Donor Experience:** Donors never touch crypto wallets. They trace their contributions using human-readable receipt codes (e.g. `MLK-7F3K-92QD`). Internal signatories use Web3 wallets for 2-of-3 EIP-712 fund release authorizations.

---

## 2. Technology Stack & Tooling

| Concern | Tool / Library | Version | Notes |
|---|---|---|---|
| **Framework** | React + Vite | React 19, Vite 8 | Fast ESM bundler |
| **Language** | TypeScript (Strict) | TypeScript 7+ | Zero `any` types; strict null checks |
| **Styling** | Tailwind CSS v4 | `@tailwindcss/vite` | Modern CSS-first config with dark mode |
| **State & Fetching** | TanStack Query | v5 | Server state caching and queries |
| **Routing** | React Router | v7 | Declarative route structure |
| **Iconography** | Lucide React | `lucide-react` | Semantic SVG icons |
| **Web3** | Web3.js | v4 | Direct browser-to-RPC read-only verification & EIP-712 signing |

---

## 3. Directory Layout & Module Boundaries

All code inside `frontend/src/` must adhere to this layered structure:

```
src/
├── app/                  # Application-wide orchestration
│   ├── auth/             # AuthContext, session state, persona switcher
│   ├── layouts/          # PublicLayout (donors/public) vs AppLayout (internal governance)
│   ├── Providers.tsx     # TanStack QueryClientProvider, AuthProvider
│   └── Router.tsx        # Central route registry
├── components/           # Design system & reusable primitives
│   ├── ui/               # Button, Card, Input, Badge, EmptyState
│   ├── Money.tsx         # KES minor unit money formatter component
│   └── StatusChip.tsx    # Semantic color-coded status chips
├── features/             # Domain feature modules (colocated UI and logic)
│   ├── trace/            # Public receipt code lookup & Web3 verification
│   ├── dashboard/        # Public transparency metrics (inflows, outflows, pool balance)
│   ├── cases/            # Sub-group submission wizard & committee approvals queue
│   ├── signing/          # 2-of-3 EIP-712 signatory fund release queue
│   ├── donations/        # Bank wire intake with maker-checker verification
│   ├── inventory/        # Hospital pharmacy quick item logger (<30s on mobile)
│   ├── alerts/           # Forensic rule alerts (R01–R20) & resolution audit notes
│   └── reports/          # Quarterly reports library & on-chain hash verification
├── lib/                  # Infrastructure and shared utilities
│   ├── api.ts            # Typed API client and mock data layer
│   └── utils.ts          # cn() class merge helper (clsx + tailwind-merge)
└── types/                # Domain types & interfaces (index.ts)
```

### Module Boundary Rules:
1. **Feature Colocation:** Feature-specific components, helpers, and hooks belong inside `src/features/<feature>/`. Do not place one-off components in `src/components/ui/`.
2. **Thin UI Components:** Business rules must never be embedded directly inside JSX. Data fetching and mutation logic belongs in `lib/api.ts` or custom query hooks.
3. **No Cross-Feature Coupling:** Features should not directly import internal sub-components of other features. Shared state or models belong in `types/` or `app/`.

---

## 4. Critical Domain Invariants (NEVER VIOLATE)

1. **Money is Minor Units (Integer KES):**
   * Currency is **KES** (Kenyan Shillings) represented in **integer minor units** (KES 1.00 = 100 minor units).
   * **Never use floating point numbers** for financial calculations.
   * **Never show cryptocurrency (ETH, MATIC, etc.) as donation amounts.**
   * Always render monetary values using `<Money amountMinor={...} />` or `formatKES(...)`.
   * For in-kind items, the currency is `ITM` and the amount is the integer quantity.

2. **Segregation of Duties (Enforced in Code):**
   * **Rule R03:** Submitter of a case cannot approve their own case.
   * **Rule R04 (Maker-Checker):** The user entering a bank deposit cannot verify it.
   * **2-of-3 Signatory Rule:** Disbursements cannot be released without at least two distinct valid signatures from authorized Malkia Executive Committee signatories.

3. **Privacy First (Zero On-Chain PII):**
   * Donors default to `ANONYMOUS`.
   * Never display private phone numbers, national ID numbers, or beneficiary real names in public views.
   * Use pseudonymous case identifiers (e.g. `CASE-2026-0142`) and category tags (`FEES`, `UPKEEP`, `MEDICAL`, `BOOKS`).

4. **Plain Language on Public Pages:**
   * Public donor pages must avoid technical jargon where possible.
   * Use plain terms like *"Verified and locked"* with an optional collapsible *"Technical cryptographic details"* drawer for tx hashes, block numbers, and explorer links.

---

## 5. Modern Web & Accessibility Guidelines

* **Dark Mode:**
  * `<meta name="color-scheme" content="light dark" />` in `index.html`.
  * `:root { color-scheme: light dark; }` in `index.css`.
  * Use semantic Tailwind zinc/slate color scales (`bg-white dark:bg-zinc-900`, `text-zinc-900 dark:text-zinc-100`).
* **Touch Targets & Focus:**
  * All interactive elements (buttons, inputs, select triggers) must satisfy the WCAG minimum **44×44px** touch target (`min-h-[44px]` on mobile).
  * Always provide visible focus rings: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2`.
* **Semantic HTML:**
  * Use proper landmarks (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`).
  * Never use clickable `<div>` elements without accessible button roles, keyboard handlers, and aria attributes.

---

## 6. Developer Commands

All commands are run from the `frontend/` directory:

```bash
# Start local Vite development server
npm run dev

# Run TypeScript type check
npm run typecheck

# Build for production (runs tsc -b && vite build)
npm run build

# Run ESLint
npm run lint

# Preview production build locally
npm run preview
```

---

## 7. Instructions for AI Coding Agents

When tasked with adding or modifying frontend code:
1. **Inspect existing patterns:** Review existing feature implementations in `src/features/` before introducing new conventions.
2. **Maintain Type Safety:** Define all new data structures in `src/types/index.ts`. Do not use `any`.
3. **Verify Build:** Always run `npm run build` after making modifications to verify zero TypeScript errors and successful bundling.
4. **Preserve Comments:** Keep architectural explanations and documentation comments intact.

