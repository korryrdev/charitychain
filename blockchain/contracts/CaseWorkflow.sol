// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ICaseWorkflow} from "./interfaces/ICaseWorkflow.sol";
import {ISignatoryRegistry} from "./interfaces/ISignatoryRegistry.sol";
import {HashLib} from "./libraries/HashLib.sol";
import {Errors} from "./libraries/Errors.sol";

/**
 * @title CaseWorkflow
 * @notice Enforces student case state machine, committee decisions, 2-of-3 EIP-712 release authorization,
 * and disbursement anchoring. (PRD Section 9.2, D5, 10.2)
 */
contract CaseWorkflow is ICaseWorkflow, EIP712, AccessControl, Pausable {
    using ECDSA for bytes32;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    ISignatoryRegistry public immutable signatoryRegistry;

    mapping(bytes32 => CaseRecord) private _cases;
    mapping(bytes32 => bool) private _caseExists;

    constructor(
        address admin,
        address relayer,
        address signatoryRegistryAddress
    ) EIP712("CharityChain CaseWorkflow", "1") {
        if (admin == address(0) || relayer == address(0) || signatoryRegistryAddress == address(0)) {
            revert Errors.ZeroAddress();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(RELAYER_ROLE, relayer);

        signatoryRegistry = ISignatoryRegistry(signatoryRegistryAddress);
    }

    function submitCase(
        bytes32 caseId,
        bytes32 subGroupId,
        bytes32 caseHash,
        bytes3 needCategory,
        uint64 requestedAmountMinor
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (_caseExists[caseId]) {
            revert Errors.CaseAlreadyExists(caseId);
        }

        uint64 nowSec = uint64(block.timestamp);

        _cases[caseId] = CaseRecord({
            caseId: caseId,
            subGroupId: subGroupId,
            needCategory: needCategory,
            state: CaseState.SUBMITTED,
            requestedAmountMinor: requestedAmountMinor,
            approvedAmountMinor: 0,
            disbursedAmountMinor: 0,
            nonce: 0,
            createdAt: nowSec,
            updatedAt: nowSec,
            caseHash: caseHash,
            decisionHash: bytes32(0)
        });
        _caseExists[caseId] = true;

        emit CaseSubmitted(caseId, subGroupId, needCategory, requestedAmountMinor, caseHash);
        emit CaseStateChanged(caseId, CaseState.SUBMITTED, CaseState.SUBMITTED, nowSec);
    }

    function recordDecision(
        bytes32 caseId,
        CaseState nextState,
        uint64 approvedAmountMinor,
        bytes32 decisionHash
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);

        CaseRecord storage c = _cases[caseId];
        CaseState current = c.state;

        // Valid transitions:
        // SUBMITTED -> UNDER_REVIEW, APPROVED, REJECTED
        // UNDER_REVIEW -> APPROVED, REJECTED
        bool valid = (current == CaseState.SUBMITTED && (nextState == CaseState.UNDER_REVIEW || nextState == CaseState.APPROVED || nextState == CaseState.REJECTED)) ||
                     (current == CaseState.UNDER_REVIEW && (nextState == CaseState.APPROVED || nextState == CaseState.REJECTED));

        if (!valid) {
            revert Errors.InvalidStateTransition(caseId, uint8(current), uint8(nextState));
        }

        if (nextState == CaseState.APPROVED && approvedAmountMinor > c.requestedAmountMinor) {
            revert Errors.ExceedsApprovedAmount(approvedAmountMinor, c.requestedAmountMinor);
        }

        c.state = nextState;
        c.approvedAmountMinor = approvedAmountMinor;
        c.decisionHash = decisionHash;
        c.updatedAt = uint64(block.timestamp);

        emit DecisionRecorded(caseId, nextState, approvedAmountMinor, decisionHash);
        emit CaseStateChanged(caseId, current, nextState, c.updatedAt);
    }

    function authorizeRelease(
        bytes32 caseId,
        uint64 amountMinor,
        uint64 nonce,
        uint64 deadline,
        bytes[] calldata signatures
    ) external whenNotPaused {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);
        if (block.timestamp > deadline) revert Errors.SignatureExpired(deadline, uint64(block.timestamp));

        CaseRecord storage c = _cases[caseId];
        if (c.state != CaseState.APPROVED) {
            revert Errors.InvalidStateTransition(caseId, uint8(c.state), uint8(CaseState.AUTHORIZED));
        }
        if (nonce != c.nonce) {
            revert Errors.InvalidNonce(c.nonce, nonce);
        }
        if (amountMinor > c.approvedAmountMinor) {
            revert Errors.ExceedsApprovedAmount(amountMinor, c.approvedAmountMinor);
        }

        bytes32 structHash = HashLib.hashReleaseAuthorization(caseId, amountMinor, nonce, deadline);
        bytes32 digest = _hashTypedDataV4(structHash);

        if (signatures.length < 2) {
            revert Errors.InsufficientSignatures(signatures.length);
        }

        address signer1 = digest.recover(signatures[0]);
        address signer2 = digest.recover(signatures[1]);

        if (!signatoryRegistry.isSignatory(signer1)) revert Errors.NotASignatory(signer1);
        if (!signatoryRegistry.isSignatory(signer2)) revert Errors.NotASignatory(signer2);
        if (signer1 == signer2) revert Errors.DuplicateSigner(signer1);

        c.state = CaseState.AUTHORIZED;
        c.nonce += 1;
        c.updatedAt = uint64(block.timestamp);

        emit ReleaseAuthorized(caseId, signer1, signer2, amountMinor, nonce);
        emit CaseStateChanged(caseId, CaseState.APPROVED, CaseState.AUTHORIZED, c.updatedAt);
    }

    function recordDisbursement(
        bytes32 caseId,
        uint64 amountMinor,
        bytes32 methodRefHash,
        string calldata evidenceCid,
        bytes32 evidenceHash
    ) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);

        CaseRecord storage c = _cases[caseId];
        if (c.state != CaseState.AUTHORIZED && c.state != CaseState.DISBURSED) {
            revert Errors.InvalidStateTransition(caseId, uint8(c.state), uint8(CaseState.DISBURSED));
        }

        uint64 newTotalDisbursed = c.disbursedAmountMinor + amountMinor;
        if (newTotalDisbursed > c.approvedAmountMinor) {
            revert Errors.ExceedsAuthorizedAmount(newTotalDisbursed, c.approvedAmountMinor);
        }

        CaseState oldState = c.state;
        c.state = CaseState.DISBURSED;
        c.disbursedAmountMinor = newTotalDisbursed;
        c.updatedAt = uint64(block.timestamp);

        emit DisbursementRecorded(caseId, amountMinor, methodRefHash, evidenceCid, evidenceHash, c.updatedAt);
        if (oldState != CaseState.DISBURSED) {
            emit CaseStateChanged(caseId, oldState, CaseState.DISBURSED, c.updatedAt);
        }
    }

    function closeCase(bytes32 caseId) external onlyRole(RELAYER_ROLE) whenNotPaused {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);

        CaseRecord storage c = _cases[caseId];
        if (c.state != CaseState.DISBURSED && c.state != CaseState.REJECTED) {
            revert Errors.InvalidStateTransition(caseId, uint8(c.state), uint8(CaseState.CLOSED));
        }

        CaseState oldState = c.state;
        c.state = CaseState.CLOSED;
        c.updatedAt = uint64(block.timestamp);

        emit CaseClosed(caseId, c.updatedAt);
        emit CaseStateChanged(caseId, oldState, CaseState.CLOSED, c.updatedAt);
    }

    function getCase(bytes32 caseId) external view returns (CaseRecord memory) {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);
        return _cases[caseId];
    }

    function caseState(bytes32 caseId) external view returns (CaseState) {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);
        return _cases[caseId].state;
    }

    function caseNonce(bytes32 caseId) external view returns (uint64) {
        if (!_caseExists[caseId]) revert Errors.CaseNotFound(caseId);
        return _cases[caseId].nonce;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}

