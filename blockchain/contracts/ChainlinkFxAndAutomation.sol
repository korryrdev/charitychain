// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IPeriodAnchor} from "./interfaces/IPeriodAnchor.sol";
import {IChainlinkAggregatorV3} from "./interfaces/IChainlinkAggregatorV3.sol";
import {IAutomationCompatible} from "./interfaces/IAutomationCompatible.sol";
import {Errors} from "./libraries/Errors.sol";

/**
 * @title ChainlinkFxAndAutomation
 * @notice Integrates Chainlink Data Feeds (off-chain USD/KES FX conversion for international &
 * stablecoin donations) and Chainlink Automation (daily PeriodAnchor Merkle root upkeep).
 */
contract ChainlinkFxAndAutomation is IAutomationCompatible, AccessControl, Pausable {
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint8 public constant FALLBACK_DECIMALS = 8;

    IPeriodAnchor public immutable periodAnchor;
    IChainlinkAggregatorV3 public usdToKesFeed;
    uint256 public maxStalenessSeconds;
    uint256 public fallbackKesPerUsdScaled;
    bool public fallbackEnabled;

    uint32 private _latestStagedDay;
    mapping(uint32 => bytes32) private _stagedRoots;

    event FeedUpdated(address indexed feed, uint256 maxStalenessSeconds);
    event FallbackRateUpdated(uint256 kesPerUsdScaled, bool fallbackEnabled);
    event DailyRootStaged(uint32 indexed day, bytes32 root, address indexed stagedBy);
    event UpkeepAnchored(uint32 indexed day, bytes32 root, address indexed executor);

    error StalePriceFeed(uint256 updatedAt, uint256 currentTimestamp);
    error InvalidFeedPrice(int256 answer);
    error NoStagedRoot(uint32 day);

    constructor(
        address admin,
        address relayer,
        address periodAnchorAddress,
        address feedAddress,
        uint256 initialFallbackKesPerUsdScaled
    ) {
        if (admin == address(0) || relayer == address(0) || periodAnchorAddress == address(0)) {
            revert Errors.ZeroAddress();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(RELAYER_ROLE, relayer);

        periodAnchor = IPeriodAnchor(periodAnchorAddress);
        usdToKesFeed = IChainlinkAggregatorV3(feedAddress);
        maxStalenessSeconds = 3600;
        fallbackKesPerUsdScaled = initialFallbackKesPerUsdScaled;
        fallbackEnabled = feedAddress == address(0);
    }

    function setFeedConfig(
        address feedAddress,
        uint256 newMaxStalenessSeconds
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newMaxStalenessSeconds == 0) revert Errors.ZeroAmount();
        usdToKesFeed = IChainlinkAggregatorV3(feedAddress);
        maxStalenessSeconds = newMaxStalenessSeconds;
        emit FeedUpdated(feedAddress, newMaxStalenessSeconds);
    }

    function setFallbackRate(
        uint256 kesPerUsdScaled,
        bool enabled
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (kesPerUsdScaled == 0) revert Errors.ZeroAmount();
        fallbackKesPerUsdScaled = kesPerUsdScaled;
        fallbackEnabled = enabled;
        emit FallbackRateUpdated(kesPerUsdScaled, enabled);
    }

    /**
     * @notice Returns the active USD->KES rate along with feed decimals and whether fallback was used.
     */
    function latestUsdKesRate()
        public
        view
        returns (uint256 rateScaled, uint8 decimals, bool usingFallback)
    {
        if (fallbackEnabled || address(usdToKesFeed) == address(0)) {
            if (fallbackKesPerUsdScaled == 0) revert InvalidFeedPrice(0);
            return (fallbackKesPerUsdScaled, FALLBACK_DECIMALS, true);
        }

        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = usdToKesFeed.latestRoundData();

        if (answer <= 0) revert InvalidFeedPrice(answer);
        if (
            updatedAt == 0 ||
            answeredInRound < roundId ||
            block.timestamp - updatedAt > maxStalenessSeconds
        ) {
            revert StalePriceFeed(updatedAt, block.timestamp);
        }

        return (uint256(answer), usdToKesFeed.decimals(), false);
    }

    /**
     * @notice Converts USD / USDC / USDT minor units (2 decimal cents) into KES minor units.
     */
    function convertUsdCentsToKesMinor(uint256 usdMinor) external view returns (uint256 kesMinor) {
        if (usdMinor == 0) revert Errors.ZeroAmount();
        (uint256 rateScaled, uint8 feedDecimals, ) = latestUsdKesRate();
        return (usdMinor * rateScaled) / (10 ** feedDecimals);
    }

    /**
     * @notice Stages a computed daily audit Merkle root so Chainlink Automation can anchor it.
     */
    function stageDailyRoot(
        uint32 yyyymmdd,
        bytes32 merkleRoot
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (merkleRoot == bytes32(0)) revert Errors.EmptyRoot();
        if (periodAnchor.isDayAnchored(yyyymmdd)) revert Errors.DayAlreadyAnchored(yyyymmdd);

        _stagedRoots[yyyymmdd] = merkleRoot;
        _latestStagedDay = yyyymmdd;

        emit DailyRootStaged(yyyymmdd, merkleRoot, msg.sender);
    }

    function stagedRootOf(uint32 yyyymmdd) external view returns (bytes32) {
        return _stagedRoots[yyyymmdd];
    }

    function latestStagedDay() external view returns (uint32) {
        return _latestStagedDay;
    }

    /**
     * @notice Chainlink Automation checkUpkeep: checks whether a staged day still needs anchoring.
     */
    function checkUpkeep(
        bytes calldata checkData
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint32 targetDay = checkData.length == 32
            ? abi.decode(checkData, (uint32))
            : _latestStagedDay;

        if (targetDay == 0) return (false, "");

        bytes32 root = _stagedRoots[targetDay];
        if (root == bytes32(0) || periodAnchor.isDayAnchored(targetDay)) {
            return (false, "");
        }

        return (true, abi.encode(targetDay, root));
    }

    /**
     * @notice Chainlink Automation performUpkeep: anchors the verified staged Merkle root on PeriodAnchor.
     */
    function performUpkeep(bytes calldata performData) external override whenNotPaused {
        (uint32 day, bytes32 expectedRoot) = abi.decode(performData, (uint32, bytes32));
        bytes32 staged = _stagedRoots[day];
        if (staged == bytes32(0) || staged != expectedRoot) revert NoStagedRoot(day);
        if (periodAnchor.isDayAnchored(day)) revert Errors.DayAlreadyAnchored(day);

        delete _stagedRoots[day];
        periodAnchor.anchorDaily(day, staged);

        emit UpkeepAnchored(day, staged, msg.sender);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
