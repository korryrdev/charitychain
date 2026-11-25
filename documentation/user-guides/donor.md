# Donor User Guide (`/`, `/trace`, `/claim`, `/donor`, `/donor/dapp`)

Donors can contribute via M-Pesa, bank transfer, testnet stablecoin, or physical drop-off—and independently trace every shilling on the blockchain **without creating an account or crypto wallet** ([PRD D2, §7.4, §7.9](../requirements/product-requirements-document.md)).

---

## 1. Walletless Tracing (`/trace` & `/track`)

1. Give via M-Pesa Paybill, Bank Transfer, or campus drop-off and keep your human-friendly receipt code (`MLK-XXXX-XXXX`, or your M-Pesa receipt code).
2. Open `http://localhost:5173/trace` (no login required) and enter the receipt code.
3. Inspect:
   * Current donation status (`Received`, `Pooled`, `Partially Allocated`, `Fully Allocated`)
   * Interactive **Sankey allocation flow** showing which anonymized campus need categories (`TUITION`, `UPKEEP`, `BOOKS`, etc.) received FIFO slices of your contribution
   * Polygon Amoy / Localhost transaction hash and block metadata
4. Click **Verify Direct on Chain** to run a browser-side `Web3.js` check that reads `DonationLedger.recordHashOf(donationId)` directly from RPC and confirms zero tampering independently of CharityChain's backend.
5. Download your thank-you cryptographic SVG certificate (`GET /api/v1/public/certificate/:receipt?format=svg`).

---

## 2. Claiming Receipts & Managing Recognition Privacy (`/claim`, `/wall`)

1. All donors are **`ANONYMOUS` by default** on public pages (`D9`, `FR-DON-02`).
2. To manage public recognition or link multiple donations privately, visit `/claim` (`/donor/claim`) and submit your `MLK-XXXX-XXXX` receipt code to receive a claim token.
3. Choose how you appear on `/wall`:
   * **`ANONYMOUS`:** Hidden from public named lists (only counted in the anonymous aggregate once `>= 5` anonymous donors exist).
   * **`ALIAS` or `NAMED`:** Enter a display name, pass automated screening (offensive/reserved/lookalike filter), inspect the exact live preview, and confirm consent.
4. Track your deterministic impact badges (**Bronze** KES 2,000, **Silver** KES 10,000, **Gold** KES 30,000, **Patron**, and **Consistent Giver** after the 7-day cooling period). You can withdraw consent at any moment on `/claim` to vanish from `/wall` immediately.

---

## 3. Registered Donor Portal (`/donor`, `/donor/dapp`)

Optional donors who register at `/auth/register` unlock `/donor`:
* **Donate Money (`/donor/donate`)**: Initiate M-Pesa STK/Paybill or Bank contributions.
* **Declare Physical Goods (`/donor/goods`)**: Declare drop-offs (actual stock enters only after clerk logging + your independent Yes/No confirmation at `/confirm-physical-donation`).
* **Unified DApp Portal (`/donor/dapp`)**: View combined receipt claims, stablecoin channel links, and badge history.
