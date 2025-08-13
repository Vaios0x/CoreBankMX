// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract Roles is AccessControl {
    bytes32 public constant ROLE_ADMIN = keccak256("ROLE_ADMIN");
    bytes32 public constant ROLE_RISK = keccak256("ROLE_RISK");
    bytes32 public constant ROLE_ORACLE = keccak256("ROLE_ORACLE");
    bytes32 public constant ROLE_KEEPER = keccak256("ROLE_KEEPER");
    bytes32 public constant ROLE_PAUSER = keccak256("ROLE_PAUSER");

    constructor(address admin) {
        _grantRole(ROLE_ADMIN, admin);
        _setRoleAdmin(ROLE_RISK, ROLE_ADMIN);
        _setRoleAdmin(ROLE_ORACLE, ROLE_ADMIN);
        _setRoleAdmin(ROLE_KEEPER, ROLE_ADMIN);
        _setRoleAdmin(ROLE_PAUSER, ROLE_ADMIN);
    }
}


