# Claude Code Guidelines: CharityChain Frontend

This file contains quick instructions and guidelines for Claude Code and related AI assistants working on `frontend/`. For comprehensive standards, refer to [AGENTS.md](./AGENTS.md).

---

## Quick Reference Commands

All commands should be executed inside the `frontend/` directory:

```bash
# Development server
npm run dev

# Full typecheck and build (Run before finishing any turn)
npm run build

# Standalone typecheck
npm run typecheck

# Linter
npm run lint
```

---

## Architectural Rules

1. **Stack:** React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, TanStack Query v5, React Router v7, Lucide Icons.
2. **Directory Structure:**
   - `src/app/`: Router, layout shells, AuthContext, Providers.
   - `src/components/`: Reusable design system UI primitives (`Button`, `Card`, `Input`, `Badge`, `Money`, `StatusChip`).
   - `src/features/<feature>/`: Co-located feature pages, components, and logic.
   - `src/lib/`: API client (`api.ts`), utilities (`utils.ts`).
   - `src/types/`: TypeScript definitions (`index.ts`).

---

## Critical Invariants

* **Currency:** Always integer minor units in **KES** (Kenyan Shillings) where KES 1.00 = 100 minor units. **Never use ETH or floats.**
* **Roles & Governance:** 2-of-3 signatory authorization for payouts, maker-checker on bank deposits, submitter cannot approve own case.
* **Privacy:** Donors default to `ANONYMOUS`. No PII on public pages.
* **Accessibility:** Minimum 44×44px touch targets on mobile, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-emerald-600`), semantic landmarks.
* **Verification:** Always execute `npm run build` after editing to ensure zero TypeScript or bundling regressions.

