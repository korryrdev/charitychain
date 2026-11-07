// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPeriodAnchor
 * @notice Daily ledger Merkle roots and quarterly report fingerprint notary.
 */
interface IPeriodAnchor {
    event DailyAnchored(uint32 indexed day, bytes32 root, uint64 timestamp);
    event ReportAnchored(
        uint16 indexed year,
        uint8 indexed quarter,
        uint8 version,
        bytes32 reportHash,
        bytes32 periodRoot,
        uint64 timestamp
    );

    function anchorDaily(uint32 yyyymmdd, bytes32 merkleRoot) external;
    function anchorReport(
        uint16 year,
        uint8 quarter,
        bytes32 reportHash,
        bytes32 periodRoot
    ) external;

    function dailyRoot(uint32 day) external view returns (bytes32);
    function reportHash(
        uint16 year,
        uint8 quarter,
        uint8 version
    ) external view returns (bytes32);
    function latestReportVersion(uint16 year, uint8 quarter) external view returns (uint8);
    function isDayAnchored(uint32 day) external view returns (bool);
}

