# Authentication, Session Lifecycle & Signatory Wallets

CharityChain separates low-friction donor access (`MLK-XXXX-XXXX` receipt code + optional `/claim` token) from authenticated user sessions (`Better-Auth` + CSRF + TOTP MFA) and hardware-wallet cryptographic approvals (MetaMask `Web3.js` EIP-712).

---

## 1. Registration & Login Flows

| Actor | Auth Endpoint | Rules & Constraints |
| --- | --- | --- |
| **Donor** | `POST /api/v1/public/auth/register` (`/auth/register`) | Assigns `DONOR` role automatically. Not required to trace receipts (`GET /api/v1/public/trace/:receipt`). |
| **Student** | `POST /api/v1/public/auth/register-student` (`/student/auth/register`) | Validates campus email (`name123456@students.must.ac.ke`) and registration format (`CT206/204483/24` / `CT201/000001/23`), assigns `STUDENT`, links or initializes the student record. |
| **Internal Staff** | Admin provisions via `POST /api/v1/users/staff` or `POST /api/v1/users` | Staff roles (`CLERK`, `PHARMACY_CUSTODIAN`, `INVENTORY_SUPERVISOR`, `SUBGROUP_REP`, `COMMITTEE_MEMBER`, `TREASURER`, `SIGNATORY`, `FINANCE_OPERATOR`, `AUDITOR`, `ADMINISTRATOR`) cannot be self-selected during public registration. |
| **Standard Login** | `POST /api/v1/public/auth/login` (`/auth/login` & `/login`) | Issues HTTP-only `charitychain_session` cookie + `charitychain_csrf` cookie (no raw token leaked in JSON), plus `role`, `roles`, `permissions`, `requiresMfa`, `mfaVerified`. |

---

## 2. Dual Session Resolution & CSRF Bridge

Implemented across [authenticate.js](../../backend/src/middleware/authenticate.js) and [csrfProtection.js](../../backend/src/middleware/csrfProtection.js):

1. **Session Resolution:** Supports both HTTP-only `charitychain_session` cookies (from standard web login) and `Authorization: Bearer <token>` headers via `authService.resolveSession`, hydrating normalized `req.auth.user`, `role`, `roles`, `permissions`, and `mfaVerified`.
2. **CSRF Protection:**
   * All state-changing authenticated browser requests (`POST`, `PATCH`, `PUT`, `DELETE`) verify the CSRF cookie against request headers.
   * Safe authenticated `GET` requests automatically reissue a missing CSRF token cookie so `.jsx` portals and `.tsx` DApp pages (`api.ts`) share sessions seamlessly.
   * Explicit exemptions apply strictly to `/api/v1/public/auth/*`, `/api/v1/daraja/*`, `/api/v1/webhooks/*`, and Bearer-token API callers without session cookies.

---

## 3. Mandatory TOTP 2FA (`FR-AUTH-01`)

Per [roles.js](../../backend/src/constants/roles.js), `ROLES_REQUIRING_2FA` mandates TOTP enrollment and verification for:
* `COMMITTEE_MEMBER`
* `TREASURER`
* `SIGNATORY`

Users enroll via `POST /api/v1/public/auth/mfa/enable` (`MFA_ISSUER=CharityChain`) and complete challenges via `POST /api/v1/public/auth/mfa/verify`. Protected governance/financial operations enforce `requireMfa.js`.

---

## 4. Signatory EIP-712 Wallet Signing (`FR-AUTH-02`, `D5`)

Signatories do **not** upload private keys to the server:
* In `/committee/signing` (`SigningQueuePage.tsx`), a signatory connects their browser wallet (`window.ethereum`) via `Web3.js`.
* The browser constructs an EIP-712 v4 payload matching [CaseWorkflow.sol](../../blockchain/contracts/CaseWorkflow.sol) (`name: "CharityChain CaseWorkflow"`, `version: "1"`, `chainId`, `verifyingContract`, struct `ReleaseAuthorization(bytes32 caseId,uint64 amountMinor,uint64 nonce,uint64 deadline)`).
* MetaMask signs the digest (`eth_signTypedData_v4`), submitting `{ signerAddress, signature, deadline }` to `POST /api/v1/cases/:id/authorize`. In local/headless environments without MetaMask, signatories can toggle **Demo Signatory Mode** to test deterministic multi-sig validation end to end.
