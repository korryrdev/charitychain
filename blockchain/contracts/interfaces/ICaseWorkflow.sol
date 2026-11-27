// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICaseWorkflow
 * @notice Case lifecycle, 2-of-3 EIP-712 release authorization, and disbursements.
 */
interface ICaseWorkflow {
    enum CaseState {
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        AUTHORIZED,
        DISBURSED,
        CLOSED
    }

    struct CaseRecord {
        bytes32 caseId;
        bytes32 subGroupId;
        bytes3 needCategory;
        CaseState state;
        uint64 requestedAmountMinor;
        uint64 approvedAmountMinor;
        uint64 disbursedAmountMinor;
        uint64 nonce;
        uint64 createdAt;
        uint64 updatedAt;
        bytes32 caseHash;
        bytes32 decisionHash;
    }

    struct ReleaseAuthorization {
        bytes32 caseId;
        uint64 amountMinor;
        uint64 nonce;
        uint64 deadline;
    }

    event CaseSubmitted(
        bytes32 indexed caseId,
        bytes32 indexed subGroupId,
        bytes3 needCategory,
        uint64 requestedAmountMinor,
        bytes32 caseHash
    );

    event CaseStateChanged(
        bytes32 indexed caseId,
        CaseState oldState,
        CaseState newState,
        uint64 timestamp
    );

    event DecisionRecorded(
        bytes32 indexed caseId,
        CaseState state,
        uint64 approvedAmountMinor,
        bytes32 decisionHash
    );

    event ReleaseAuthorized(
        bytes32 indexed caseId,
        address signer1,
        address signer2,
        uint64 amountMinor,
        uint64 nonce
    );

    event DisbursementRecorded(
        bytes32 indexed caseId,
        uint64 amountMinor,
        bytes32 methodRefHash,
        string evidenceCid,
        bytes32 evidenceHash,
        uint64 timestamp
    );

    event CaseClosed(bytes32 indexed caseId, uint64 timestamp);

    function submitCase(
        bytes32 caseId,
        bytes32 subGroupId,
        bytes32 caseHash,
        bytes3 needCategory,
        uint64 requestedAmountMinor
    ) external;

    function recordDecision(
        bytes32 caseId,
        CaseState nextState,
        uint64 approvedAmountMinor,
        bytes32 decisionHash
    ) external;

    function authorizeRelease(
        bytes32 caseId,
        uint64 amountMinor,
        uint64 nonce,
        uint64 deadline,
        bytes[] calldata signatures
    ) external;

    function recordDisbursement(
        bytes32 caseId,
        uint64 amountMinor,
        bytes32 methodRefHash,
        string calldata evidenceCid,
        bytes32 evidenceHash
    ) external;

    function closeCase(bytes32 caseId) external;

    function getCase(bytes32 caseId) external view returns (CaseRecord memory);
    function caseState(bytes32 caseId) external view returns (CaseState);
    function caseNonce(bytes32 caseId) external view returns (uint64);
}

