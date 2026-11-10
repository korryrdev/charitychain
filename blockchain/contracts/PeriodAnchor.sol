// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IPeriodAnchor} from "./interfaces/IPeriodAnchor.sol";
import {Errors} from "./libraries/Errors.sol";

/**
 * @title PeriodAnchor
 * @notice Permanent notary for daily Merkle roots and quarterly financial report fingerprints.
 * (PRD Section 9.3)
 */
contract PeriodAnchor is IPeriodAnchor, AccessControl, Pausable {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // day (YYYYMMDD) => Merkle Root
    mapping(uint32 => bytes32) private _dailyRoots;
    mapping(uint32 => bool) private _dayAnchored;

    // (year << 8 | quarter) => version => reportHash
    mapping(uint256 => mapping(uint8 => bytes32)) private _reportHashes;
    mapping(uint256 => uint8) private _latestVersions;

    constructor(address admin, address relayer) {
        if (admin == address(0) || relayer == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(RELAYER_ROLE, relayer);
    }

    function _quarterKey(uint16 year, uint8 quarter) private pure returns (uint256) {
        return (uint256(year) << 8) | uint256(quarter);
    }

    /**
     * @notice Anchors the Merkle root of the day's audit log entries.
     * Can only be written once per calendar day.
     */
    function anchorDaily(
        uint32 yyyymmdd,
        bytes32 merkleRoot
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (_dayAnchored[yyyymmdd]) {
            revert Errors.DayAlreadyAnchored(yyyymmdd);
        }
        if (merkleRoot == bytes32(0)) {
            revert Errors.EmptyRoot();
        }

        _dailyRoots[yyyymmdd] = merkleRoot;
        _dayAnchored[yyyymmdd] = true;

        emit DailyAnchored(yyyymmdd, merkleRoot, uint64(block.timestamp));
    }

    /**
     * @notice Anchors a quarterly financial report fingerprint and period Merkle root.
     * Successive amendments create a new version without modifying previous versions.
     */
    function anchorReport(
        uint16 year,
        uint8 quarter,
        bytes32 reportHashVal,
        bytes32 periodRoot
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (reportHashVal == bytes32(0) || periodRoot == bytes32(0)) {
            revert Errors.EmptyRoot();
        }

        uint256 key = _quarterKey(year, quarter);
        uint8 nextVersion = _latestVersions[key] + 1;

        _reportHashes[key][nextVersion] = reportHashVal;
        _latestVersions[key] = nextVersion;

        emit ReportAnchored(
            year,
            quarter,
            nextVersion,
            reportHashVal,
            periodRoot,
            uint64(block.timestamp)
        );
    }

    function dailyRoot(uint32 day) external view returns (bytes32) {
        return _dailyRoots[day];
    }

    function isDayAnchored(uint32 day) external view returns (bool) {
        return _dayAnchored[day];
    }

    function reportHash(
        uint16 year,
        uint8 quarter,
        uint8 version
    ) external view returns (bytes32) {
        uint256 key = _quarterKey(year, quarter);
        return _reportHashes[key][version];
    }

    function latestReportVersion(uint16 year, uint8 quarter) external view returns (uint8) {
        uint256 key = _quarterKey(year, quarter);
        return _latestVersions[key];
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
