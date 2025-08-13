// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ILoanManager} from "../interfaces/ILoanManager.sol";
import {IVault} from "../interfaces/IVault.sol";
import {Roles} from "../access/Roles.sol";

contract CollateralVault is IVault, Roles, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable asset; // e.g., LSTBTC
    mapping(address => uint256) public balances;
    ILoanManager public loanManager; // optional backref for LTV checks/seize

    constructor(address admin, IERC20 _asset) Roles(admin) {
        asset = _asset;
    }

    function setLoanManager(ILoanManager _loan) external onlyRole(ROLE_RISK) {
        loanManager = _loan;
    }

    function pause() external onlyRole(ROLE_PAUSER) { _pause(); }
    function unpause() external onlyRole(ROLE_PAUSER) { _unpause(); }

    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        asset.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit DepositCollateral(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        if (amount > balances[msg.sender]) revert InsufficientBalance();
        // If linked to a LoanManager, enforce post-withdraw health using simulation
        if (address(loanManager) != address(0)) {
            uint256 bal = balances[msg.sender];
            uint256 newCol = bal - amount;
            (uint256 hf, ) = loanManager.simulateHealthAfter(msg.sender, newCol);
            if (hf < 1e18) revert UnsafeWithdraw();
        }
        balances[msg.sender] -= amount;
        asset.safeTransfer(msg.sender, amount);
        emit WithdrawCollateral(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    // Seize function for liquidations authorized by keeper role
    function seize(address user, address to, uint256 amount) external onlyRole(ROLE_KEEPER) nonReentrant {
        if (amount == 0) revert AmountZero();
        if (amount > balances[user]) revert InsufficientBalance();
        balances[user] -= amount;
        asset.safeTransfer(to, amount);
    }

    // helper removed (not needed in simplified guard)
}


