// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library HashLib {
    bytes32 public constant DOMAIN_DONATION_V1 = keccak256("malkia:v1:donation");
    bytes32 public constant DOMAIN_CASE_V1 = keccak256("malkia:v1:case");
    bytes32 public constant RELEASE_AUTH_TYPEHASH = keccak256(
        "ReleaseAuthorization(bytes32 caseId,uint64 amountMinor,uint64 nonce,uint64 deadline)"
    );

    function idOf(string memory kind, string memory lowercaseUuid) internal pure returns (bytes32) {
        return keccak256(bytes(string.concat("malkia:v1:", kind, ":", lowercaseUuid)));
    }

    function hashDonation(
        bytes32 donationId,
        bytes32 sourceRefHash,
        bytes32 donorRef,
        uint64 amountMinor,
        bytes3 currency,
        uint8 channel,
        uint64 recordedAt,
        bytes32 evidenceHash
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_DONATION_V1,
                donationId,
                sourceRefHash,
                donorRef,
                amountMinor,
                currency,
                channel,
                recordedAt,
                evidenceHash
            )
        );
    }

    function hashCase(
        bytes32 caseId,
        bytes32 subGroupId,
        bytes3 needCategory,
        uint64 requestedAmountMinor,
        uint64 createdAt
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_CASE_V1,
                caseId,
                subGroupId,
                needCategory,
                requestedAmountMinor,
                createdAt
            )
        );
    }

    function hashAuditEntry(bytes32 prevHash, bytes memory canonicalJsonBytes) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(prevHash, canonicalJsonBytes));
    }

    function hashEmptyDay(string memory yyyymmdd) internal pure returns (bytes32) {
        return keccak256(bytes(string.concat("malkia:v1:empty-day:", yyyymmdd)));
    }

    function hashMerklePair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
    }

    function _efficientHash(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }

    function hashReleaseAuthorization(
        bytes32 caseId,
        uint64 amountMinor,
        uint64 nonce,
        uint64 deadline
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RELEASE_AUTH_TYPEHASH,
                caseId,
                amountMinor,
                nonce,
                deadline
            )
        );
    }
}
