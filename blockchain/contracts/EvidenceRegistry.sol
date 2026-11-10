// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {CharityChainAccess} from "./CharityChainAccess.sol";
import {IEvidenceRegistry} from "./interfaces/IEvidenceRegistry.sol";

/// @notice Append-only registry for privacy-preserving evidence commitments.
/// @dev Only 32-byte commitments and pseudonymous subject keys are persisted; no personal or financial data is stored.
contract EvidenceRegistry is CharityChainAccess, IEvidenceRegistry {
    struct AnchorRecord {
        bytes32 subjectKey;
        bytes32 previousCommitment;
        uint64 anchoredAt;
        uint32 version;
    }

    mapping(bytes32 => AnchorRecord) private anchors;
    mapping(bytes32 => bytes32) private latest;

    error ZeroCommitment();
    error DuplicateCommitment();
    error InvalidPreviousCommitment();

    constructor(address administrator) CharityChainAccess(administrator) {}

    function anchor(bytes32 commitment, bytes32 subjectKey, bytes32 previousCommitment)
        external
        onlyRole(SYSTEM_WRITER_ROLE)
        whenNotPaused
    {
        if (commitment == bytes32(0) || subjectKey == bytes32(0)) revert ZeroCommitment();
        if (anchors[commitment].anchoredAt != 0) revert DuplicateCommitment();
        if (latest[subjectKey] != previousCommitment) revert InvalidPreviousCommitment();

        uint32 version = anchors[previousCommitment].version + 1;
        anchors[commitment] = AnchorRecord({
            subjectKey: subjectKey,
            previousCommitment: previousCommitment,
            anchoredAt: uint64(block.timestamp),
            version: version
        });
        latest[subjectKey] = commitment;
        emit EvidenceAnchored(commitment, subjectKey, previousCommitment, version, uint64(block.timestamp));
    }

    function latestCommitment(bytes32 subjectKey) external view returns (bytes32) {
        return latest[subjectKey];
    }

    function isAnchored(bytes32 commitment) external view returns (bool) {
        return anchors[commitment].anchoredAt != 0;
    }
}
