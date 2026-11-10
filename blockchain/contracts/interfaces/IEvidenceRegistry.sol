// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IEvidenceRegistry {
    event EvidenceAnchored(bytes32 indexed commitment, bytes32 indexed subjectKey, bytes32 previousCommitment, uint32 version, uint64 anchoredAt);

    function anchor(bytes32 commitment, bytes32 subjectKey, bytes32 previousCommitment) external;
    function latestCommitment(bytes32 subjectKey) external view returns (bytes32);
    function isAnchored(bytes32 commitment) external view returns (bool);
}
