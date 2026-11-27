// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISignatoryRegistry
 * @notice Manages committee signatories authorized to sign fund release disbursements.
 */
interface ISignatoryRegistry {
    event SignatoryAdded(address indexed signatory, address signer1, address signer2);
    event SignatoryRemoved(address indexed signatory, address signer1, address signer2);

    function addSignatory(address signatory, bytes[] calldata signatures) external;
    function removeSignatory(address signatory, bytes[] calldata signatures) external;

    function isSignatory(address account) external view returns (bool);
    function signatoryCount() external view returns (uint256);
    function getSignatories() external view returns (address[] memory);
    function verifyTwoOfThree(
        bytes32 digest,
        bytes[] calldata signatures
    ) external view returns (address signer1, address signer2);
}

