// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDonationLedger
 * @notice Immutable donation notary ledger for CharityChain.
 * Holds no funds. Records donations and cryptographic hashes once.
 */
interface IDonationLedger {
    enum Channel {
        MPESA,
        BANK,
        IN_KIND
    }

    struct Donation {
        bytes32 sourceRefHash; // Keyed HMAC-SHA256 of M-Pesa code or bank reference
        bytes32 donorRef;      // Keyed HMAC-SHA256 of donor identity
        uint64 amountMinor;    // Minor units (cents) or item count
        bytes3 currency;       // "KES", "USD", or "ITM"
        Channel channel;       // MPESA (0), BANK (1), IN_KIND (2)
        uint64 recordedAt;     // UTC unix timestamp (seconds)
        string evidenceCid;    // IPFS CID of encrypted evidence (optional)
        bytes32 evidenceHash;  // Hash of plaintext evidence
    }

    event DonationRecorded(
        bytes32 indexed donationId,
        Channel indexed channel,
        uint64 amountMinor,
        bytes3 currency,
        uint64 recordedAt,
        bytes32 recordHash
    );

    function recordDonation(bytes32 donationId, Donation calldata d) external;
    function recordHashOf(bytes32 donationId) external view returns (bytes32);
    function recordedAtOf(bytes32 donationId) external view returns (uint64);
    function isRecorded(bytes32 donationId) external view returns (bool);
}

