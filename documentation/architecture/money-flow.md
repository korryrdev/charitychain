# Monetary Fund-Flow Architecture

CharityChain combines three monetary intake channels (M-Pesa Daraja C2B/STK, maker-checker Bank deposits + CSV reconciliation, and testnet Stablecoins) with strict pooled **FIFO lot accounting**, student Needs Vetting, **2-of-3 EIP-712 signatory release**, and forensic anomaly surveillance.

---

## 1. Intake to Lot Provisioning Sequence

```mermaid
sequenceDiagram
  autonumber
  participant Donor
  participant Channel as Daraja / Bank / Crypto
  participant API as Express 5 API
  participant DB as PostgreSQL (Prisma + Triggers)
  participant Outbox as Outbox Worker
  participant Chain as DonationLedger.sol

  alt M-Pesa C2B / STK Push
    Donor->>Channel: Pays to Paybill / STK prompt
    Channel->>API: POST /api/v1/daraja/c2b/confirmation/:token (or webhook)
    API->>DB: ACID tx: immutable DonationRawCallback + DonationLot (MLK-XXXX-XXXX) + AuditEvent + OutboxEvent
    API-->>Channel: 200 OK (idempotent on transaction ID)
  else Bank Transfer Deposit (Maker-Checker)
    Donor->>Channel: Transfers funds (KES or USD/foreign currency)
    Note over API: Treasurer A enters deposit (PENDING_VERIFICATION)
    Note over API: Treasurer B verifies deposit (assertSegregation: B != A)
    API->>DB: ACID tx: verify BankDeposit (FX -> KES minor units) + provision DonationLot + OutboxEvent
  end

  Outbox->>Chain: recordDonation(donationId, Donation struct)
  Chain-->>Outbox: DonationRecorded txHash
  Outbox->>DB: Mark OutboxEvent CONFIRMED + store BlockchainAnchor
```

---

## 2. Case Lifecycle, 2-of-3 EIP-712 Signing & FIFO Disbursement

```mermaid
sequenceDiagram
  autonumber
  participant Rep as Sub-Group Rep / Student
  participant API as Express 5 API
  participant Com as Committee Member
  participant Sig1 as Signatory 1 (MetaMask)
  participant Sig2 as Signatory 2 (MetaMask)
  participant Chain as CaseWorkflow.sol
  participant Finance as Finance / Outbox

  Rep->>API: Create student aid application / MalkiaCase (need category, requestedMinor)
  Note over API: Explainable Need-Index vetting runs automatically on submit
  Com->>API: POST /api/v1/cases/:id/decision (approve, approvedAmountMinor)
  API->>API: assertSegregation(approver != submitter) [Rule R03]
  Sig1->>Sig1: Web3.js eth_signTypedData_v4 (domain: "CharityChain CaseWorkflow" v1)
  Sig1->>API: POST /api/v1/cases/:id/authorize { signerAddress, signature, deadline }
  Sig2->>Sig2: Web3.js eth_signTypedData_v4
  Sig2->>API: POST /api/v1/cases/:id/authorize { signerAddress, signature, deadline }
  API->>API: Verify 2 distinct registered SIGNATORY addresses [Rules R02, R10]
  Finance->>Chain: authorizeRelease(caseId, amountMinor, deadline, [sig1, sig2])
  Finance->>API: POST /api/v1/cases/:id/disburse (method, ref, IPFS evidenceCID)
  API->>API: Check disbursed <= authorized, consume DonationLots FIFO (earmarks first) -> LotAllocation
```

---

## 3. FIFO Lot Allocation & Pool-Drift Invariant

1. **Lot Creation (`FR-FLOW-01`):** Verified inflows become `DonationLot` rows with `initialMinor === remainingMinor`, currency (`KES` minor units), optional earmark, and keyed `donorRef`.
2. **Earmark-First FIFO Consumption (`FR-FLOW-02`):** Disbursements select matching earmarked lots sorted oldest-first before drawing from unrestricted general pool lots, recording exact integer splits in immutable `LotAllocation` (`BEFORE UPDATE OR DELETE` trigger-protected).
3. **Trace & DAG Output (`FR-FLOW-04`):** Public `/trace` reconstructs each donor's Sankey path from lot to anonymized case categories; `/auditor/fund-flow-dag` constructs the complete 5-column PostgreSQL Fund-Flow DAG (`Donors -> Channels/Lots -> Cases -> Approvers -> Disbursements`).
4. **Nightly Pool Invariant (`R16`):** Reconciles `sum(DonationLot.remainingMinor)` against `totalVerifiedInflow - totalDisbursedOutflow` and triggers a Critical alert on any mismatch.
