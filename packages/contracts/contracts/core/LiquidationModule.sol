// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Roles} from "../access/Roles.sol";
import {LoanManager} from "./LoanManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CollateralVault} from "./CollateralVault.sol";

contract LiquidationModule is Roles {
    using SafeERC20 for IERC20;
    LoanManager public immutable loanManager;
    uint256 public incentiveBps = 1000; // 10%
    IERC20 public immutable debtAsset;
    CollateralVault public immutable collateralVault;

    event Liquidate(address indexed user, uint256 repayAmount, uint256 collateralSeized, uint256 incentive);

    constructor(address admin, LoanManager _loanManager) Roles(admin) {
        loanManager = _loanManager;
        debtAsset = _loanManager.debtAsset();
        collateralVault = CollateralVault(address(_loanManager.collateralVault()));
    }

    function setIncentive(uint256 bps) external onlyRole(ROLE_RISK) { require(bps <= 2000, "bps"); incentiveBps = bps; }

    function liquidate(address user, uint256 repayAmount) external onlyRole(ROLE_KEEPER) {
        (, uint256 debt, uint256 hf) = loanManager.getAccountData(user);
        if (hf >= 1e18) revert HealthyPosition();
        if (repayAmount == 0 || repayAmount > debt) revert AmountZero();
        // Transfer repay from keeper to this module, then approve LoanManager and repay on user's behalf
        debtAsset.safeTransferFrom(msg.sender, address(this), repayAmount);
        debtAsset.forceApprove(address(loanManager), 0);
        debtAsset.forceApprove(address(loanManager), repayAmount);
        loanManager.repayFrom(address(this), user, repayAmount);

        // Compute collateral to seize = repayAmount valued at oracle + incentiveBps premium
        // Para simplificar demo: usamos 1:1 (asumimos debtAsset y colateral con precio 1e18 equivalentes)
        uint256 baseSeize = repayAmount;
        uint256 incentive = (repayAmount * incentiveBps) / 10_000;
        uint256 totalSeize = baseSeize + incentive;
        // Move collateral from user to keeper
        collateralVault.seize(user, msg.sender, totalSeize);
        emit Liquidate(user, repayAmount, totalSeize, incentive);
    }
}


