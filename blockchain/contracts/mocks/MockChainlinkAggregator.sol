// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IChainlinkAggregatorV3} from "../interfaces/IChainlinkAggregatorV3.sol";

/**
 * @title MockChainlinkAggregator
 * @notice Local Hardhat / test mock for Chainlink AggregatorV3Interface USD/KES price feeds.
 */
contract MockChainlinkAggregator is IChainlinkAggregatorV3 {
    uint8 private immutable _decimals;
    string private _description;
    uint80 private _roundId;
    int256 private _answer;
    uint256 private _startedAt;
    uint256 private _updatedAt;
    uint80 private _answeredInRound;

    constructor(uint8 feedDecimals, int256 initialAnswer, string memory desc) {
        _decimals = feedDecimals;
        _description = desc;
        updateAnswer(initialAnswer, block.timestamp);
    }

    function updateAnswer(int256 answer, uint256 updatedAt) public {
        _roundId += 1;
        _answer = answer;
        _startedAt = updatedAt;
        _updatedAt = updatedAt;
        _answeredInRound = _roundId;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external view override returns (string memory) {
        return _description;
    }

    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, _answer, _startedAt, _updatedAt, _answeredInRound);
    }
}
