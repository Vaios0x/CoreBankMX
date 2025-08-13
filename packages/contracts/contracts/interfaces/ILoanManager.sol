// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanManager {
    event Borrow(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event UpdateParams(uint256 targetLtv, uint256 liquidationLtv, uint256 baseRate);

    function borrow(uint256 amount) external;
    function repay(uint256 amount) external;
    function repayFrom(address payer, address user, uint256 amount) external;
    function getAccountData(address user) external view returns (uint256 collateral, uint256 debt, uint256 healthFactor);
    function debtOf(address user) external view returns (uint256);
}


