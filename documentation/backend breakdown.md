# CharityChain Backend Breakdown

This document is the central implementation checklist and reference for the CharityChain backend. It records every backend area currently represented in the project structure so that each part can be implemented and verified separately.

## 1. Backend Root

```text
backend/
├── .env.example
├── package.json
├── scripts/
│   └── checkBuild.js
├── src/
└── tests/
```

## 2. Application Entry and Bootstrap

```text
backend/src/
├── app.js
├── server.js
└── bootstrap/
    ├── connectDatabase.js
    ├── gracefulShutdown.js
    ├── registerMiddleware.js
    ├── registerRoutes.js
    ├── startWorkers.js
    └── validateEnvironment.js
```

Responsibilities: construct the Express application, validate environment variables, connect Prisma and PostgreSQL, register middleware and routes, start background workers, launch the HTTP server, and shut down safely.

## 3. Configuration

```text
backend/src/config/
├── authentication.js
├── blockchain.js
├── cors.js
├── database.js
├── environment.js
├── featureFlags.js
├── integrations.js
├── logging.js
└── security.js
```

Responsibilities: centralize authentication, database, CORS, security, logging, integration, blockchain-auditing, and feature-flag configuration.

## 4. Constants and Errors

```text
backend/src/constants/
├── integrationNames.js
├── permissions.js
├── roles.js
└── statuses.js

backend/src/errors/
├── AppError.js
├── AuthenticationError.js
├── AuthorizationError.js
├── ConflictError.js
├── IntegrationError.js
├── ValidationError.js
└── errorCodes.js
```

## 5. Middleware

```text
backend/src/middleware/
├── auditContext.js
├── authenticate.js
├── authorize.js
├── csrfProtection.js
├── errorHandler.js
├── idempotency.js
├── notFound.js
├── rateLimit.js
├── requestContext.js
├── requestLogger.js
├── requireMfa.js
└── validateRequest.js
```

Responsibilities: authentication, authorization, MFA enforcement, validation, idempotency, auditing, rate limiting, CSRF protection, request tracing, logging, 404 handling, and centralized error handling.

## 6. Route Composition

```text
backend/src/routes/
├── authenticated.routes.js
├── health.routes.js
├── index.js
├── public.routes.js
└── webhook.routes.js
```

## 7. Authentication and Access Control

### 7.1 Authentication

```text
modules/auth/
├── auth.routes.js
├── auth.controller.js
├── auth.service.js
├── auth.repository.js
├── auth.validation.js
├── auth.policy.js
├── auth.mapper.js
├── auth.events.js
├── auth.errors.js
├── accountVerification.service.js
├── passwordReset.service.js
├── mfa.service.js
└── auth.test.js
```

### 7.2 Users

```text
modules/users/
├── users.routes.js
├── users.controller.js
├── users.service.js
├── users.repository.js
├── users.validation.js
├── users.policy.js
├── users.mapper.js
├── users.events.js
└── users.test.js
```

### 7.3 Roles and Permissions

```text
modules/roles/
├── roles.routes.js
├── roles.controller.js
├── roles.service.js
├── roles.repository.js
├── roles.validation.js
├── roles.policy.js
├── permissions.service.js
└── roles.test.js
```

### 7.4 Sessions

```text
modules/sessions/
├── sessions.routes.js
├── sessions.controller.js
├── sessions.service.js
├── sessions.repository.js
├── sessions.policy.js
├── sessionRotation.service.js
├── sessionRevocation.service.js
└── sessions.test.js
```

Responsibilities: registration and login, account verification, password reset, MFA, staff invitation, user management, role-based permissions, secure sessions, token rotation, logout, and session revocation.

## 8. Donors, Public Profiles, and Recognition

### 8.1 Donors

```text
modules/donors/
├── donors.routes.js
├── donors.controller.js
├── donors.service.js
├── donors.repository.js
├── donors.validation.js
├── donors.policy.js
├── donors.mapper.js
├── aliasGenerator.service.js
└── donors.test.js
```

### 8.2 Public Profiles

```text
modules/publicProfiles/
├── publicProfiles.routes.js
├── publicProfiles.controller.js
├── publicProfiles.service.js
├── publicProfiles.repository.js
├── publicProfiles.validation.js
├── publicProfiles.policy.js
├── publicProfile.mapper.js
└── publicProfiles.test.js
```

### 8.3 Recognition

```text
modules/recognition/
├── recognition.routes.js
├── recognition.controller.js
├── recognition.service.js
├── recognition.repository.js
├── recognition.validation.js
├── recognition.events.js
├── tierCalculator.service.js
├── goodsValuation.service.js
└── recognition.test.js
```

Responsibilities: donor profiles, generated anonymous aliases, public-name preference, contribution valuation, and Silver, Gold, Diamond, and Platinum recognition tiers.

## 9. Monetary Donations

```text
modules/moneyDonations/
├── moneyDonations.routes.js
├── moneyDonations.controller.js
├── moneyDonations.service.js
├── moneyDonations.repository.js
├── moneyDonations.validation.js
├── moneyDonations.policy.js
├── moneyDonations.mapper.js
├── moneyDonations.events.js
├── moneyDonations.errors.js
├── donationAllocation.service.js
├── donationReceipt.service.js
├── donationTracking.service.js
└── moneyDonations.test.js
```

Responsibilities: donation initiation, tracking identifiers, central-pool allocation, receipts, donation history, and donor fund-flow tracking.

## 10. Payments

```text
modules/payments/
├── payments.routes.js
├── payments.controller.js
├── payments.service.js
├── payments.repository.js
├── payments.validation.js
├── payments.policy.js
├── payments.mapper.js
├── payments.events.js
├── paymentProviderFactory.js
├── paymentIdempotency.service.js
├── paymentStatus.service.js
├── providerEvent.service.js
└── payments.test.js
```

Responsibilities: common payment orchestration for M-Pesa and banks, provider selection, callbacks, status tracking, idempotency, and duplicate-event prevention.

## 11. Physical Donations

```text
modules/physicalDonations/
├── physicalDonations.routes.js
├── physicalDonations.controller.js
├── physicalDonations.service.js
├── physicalDonations.repository.js
├── physicalDonations.validation.js
├── physicalDonations.policy.js
├── physicalDonations.mapper.js
├── physicalDonations.events.js
├── physicalDonationInspection.service.js
├── physicalCashDeposit.service.js
└── physicalDonations.test.js
```

Responsibilities: record pending physical goods or cash, validate and inspect entries, and prevent unconfirmed records from entering finalized inventory or financial records.

## 12. Confirmations

```text
modules/confirmations/
├── confirmations.routes.js
├── confirmations.controller.js
├── confirmations.service.js
├── confirmations.repository.js
├── confirmations.validation.js
├── confirmations.policy.js
├── confirmations.events.js
├── confirmationToken.service.js
├── confirmationExpiry.service.js
└── confirmations.test.js
```

Responsibilities: donor and student Yes/No confirmations, secure confirmation tokens, expiry, rejection, re-entry, and confirmation auditing.

## 13. Inventory

```text
modules/inventory/
├── inventory.routes.js
├── inventory.controller.js
├── inventory.service.js
├── inventory.repository.js
├── inventory.validation.js
├── inventory.policy.js
├── inventory.mapper.js
├── inventory.events.js
├── inspection.service.js
├── batchAndExpiry.service.js
├── reservation.service.js
├── stockCount.service.js
├── stockMovement.service.js
└── inventory.test.js
```

Responsibilities: accepted-goods inventory, categories, quantities, batches, expiry dates, inspections, reservations, stock counts, and append-only stock movements.

## 14. Students and Simulated University Records

### 14.1 Students

```text
modules/students/
├── students.routes.js
├── students.controller.js
├── students.service.js
├── students.repository.js
├── students.validation.js
├── students.policy.js
├── students.mapper.js
└── students.test.js
```

### 14.2 University Records

```text
modules/universityRecords/
├── universityRecords.routes.js
├── universityRecords.controller.js
├── universityRecords.service.js
├── universityRecords.repository.js
├── universityRecords.validation.js
├── universityRecords.policy.js
├── universityRecords.mapper.js
├── paymentHistory.service.js
├── examCalendar.service.js
├── aidRecords.service.js
└── universityRecords.test.js
```

Responsibilities: registration-number verification and simulated student status, fee balances, historical payments, exam calendars, HELB, scholarships, and NGO-support records.

## 15. Applications

```text
modules/applications/
├── applications.routes.js
├── applications.controller.js
├── applications.service.js
├── applications.repository.js
├── applications.validation.js
├── applications.policy.js
├── applications.mapper.js
├── applications.events.js
├── applicationStateMachine.js
├── duplicatePrevention.service.js
└── applications.test.js
```

Responsibilities: tuition and upkeep applications, semester restrictions, duplicate prevention, status transitions, and application history.

## 16. Student Vetting

```text
modules/vetting/
├── vetting.routes.js
├── vetting.controller.js
├── vetting.service.js
├── vetting.repository.js
├── vetting.validation.js
├── vetting.policy.js
├── vetting.mapper.js
├── vetting.events.js
├── vettingPolicy.service.js
├── vettingExplanation.service.js
├── microPaymentFactor.js
├── examPeriodFactor.js
├── financeBlockFactor.js
├── aidRelianceFactor.js
├── unmetBalanceFactor.js
├── previousAssistanceFactor.js
├── duplicateApplicationFactor.js
└── vetting.test.js
```

Responsibilities: calculate and explain the Need Index using micro-payment history, exam-period payments, financial blocks, government-aid reliance, unmet balances, previous assistance, and duplicate-application checks.

## 17. Committee

```text
modules/committee/
├── committee.routes.js
├── committee.controller.js
├── committee.service.js
├── committee.repository.js
├── committee.validation.js
├── committee.policy.js
├── membership.service.js
├── conflictOfInterest.service.js
└── committee.test.js
```

Responsibilities: committee membership, active signatories, committee permissions, membership history, and conflict-of-interest controls.

## 18. Approvals

```text
modules/approvals/
├── approvals.routes.js
├── approvals.controller.js
├── approvals.service.js
├── approvals.repository.js
├── approvals.validation.js
├── approvals.policy.js
├── approvals.mapper.js
├── approvals.events.js
├── approvals.errors.js
├── approvalDigest.service.js
├── approvalThreshold.service.js
├── approvalInvalidation.service.js
└── approvals.test.js
```

Responsibilities: committee decisions, two-out-of-three approval enforcement, approval digests, duplicate-signature prevention, and invalidation after material application changes.

## 19. Disbursements

```text
modules/disbursements/
├── disbursements.routes.js
├── disbursements.controller.js
├── disbursements.service.js
├── disbursements.repository.js
├── disbursements.validation.js
├── disbursements.policy.js
├── disbursements.mapper.js
├── disbursements.events.js
├── disbursementStateMachine.js
├── tuitionDisbursement.service.js
├── upkeepDisbursement.service.js
└── disbursements.test.js
```

Responsibilities: approved tuition payments to the university, upkeep payments to verified students, payout state transitions, callbacks, receipts, and failure recovery.

## 20. Goods Collections

```text
modules/goodsCollections/
├── goodsCollections.routes.js
├── goodsCollections.controller.js
├── goodsCollections.service.js
├── goodsCollections.repository.js
├── goodsCollections.validation.js
├── goodsCollections.policy.js
├── goodsCollections.mapper.js
├── goodsCollections.events.js
├── goodsEligibility.service.js
├── collectionLimit.service.js
├── collectionConfirmation.service.js
├── goodsRelease.service.js
└── goodsCollections.test.js
```

Responsibilities: student eligibility, category and quantity limits, stock reservation, SMS confirmation, rejection and correction, and goods release only after successful confirmation.

## 21. Reconciliation and Ledger Posting

```text
modules/reconciliation/
├── reconciliation.routes.js
├── reconciliation.controller.js
├── reconciliation.service.js
├── reconciliation.repository.js
├── reconciliation.validation.js
├── reconciliation.policy.js
├── reconciliation.events.js
├── transactionMatcher.service.js
├── ledgerPosting.service.js
├── varianceDetection.service.js
└── reconciliation.test.js
```

Responsibilities: compare provider transactions with internal payments, receipts, disbursements, and ledger postings; identify missing, duplicated, or mismatched money.

## 22. Evidence

```text
modules/evidence/
├── evidence.routes.js
├── evidence.controller.js
├── evidence.service.js
├── evidence.repository.js
├── evidence.validation.js
├── evidence.policy.js
├── evidence.mapper.js
├── canonicalEvidence.service.js
├── evidenceEncryption.service.js
├── evidenceRetention.service.js
└── evidence.test.js
```

Responsibilities: canonical evidence generation, encryption, IPFS references, retention, access control, and integrity verification.

## 23. Blockchain Audit Anchoring

```text
modules/blockchainAudit/
├── blockchainAudit.routes.js
├── blockchainAudit.controller.js
├── blockchainAudit.service.js
├── blockchainAudit.repository.js
├── blockchainAudit.validation.js
├── blockchainAudit.policy.js
├── commitmentBuilder.service.js
├── anchorQueue.service.js
├── transactionMonitor.service.js
└── blockchainAudit.test.js
```

Responsibilities: create tamper-evident commitments, queue audit anchors, submit hashes to the audit smart contract, and monitor confirmation. Blockchain is used for audit evidence, not cryptocurrency payments or user wallets.

## 24. Audit Logs

```text
modules/auditLogs/
├── auditLogs.routes.js
├── auditLogs.controller.js
├── auditLogs.service.js
├── auditLogs.repository.js
├── auditLogs.policy.js
├── auditEventBuilder.js
├── auditIntegrity.service.js
└── auditLogs.test.js
```

Responsibilities: append-only audit events, actor and request context, integrity checks, authorized searches, and export support.

## 25. Forensic Analytics

```text
modules/forensicAnalytics/
├── forensicAnalytics.routes.js
├── forensicAnalytics.controller.js
├── forensicAnalytics.service.js
├── forensicAnalytics.repository.js
├── forensicAnalytics.validation.js
├── forensicAnalytics.policy.js
├── investigation.service.js
├── forensicAnalytics.test.js
└── rules/
    ├── approvalConflict.rule.js
    ├── disbursementSpike.rule.js
    ├── duplicateCallback.rule.js
    ├── inventoryVariance.rule.js
    ├── repeatedConfirmationFailure.rule.js
    ├── unreconciledMoney.rule.js
    └── unusualClerkActivity.rule.js
```

Responsibilities: anomaly detection, investigation records, approval conflicts, payout spikes, duplicated callbacks, inventory variance, confirmation failures, unreconciled funds, and suspicious clerk activity.

## 26. Transparency

```text
modules/transparency/
├── transparency.routes.js
├── transparency.controller.js
├── transparency.service.js
├── transparency.repository.js
├── transparency.policy.js
├── publicDataSanitizer.js
├── transparencyAggregation.service.js
└── transparency.test.js
```

Responsibilities: generate privacy-safe public donation, fund-flow, disbursement, inventory, recognition, and audit data without exposing protected personal information.

## 27. Notifications

```text
modules/notifications/
├── notifications.routes.js
├── notifications.controller.js
├── notifications.service.js
├── notifications.repository.js
├── notifications.validation.js
├── notifications.policy.js
├── notificationTemplate.service.js
├── notificationDelivery.service.js
└── notifications.test.js
```

## 28. Reports

```text
modules/reports/
├── reports.routes.js
├── reports.controller.js
├── reports.service.js
├── reports.repository.js
├── reports.policy.js
├── donorStatement.service.js
├── quarterlyReport.service.js
└── reports.test.js
```

## 29. Complaints and Appeals

```text
modules/complaints/
├── complaints.routes.js
├── complaints.controller.js
├── complaints.service.js
├── complaints.repository.js
├── complaints.validation.js
├── complaints.policy.js
├── complaints.events.js
├── appeals.service.js
└── complaints.test.js
```

## 30. Configurable Policies

```text
modules/policies/
├── policies.routes.js
├── policies.controller.js
├── policies.service.js
├── policies.repository.js
├── policies.validation.js
├── policies.policy.js
├── policyVersioning.service.js
└── policies.test.js
```

Responsibilities: version vetting thresholds, collection limits, recognition tiers, approval rules, and other institutional policies without silently rewriting historical decisions.

## 31. System Health

```text
modules/systemHealth/
├── systemHealth.routes.js
├── systemHealth.controller.js
├── systemHealth.service.js
├── dependencyChecks.service.js
├── readiness.service.js
└── systemHealth.test.js
```

## 32. External Integrations

### 32.1 M-Pesa

```text
integrations/mpesa/
├── mpesa.config.js
├── mpesa.client.js
├── mpesa.auth.js
├── mpesa.mapper.js
├── mpesa.errors.js
├── stkPush.adapter.js
├── c2b.adapter.js
├── b2b.adapter.js
├── b2c.adapter.js
├── transactionStatus.adapter.js
├── reconciliation.adapter.js
├── callback.controller.js
├── callback.validation.js
├── callbackDeduplicator.js
└── mpesa.test.js
```

### 32.2 Bank

```text
integrations/bank/
├── bankProvider.interface.js
├── bankProviderFactory.js
├── sandboxBank.adapter.js
├── bankReconciliation.adapter.js
├── bankWebhook.controller.js
├── bankWebhook.validation.js
├── bank.errors.js
└── bank.test.js
```

### 32.3 SMS

```text
integrations/sms/
├── smsProvider.interface.js
├── smsProviderFactory.js
├── sms.client.js
├── smsTemplates.js
├── confirmationMessage.builder.js
├── sandboxSms.adapter.js
├── deliveryStatus.controller.js
├── deliveryStatus.validation.js
├── sms.errors.js
└── sms.test.js
```

### 32.4 IPFS

```text
integrations/ipfs/
├── ipfs.config.js
├── ipfs.client.js
├── ipfsUploader.js
├── ipfsRetriever.js
├── ipfsPinner.js
├── cidVerifier.js
├── availabilityChecker.js
├── contentEncryption.js
├── ipfs.errors.js
└── ipfs.test.js
```

### 32.5 Blockchain and Web3

```text
integrations/blockchain/
├── web3.config.js
├── web3.client.js
├── contractRegistry.js
├── transactionSigner.js
├── transactionSubmitter.js
├── transactionReceipt.js
├── confirmationMonitor.js
├── eventReader.js
├── blockchain.errors.js
└── blockchain.test.js
```

### 32.6 Chainlink

```text
integrations/chainlink/
├── chainlink.config.js
├── chainlink.client.js
├── oracleRequest.adapter.js
├── oracleResult.validator.js
└── chainlink.test.js
```

The empty `backend/src/modules/integrations/` directory is only a placeholder. Provider-specific adapters belong under `backend/src/integrations/`.

## 33. Events and Transactional Outbox

```text
backend/src/events/
├── eventBus.js
├── eventHandlers.js
├── eventNames.js
├── eventPublisher.js
└── outboxProcessor.js
```

Responsibilities: publish domain events reliably, persist transactional outbox entries, dispatch handlers, and retry failed asynchronous processing.

## 34. Background Jobs

```text
backend/src/jobs/
├── jobRegistry.js
├── jobRunner.js
├── anomalyScan.job.js
├── blockchainAnchor.job.js
├── confirmationExpiry.job.js
├── ipfsAvailability.job.js
├── notificationDelivery.job.js
├── paymentStatus.job.js
├── reconciliation.job.js
├── reservationExpiry.job.js
├── tierRecalculation.job.js
└── transparencyRefresh.job.js
```

## 35. Security Utilities

```text
backend/src/security/
├── encryption.js
├── keyVersions.js
├── passwordHasher.js
├── replayProtector.js
├── secureIdentifier.js
├── securityEventRecorder.js
├── sensitiveDataRedactor.js
├── sessionProtector.js
├── tokenHasher.js
└── webhookVerifier.js
```

## 36. Observability

```text
backend/src/observability/
├── healthChecks.js
├── logger.js
├── metrics.js
├── requestCorrelation.js
└── tracing.js
```

## 37. Shared Utilities

```text
backend/src/utils/
├── assertions.js
├── canonicalJson.js
├── dates.js
├── money.js
├── pagination.js
└── retry.js
```

## 38. Backend Tests

```text
backend/tests/
├── api/
│   └── health.test.js
├── fixtures/
├── integration/
├── reconciliation/
├── security/
└── unit/
```

Testing must cover unit rules, repositories, APIs, authentication and authorization, integrations, callbacks, idempotency, reconciliation, security, state transitions, background jobs, and complete money and goods workflows.

## 39. Agreed Implementation Order

- [x] 1. Application entry, configuration, bootstrap, errors, middleware, health, and test harness
- [x] 2. Authentication
- [x] 3. Users, roles, permissions, and sessions
- [x] 4. Donors, public profiles, aliases, and recognition
- [x] 5. Students and simulated university records
- [x] 6. Monetary donations
- [x] 7. Payments and M-Pesa/bank ingestion
- [x] 8. Physical donations
- [x] 9. SMS confirmations
- [x] 10. Inventory
- [x] 11. Student applications
- [x] 12. Vetting and Need Index calculation
- [x] 13. Committee membership and conflict controls
- [x] 14. Two-out-of-three approvals
- [x] 15. Monetary disbursements
- [x] 16. Physical-goods collections
- [x] 17. Reconciliation and ledger posting
- [x] 18. Evidence and IPFS
- [x] 19. Audit logs and blockchain anchoring
- [x] 20. Forensic analytics
- [x] 21. Transparency APIs
- [ ] 22. Notifications and reports
- [ ] 23. Complaints, appeals, and configurable policies
- [ ] 24. Events, background jobs, security, and observability hardening
- [ ] 25. Complete unit, integration, security, reconciliation, and end-to-end backend verification

Each checkbox may be marked complete only after its implementation, database behavior, authorization rules, failure paths, and automated tests have been verified.
