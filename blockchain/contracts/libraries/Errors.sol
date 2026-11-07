// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Errors
 * @notice Standardized custom errors used across CharityChain contracts.
 */
library Errors {
    // General Errors
    error ZeroAddress();
    error ZeroAmount();
    error ArrayLengthMismatch();
    error Unauthorized();

    // DonationLedger Errors
    error DonationAlreadyRecorded(bytes32 donationId);
    error DonationNotFound(bytes32 donationId);
    error InvalidCurrency();

    // CaseWorkflow Errors
    error CaseAlreadyExists(bytes32 caseId);
    error CaseNotFound(bytes32 caseId);
    error InvalidStateTransition(bytes32 caseId, uint8 current, uint8 attempted);
    error SignatureExpired(uint64 deadline, uint64 currentTimestamp);
    error InvalidNonce(uint64 expected, uint64 actual);
    error ExceedsApprovedAmount(uint64 attempted, uint64 approved);
    error ExceedsAuthorizedAmount(uint64 attempted, uint64 authorized);

    // SignatoryRegistry Errors
    error AlreadySignatory(address account);
    error NotASignatory(address account);
    error DuplicateSigner(address signer);
    error InsufficientSignatures(uint256 count);
    error MinSignatoriesReached(uint256 current);
    error MaxSignatoriesReached(uint256 current);

    // PeriodAnchor Errors
    error DayAlreadyAnchored(uint32 day);
    error EmptyRoot();
    error ReportAlreadyAnchored(uint16 year, uint8 quarter, uint8 version);

    // IntegrityMonitor Errors
    error RequestNotFound(bytes32 requestId);
    error RequestAlreadyFulfilled(bytes32 requestId);
}

