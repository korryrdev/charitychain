# Track D: Frontend

**Folder you own:** `frontend/`
**You provide:** The public portal (trace, dashboard, reports), the committee and treasurer screens, the signatory signing flow, the forensic inbox and graph, the pharmacy quick log
**You consume:** `shared/openapi.json`, ABIs and deployments from Track A (through `shared/`), hashing, roles and money helpers from `shared/`

Read first: `ARCHITECTURE.md` sections 1, 3.3, 4, 5.2, 5.5, 8 and PRD sections 4, 7.4, 13.

---

## 1. Mission

Make trust visible. A donor with a receipt code and a phone should see, in plain words and in under three taps, what happened to their money, and be able to check it themselves. A committee member should be able to do their part in a few clicks without learning blockchain.

---

## 2. Stack

- React 18, TypeScript (strict), Vite
- React Router, TanStack Query
- Tailwind CSS, headless components (Radix UI or similar)
- `openapi-typescript` and `openapi-fetch` for the typed client, MSW for mocks
- Web3.js v4 (read only verification on public pages, wallet signing for signatories)
- Recharts (dashboards), D3 sankey, Cytoscape.js (fund flow graph)
- `react-i18next` for English and Swahili
- Vitest and Testing Library, Playwright, `@axe-core/playwright`

---

## 3. Folder layout

```
frontend/
  src/
    app/                 router, providers, layouts, route guards, error boundary
    features/
      auth/              login, 2FA, session
      trace/             trace my donation, timeline, sankey, verify button
      dashboard/         public transparency dashboard
      reports/           library, verify tool, quarterly builder
      cases/             rep wizard, committee queue and detail, decision
      disbursements/     disbursement form, evidence upload
      signing/           signatory queue, wallet connect, EIP-712 signing
      donations/         bank deposits, verification, CSV import, reconciliation
      inventory/         stock, pharmacy quick log
      alerts/            inbox, detail, resolve
      graph/             fund flow explorer
      admin/             users and roles
      donor/             claim page, preferences, private giving view (Phase 2)
      recognition/       public wall, name takedown list, tier settings (Phase 2)
    components/          Button, Table, Badge, Timeline, Money, StatusChip, EmptyState
    lib/
      api.ts             client from openapi.json
      web3/              provider, verify.ts, sign.ts (uses shared/abis and deployments)
      i18n.ts
      format.ts          wraps shared/money
      permissions.ts     wraps shared/roles
    locales/             en.json, sw.json
    mocks/               MSW handlers and scenarios
  e2e/                   Playwright specs
```

---

## 4. Build order

### D1. Scaffold and design system (feeds IC0)
Vite app, Tailwind tokens (colors, spacing, type scale), layout shell, mobile first navigation, error boundary, i18n setup with both locales, Money and StatusChip components.
**Done when:** the shell runs on a 360 px wide viewport and a screen reader announces landmarks.

### D2. API client and mocks
Generate the client from `shared/openapi.json`. Generate MSW handlers and add named scenarios (`empty`, `loading`, `error`, `alerts-open`, `full-year`). Auth store holds the access token in memory only. Refresh through the httpOnly cookie. Route guards use `shared/roles`.
**Done when:** every page can be developed with the backend off.

### D3. Trace my donation (the donor experience)
- Input for receipt code, helpful errors, rate limit message.
- Result: status chip, timeline (received, pooled, allocated), amounts in KES, case categories only, date stamps in East Africa Time.
- Sankey from the donation to the cases it funded.
- Verify button: reads `recordHashOf(id)` from the chain with Web3.js and a public RPC, recomputes with `shared/hashing/hashDonation` using the fields from the API, shows green or red with plain language, and a collapsible "technical details" with tx hash and explorer link.
- No blockchain jargon in the main view.
**Done when:** the IC1 scenario works against the local chain and a tampered response (test) shows the red state.

### D4. Public dashboard and reports
Totals in and out, balance, pool age, breakdowns by category and sub-group, number of people helped, latest anchored report. Reports library with a verify tool that accepts the hash or the report JSON and compares with the chain.
**Done when:** lighthouse performance is above 85 on a throttled mobile profile.

### D5. Auth and shell for internal users
Login, TOTP step, session expiry handling, role based navigation, profile, logout everywhere.
**Done when:** a user without a permission never sees the menu item and gets a clear screen if they open the URL.

### D6. Cases and decisions
- Sub-group rep: new case wizard (need category, amount or items, justification, consent confirmation), my cases list.
- Committee: queue with filters, case detail with timeline and evidence, approve, reject, ask for more info, enter approved amount.
- Beneficiary identity appears only for roles allowed by `shared/roles`.
**Done when:** self approval is blocked in the UI with a clear message and the API error is handled gracefully.

### D7. Signing (signatory)
- Release queue showing cases awaiting signatures, who approved, the amount, and a plain statement of what the signature means.
- Wallet connect with the injected provider, check chain id, switch network prompt.
- Build the typed data from `GET /cases/:id/authorization-request` and call `eth_signTypedData_v4`. Show exactly the fields being signed.
- Show "1 of 2 signatures" and notify the second signatory in the queue.
**Done when:** two test wallets complete a release and B enqueues the on-chain authorization.

### D8. Treasurer, inventory and pharmacy quick log
- Bank deposits: entry form, verification queue, CSV import with match review, reconciliation view.
- Inventory: stock table, issue to case.
- Pharmacy quick log: one screen, camera input, category and quantity, large touch targets, works on weak connections with a retry queue.
**Done when:** a custodian can log an item in under 30 seconds on a mid range phone.

### D9. Disbursement and evidence
Disbursement form with method, reference and evidence upload (progress, size limit, preview for allowed roles). The browser sends the file to the API, which encrypts and pins it.
**Done when:** a disbursement above the authorized amount is blocked before submit and after (server error).

### D10. Forensic inbox and graph
Alert inbox with severity, risk score, filters and bulk status. Alert detail with the one sentence reason and links to evidence. Resolve flow requiring a note. Graph explorer (Cytoscape) with alert overlays and node details. Integrity banner when an `IntegrityAlert` is open.
**Done when:** the simulator year loads and the inbox stays responsive with several hundred alerts.

### D11. Quarterly report builder
Pick quarter, preview numbers and open alerts, generate, show hash and verify link, download PDF and JSON.
**Done when:** the preview totals match the generated report.

### D12. Quality pass
Accessibility audit with axe and manual keyboard testing, Swahili review with a native speaker, empty and error states for every list, performance budget (initial JS under 250 KB gzipped for public pages), Playwright e2e for donor trace, case flow with signing, alert resolve.
**Done when:** CI runs the e2e smoke and axe reports no serious violations on key pages.

### D13. Donor privacy and recognition (Phase 2)
- **Claim and preferences page (public):** enter a receipt code, get a claim token, then choose Anonymous (default), Alias or Named. Show the consent text (versioned, from the API), an alias or name field, a preview of exactly how the name will appear on the wall with a confirm button (nothing goes public until the donor confirms), any screening failure message from the API, and a clear withdraw option. State it honestly: details are hidden from the public, and Safaricom, the bank and Malkia's treasurers still hold their own records.
- **Private giving view:** after claiming, the donor sees their badge, yearly total, progress to the next tier, Consistent giver streak, and linked receipts, whatever their display mode. The trace page shows "You are a Silver donor" only when a claim token is present. Optional certificate download.
- **Recognition wall (public):** approved, opted-in donors with display name, tier and month. No amounts, no exact dates, no live feed. Show the anonymous count only if the API returns it. Language is thankful, not competitive, so no "top 10" wording or ranking by amount. Each entry has a small "report this name" link.
- **Committee screens:** badge tier settings (a change needs a second committee approval and shows pending state), public names list with a takedown action that needs a reason, masked donor lookup where a reveal button asks for a reason and warns that it is logged.
- **Accessibility:** badges carry a text label and an icon, never color alone. All copy in English and Swahili, reviewed with Malkia.
**Done when:** a donor can set a display mode and find their badge unaided, withdrawing consent removes them from the wall on refresh, and Playwright covers claim with preview and confirm, committee takedown, and wall display.

---

## 5. Rules

- No business rules in components. If the UI needs to decide something about money or permissions, the backend or `shared/` decides.
- All server state through TanStack Query. No ad hoc fetch.
- Never put tokens or personal data in localStorage or the URL.
- Never display beneficiary identity unless `shared/roles` allows it.
- Use `Money` for every amount. Never format numbers by hand.
- All user facing text goes through i18n. No hard coded strings.
- Public pages avoid the words "blockchain", "hash", "gas" in the main flow. Put them in the technical details drawer.
- The wallet prompt text must match what is on screen. Never sign data the user cannot see.
- Contract addresses and ABIs come only from `shared/deployments` and `shared/abis`.

---

## 6. Testing

| Level | What |
|---|---|
| Unit | Mappers, formatting, permission helpers, verify logic with golden vectors |
| Component | Forms, tables, status chips, role gating |
| e2e (Playwright) | Donor trace with verify, rep to payout across roles with two test signatories, alert resolve |
| Accessibility | axe on key routes, keyboard only walkthrough |
| Visual | Screenshots of key states in CI (optional) |
| Usability | Task scripts for donors and committee, SUS questionnaire (with Track E) |

---

## 7. Hand offs

| From or to | What | When |
|---|---|---|
| From B | OpenAPI skeleton, mock scenarios | IC0 |
| From A | ABIs and local deployment | Week 2 |
| To E | Test accounts and flows for e2e | IC1 |
| From C | Alert, graph and sankey response shapes | Before IC3 |
| To E | Build for usability sessions | Before IC4 |

---

## 8. Definition of done for the track

All screens in PRD 13.2 built and gated by role, the donor trace verifies against the chain from the browser, signing works with two wallets, English and Swahili complete, axe and Lighthouse targets met, Playwright smoke green.
