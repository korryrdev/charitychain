// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IIntegrityMonitor
 * @notice Chainlink Functions consumer / oracle integrity watcher.
 */
interface IIntegrityMonitor {
    event CheckRequested(bytes32 indexed requestId, uint32 indexed day);
    event IntegrityAlert(
        uint32 indexed day,
        bytes32 anchoredRoot,
        bytes32 observedRoot,
        uint64 timestamp
    );
    event IntegrityVerified(uint32 indexed day, bytes32 root, uint64 timestamp);

    function requestCheck(uint32 day) external returns (bytes32 requestId);
    function handleCheckResponse(bytes32 requestId, uint32 day, bytes32 observedRoot) external;
    function dailyAlertRaised(uint32 day) external view returns (bool);
}

