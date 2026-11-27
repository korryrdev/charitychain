# Committee & Executive Signatory User Guide (`/committee`, `/committee/signing`)

Committee members, Sub-group representatives (`SUBGROUP_REP`), and Executive Signatories (`SIGNATORY`) review applications, decide assistance allocations with segregation of duties, and co-sign **2-of-3 EIP-712 release authorizations** using `Web3.js` and MetaMask ([PRD §7.2, §9.2, D5](../requirements/product-requirements-document.md)).

---

## 1. Prerequisites & Mandatory MFA

* Sign in at `/auth/login` (staff credentials provisioned by Super Admin) or `/login` (seeded Malkia governance accounts in dev/demo).
* **TOTP 2FA Mandatory (`FR-AUTH-01`):** `COMMITTEE_MEMBER`, `TREASURER`, and `SIGNATORY` roles require verified TOTP MFA.

---

## 2. Sub-Group Case Creation & Committee Review (`/committee`)

1. **Sub-Group Case Creation (`/committee/cases/new`):** Sub-group reps select their sub-group (`GET /api/v1/cases/subgroups`), enter need category (`FEE`, `UPK`, `BOK`, `MED`), requested amount in KES, justification, and submit (`POST /api/v1/cases` -> `/submit`). Student identity stays encrypted off-chain.
2. **Application & Case Review (`/committee/review`, `/committee/cases`):** Committee members examine automated Need-Index vetting factors, duplicate checks, conflict declarations, and available pool balances.
3. **Approve / Reject / Request Info (`FR-CASE-03`, `FR-CASE-04`):** Approve an exact amount (`POST /api/v1/cases/:id/decision`). **Segregation enforced in code & `R03`:** the user who created/submitted a case cannot approve it.

---

## 3. Executing 2-of-3 EIP-712 Signatory Release (`/committee/signing`)

Once a case is `APPROVED`:
1. Open `/committee/signing` (`SigningQueuePage.tsx`) or `/app/signing`.
2. Verify the displayed summary: Case ID (`bytes32`), sub-group, need category, exact approved KES minor units, nonces, and deadline.
3. **MetaMask Mode (`METAMASK`):** Connect browser wallet (`window.ethereum`), verify network (`Polygon Amoy 80002` or `Localhost 31337`), and approve the `Web3.js` `eth_signTypedData_v4` prompt for domain `"CharityChain CaseWorkflow"` version `"1"`.
   * *(In local dev/testing without MetaMask installed, use **Demo Signatory Mode** to test deterministic 1st/2nd signatory transitions across any two of the 3 registered signatories.)*
4. **First Signatory Signs:** Status advances cleanly (`1 of 2 signatures collected`); the second signatory now appears in the pending queue.
5. **Second Distinct Signatory Signs:** Backend verifies two distinct `SIGNATORY` signatures (`POST /api/v1/cases/:id/authorize`, incremental or batch), transitions state to `AUTHORIZED`, and queues `CaseWorkflow.authorizeRelease` on-chain (`R10` monitors pair concentration).

---

## 4. Quarterly Close & Public Name Moderation

* Generate deterministic quarterly PDF & JSON transparency reports at `/auditor/quarterly-reports` or `/app/reports` (`POST /api/v1/reports/quarterly`, anchored to `PeriodAnchor.sol`).
* If visitors report an abusive/impersonating public wall name (`FR-DON-16`), committee moderators review and trigger logged takedowns (reverting the entry to `ANONYMOUS`).
