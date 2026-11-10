// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract CharityChainAccess is AccessControl, Pausable {
    bytes32 public constant SYSTEM_WRITER_ROLE = keccak256("SYSTEM_WRITER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor(address administrator) {
        require(administrator != address(0), "administrator required");
        _grantRole(DEFAULT_ADMIN_ROLE, administrator);
        _grantRole(PAUSER_ROLE, administrator);
        _grantRole(SYSTEM_WRITER_ROLE, administrator);
        _grantRole(AUDITOR_ROLE, administrator);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }
}
