# Privacy Architecture & Donor Anonymity Controls

CharityChain applies **privacy by design** aligned with the **Kenya Data Protection Act, 2019** ([PRD §15 & §7.9](../requirements/product-requirements-document.md#15-privacy-and-compliance)).

---

## 1. Pseudonymous Donor References (`D3`, `D9`, `FR-DON-01`)

* Every donation generates a deterministic server-keyed reference (`donorReference.js`):
  $$\text{donorRef} = \text{HMAC-SHA256}(\text{serverSecret}, \text{"malkia:v1:donor:"} + \text{normalizedIdentity})$$
* Even if an M-Pesa phone number is included in a webhook payload, neither the raw number nor donor name ever reaches Polygon contracts, public `/trace` payloads, or public recognition endpoints.
* In internal admin/committee views, donor references are masked; unmasking requires `donor-identity:reveal`, a stated operational reason, and an append-only audit event (`FR-DON-15`).

---

## 2. Public Display Opt-In & Preview Screening (`FR-DON-02`..`06`)

1. **Anonymous by Default:** Every contributor starts in `displayMode = "ANONYMOUS"`. No alias or real name appears on `/wall` (`GET /api/v1/public/recognition`) unless the donor opts in.
2. **Receipt-Code Claiming (`/claim`):** Donors enter their `MLK-XXXX-XXXX` receipt code on `/claim` (`POST /api/v1/public/donor/claim`) to obtain a short-lived claim token—linking multiple receipts privately without forcing crypto wallets or full account signup.
3. **Preview & Automated Name Screening (`nameScreening.js`):** Before setting `ALIAS` or `NAMED`, `PATCH /api/v1/public/donor/preferences` runs:
   * English & Swahili offensive word blocklist
   * Reserved governance word checks (`Malkia`, `committee`, `admin`, `Safaricom`, `treasurer`)
   * Unicode/leetspeak lookalike collision detection against existing public wall names
   The donor reviews the exact rendered preview and submits an explicit preview confirmation (`DonorPreferenceEvent` with consent version).
4. **Immediate Withdrawal & Takedown (`FR-DON-06`, `FR-DON-16`):** Donors can revert to `ANONYMOUS` instantly; committee moderators can execute a logged takedown, and visitors can report suspicious names (`POST /api/v1/public/recognition/:id/report`).

---

## 3. Inference Protection & Beneficiary Redaction

* **Recognition Wall k-Anonymity (`FR-DON-12`):** `GET /api/v1/public/recognition` returns **only** `displayName`, badge `tier`, and award `month` (never KES amounts, exact timestamps, or live donation feeds), and suppresses `anonymousDonorsCount` (`null`) whenever fewer than 5 anonymous donors exist.
* **Beneficiary Confidentiality (`FR-CASE-09`):** Student names, registration numbers (`MUST/SIM/2026/*`), fee balances, and vetting explanations stay strictly gated to the authenticated student (`STUDENT`) and authorized committee/record staff—never exposed on `/trace`, `/wall`, `/transparency`, or auditor case exports.
