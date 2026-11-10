// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ISignatoryRegistry} from "./interfaces/ISignatoryRegistry.sol";
import {Errors} from "./libraries/Errors.sol";

/**
 * @title SignatoryRegistry
 * @notice Maintains the set of authorized committee signatories for 2-of-3 disbursement approval.
 * (PRD Section 9.4, D5)
 */
contract SignatoryRegistry is ISignatoryRegistry, AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant SIGNATORY_ADMIN_ROLE = keccak256("SIGNATORY_ADMIN_ROLE");

    address[] private _signatories;
    mapping(address => bool) private _isSignatory;

    constructor(address admin, address[] memory initialSignatories) {
        if (admin == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(SIGNATORY_ADMIN_ROLE, admin);

        for (uint256 i = 0; i < initialSignatories.length; i++) {
            address sig = initialSignatories[i];
            if (sig == address(0)) revert Errors.ZeroAddress();
            if (_isSignatory[sig]) revert Errors.AlreadySignatory(sig);

            _isSignatory[sig] = true;
            _signatories.push(sig);
        }
    }

    function isSignatory(address account) external view returns (bool) {
        return _isSignatory[account];
    }

    function signatoryCount() external view returns (uint256) {
        return _signatories.length;
    }

    function getSignatories() external view returns (address[] memory) {
        return _signatories;
    }

    /**
     * @notice Verifies two distinct valid signatures over a digest from registered signatories.
     */
    function verifyTwoOfThree(
        bytes32 digest,
        bytes[] calldata signatures
    ) public view returns (address signer1, address signer2) {
        if (signatures.length < 2) {
            revert Errors.InsufficientSignatures(signatures.length);
        }

        bytes32 ethSignedDigest = MessageHashUtils.toEthSignedMessageHash(digest);

        signer1 = ethSignedDigest.recover(signatures[0]);
        signer2 = ethSignedDigest.recover(signatures[1]);

        if (!_isSignatory[signer1]) revert Errors.NotASignatory(signer1);
        if (!_isSignatory[signer2]) revert Errors.NotASignatory(signer2);
        if (signer1 == signer2) revert Errors.DuplicateSigner(signer1);

        return (signer1, signer2);
    }

    /**
     * @notice Adds a signatory with approval of 2 existing signatories (or admin if empty).
     */
    function addSignatory(
        address signatory,
        bytes[] calldata signatures
    ) external {
        if (signatory == address(0)) revert Errors.ZeroAddress();
        if (_isSignatory[signatory]) revert Errors.AlreadySignatory(signatory);

        address signer1;
        address signer2;

        if (_signatories.length >= 2) {
            bytes32 digest = keccak256(abi.encodePacked("ADD_SIGNATORY", signatory, block.chainid, address(this)));
            (signer1, signer2) = verifyTwoOfThree(digest, signatures);
        } else {
            _checkRole(SIGNATORY_ADMIN_ROLE);
        }

        _isSignatory[signatory] = true;
        _signatories.push(signatory);

        emit SignatoryAdded(signatory, signer1, signer2);
    }

    /**
     * @notice Removes a signatory with approval of 2 existing signatories.
     */
    function removeSignatory(
        address signatory,
        bytes[] calldata signatures
    ) external {
        if (!_isSignatory[signatory]) revert Errors.NotASignatory(signatory);
        if (_signatories.length <= 2) revert Errors.MinSignatoriesReached(_signatories.length);

        bytes32 digest = keccak256(abi.encodePacked("REMOVE_SIGNATORY", signatory, block.chainid, address(this)));
        (address signer1, address signer2) = verifyTwoOfThree(digest, signatures);

        _isSignatory[signatory] = false;

        for (uint256 i = 0; i < _signatories.length; i++) {
            if (_signatories[i] == signatory) {
                _signatories[i] = _signatories[_signatories.length - 1];
                _signatories.pop();
                break;
            }
        }

        emit SignatoryRemoved(signatory, signer1, signer2);
    }
}
