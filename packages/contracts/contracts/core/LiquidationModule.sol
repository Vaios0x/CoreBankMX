// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Roles} from "../access/Roles.sol";
import {LoanManager} from "./LoanManager.sol";
import {IOracle} from "../interfaces/IOracle.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {CollateralVault} from "./CollateralVault.sol";

contract LiquidationModule is Roles {
    error HealthyPosition();
    error AmountZero();
    using SafeERC20 for IERC20;
    LoanManager public immutable loanManager;
    uint256 public incentiveBps = 1000; // 10%
    IERC20 public immutable debtAsset;
    CollateralVault public immutable collateralVault;
    address public treasury;

    event Liquidate(address indexed user, uint256 repayAmount, uint256 collateralSeized, uint256 incentive);
    event SetTreasury(address indexed treasury);

    constructor(address admin, LoanManager _loanManager) Roles(admin) {
        loanManager = _loanManager;
        debtAsset = _loanManager.debtAsset();
        collateralVault = CollateralVault(address(_loanManager.collateralVault()));
        treasury = admin;
    }

    function setIncentive(uint256 bps) external onlyRole(ROLE_RISK) { require(bps <= 2000, "bps"); incentiveBps = bps; }
    function setTreasury(address _treasury) external onlyRole(ROLE_ADMIN) { require(_treasury != address(0), "treasury"); treasury = _treasury; emit SetTreasury(_treasury); }

    function liquidate(address user, uint256 repayAmount) external onlyRole(ROLE_KEEPER) {
        (, uint256 debt, uint256 hf) = loanManager.getAccountData(user);
        if (hf >= 1e18) revert HealthyPosition();
        if (repayAmount == 0 || repayAmount > debt) revert AmountZero();
        // Transfer repay from keeper to this module, then approve LoanManager and repay on user's behalf
        debtAsset.safeTransferFrom(msg.sender, address(this), repayAmount);
        debtAsset.forceApprove(address(loanManager), 0);
        debtAsset.forceApprove(address(loanManager), repayAmount);
        loanManager.repayFrom(address(this), user, repayAmount);

        // Compute collateral to seize using oracle price (debt units per 1 collateral, 1e18 scale)
        uint256 price = 1e18;
        address ct = loanManager.collateralToken();
        address oracleAddr = address(loanManager.oracle());
        if (oracleAddr != address(0) && ct != address(0)) {
            (uint256 p, ) = IOracle(oracleAddr).getPrice(ct);
            if (p > 0) price = p;
        }
        // Convert debt to collateral units: amountCol = debt * 1e18 / price
        uint256 baseSeizeCol = (repayAmount * 1e18) / price;
        uint256 incentiveDebt = (repayAmount * incentiveBps) / 10_000;
        uint256 incentiveCol = (incentiveDebt * 1e18) / price;
        uint256 totalCol = baseSeizeCol + incentiveCol;
        // Move collateral from user to keeper (base) and treasury (penalty)
        if (baseSeizeCol > 0) {
            collateralVault.seize(user, msg.sender, baseSeizeCol);
        }
        if (incentiveCol > 0) {
            collateralVault.seize(user, treasury, incentiveCol);
        }
        emit Liquidate(user, repayAmount, totalCol, incentiveDebt);
    }
}


