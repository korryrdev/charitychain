// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IDonationLedger} from "./interfaces/IDonationLedger.sol";
import {HashLib} from "./libraries/HashLib.sol";
import {Errors} from "./libraries/Errors.sol";

/**
 * @title DonationLedger
 * @notice Permanent, immutable record of every verified donation lot.
 * Does not hold tokens or custody funds; functions as an authoritative notary.
 * (PRD Section 9.1, D1, D4)
 */
contract DonationLedger is IDonationLedger, AccessControl, Pausable {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct StoredDonation {
        bytes32 recordHash;
        uint64 recordedAt;
        bool exists;
    }

    mapping(bytes32 => StoredDonation) private _donations;

    constructor(address admin, address relayer) {
        if (admin == address(0) || relayer == address(0)) {
            revert Errors.ZeroAddress();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(RELAYER_ROLE, relayer);
    }

    /**
     * @notice Records an incoming donation lot on the immutable ledger.
     * Can only be written once per unique donationId.
     */
    function recordDonation(
        bytes32 donationId,
        Donation calldata d
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (_donations[donationId].exists) {
            revert Errors.DonationAlreadyRecorded(donationId);
        }

        bytes32 recordHash = HashLib.hashDonation(
            donationId,
            d.sourceRefHash,
            d.donorRef,
            d.amountMinor,
            d.currency,
            uint8(d.channel),
            d.recordedAt,
            d.evidenceHash
        );

        _donations[donationId] = StoredDonation({
            recordHash: recordHash,
            recordedAt: d.recordedAt,
            exists: true
        });

        emit DonationRecorded(
            donationId,
            d.channel,
            d.amountMinor,
            d.currency,
            d.recordedAt,
            recordHash
        );
    }

    function recordHashOf(bytes32 donationId) external view returns (bytes32) {
        if (!_donations[donationId].exists) {
            revert Errors.DonationNotFound(donationId);
        }
        return _donations[donationId].recordHash;
    }

    function recordedAtOf(bytes32 donationId) external view returns (uint64) {
        if (!_donations[donationId].exists) {
            revert Errors.DonationNotFound(donationId);
        }
        return _donations[donationId].recordedAt;
    }

    function isRecorded(bytes32 donationId) external view returns (bool) {
        return _donations[donationId].exists;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}

