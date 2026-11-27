# Data Retention, Privacy Erasure & Compliance Policy

Designed to comply with the **Kenya Data Protection Act, 2019** ([PRD §15](../requirements/product-requirements-document.md#15-privacy-and-compliance)).

---

## 1. Storage Separation & Sensitivity Tiers

| Data Category | Storage Home | Personal Data? | Erasure / Correction Rule |
| --- | --- | --- | --- |
| **Smart contract commitments** (`DonationLedger`, `CaseWorkflow`, `PeriodAnchor`, `EvidenceRegistry`) | Polygon Amoy / Local Chain | **No** (`idOf` + keyed HMAC `donorRef` only) | Permanent public notary; no PII ever stored on-chain (`D3`). |
| **Student identity & financial histories** (`Student`, `MalkiaCase.beneficiaryPiiEnc`) | PostgreSQL (encrypted off-chain fields) | **Yes (High Sensitivity)** | Accessible only to linked student or privileged committee/record staff; redacted from public & auditor summaries (`FR-CASE-09`). |
| **Disbursement & receipt documents** (`EvidenceRecord`, `evidenceCid`) | IPFS Kubo (AES-256-GCM ciphertext) | Usually Yes | Encrypted before pinning unless explicitly flagged public; cryptographic erasure by key rotation/withdrawal. |
| **Raw Daraja payment callbacks** (`DonationRawCallback`) | PostgreSQL (append-only trigger) | Masked/hashed ref + gateway metadata | Retained for financial & forensic audit trails; raw phone numbers hashed into `donorRef`. |
| **Donor public display preferences** (`DonorProfile`, `DonorPreferenceEvent`) | PostgreSQL | Optional alias / consented name | **Withdrawing consent (`FR-DON-06`) removes the donor from `/wall` and `/api/v1/public/recognition` immediately**, while appending a non-destructive consent withdrawal event. |
| **Financial lots, allocations & audit events** | PostgreSQL (append-only) | Pseudonymous `donorRef` only | Never deleted or overwritten; corrections append compensating events (`FR-AUD-04`). |

---

## 2. Consent & Honest Privacy Disclosures

* Public interfaces state clearly that donor details are hidden from the public recognition board and trace views—not that donations are untraceable by Safaricom, banks, or authorized treasurers holding settlement records.
* Masked donor references displayed to internal operators require explicit permission (`donor-identity:reveal`), a stated investigation reason, and an immutable `AuditEvent` (`FR-DON-15`).
