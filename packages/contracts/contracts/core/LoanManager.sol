// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Roles} from "../access/Roles.sol";
import {IVault} from "../interfaces/IVault.sol";
import {ILoanManager} from "../interfaces/ILoanManager.sol";
import {IOracle} from "../interfaces/IOracle.sol";

contract LoanManager is Roles, Pausable, ReentrancyGuard, ILoanManager {
    using SafeERC20 for IERC20;
    IERC20 public immutable debtAsset; // USDT
    IVault public immutable collateralVault;
    IOracle public oracle; // optional
    address public collateralToken; // for oracle lookup
    // Fees
    address public feeController; // optional
    address public feeCollector; // cached from fee controller when set


    uint256 public targetLtv = 6000; // bps 60%
    uint256 public liquidationLtv = 7500; // bps 75%
    uint256 public baseRateBps = 500; // 5%
    uint256 public interestIndex = 1e18; // 1.0 in 1e18
    uint256 public lastAccrual;

    mapping(address => uint256) public principalDebt; // unscaled principal per user
    mapping(address => uint256) public userIndex; // last index applied to user's debt

    event UpdateRates(uint256 baseRateBps);
    event SetFeeController(address indexed controller);
    event AccrueInterest(uint256 newIndex, uint256 dt);

    constructor(address admin, IERC20 _debtAsset, IVault _vault) Roles(admin) {
        debtAsset = _debtAsset;
        collateralVault = _vault;
        lastAccrual = block.timestamp;
    }

    function setOracle(IOracle _oracle, address _collateralToken) external onlyRole(ROLE_RISK) {
        oracle = _oracle;
        collateralToken = _collateralToken;
    }

    function setParams(uint256 _target, uint256 _liq, uint256 _baseRate) external onlyRole(ROLE_RISK) {
        require(_target < _liq && _liq <= 9000, "params");
        targetLtv = _target; liquidationLtv = _liq; baseRateBps = _baseRate;
        emit UpdateRates(baseRateBps);
    }

    function setFeeController(address controller, address collector) external onlyRole(ROLE_ADMIN) {
        feeController = controller;
        feeCollector = collector;
        emit SetFeeController(controller);
    }

    function borrow(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert AmountZero();
        _applyInterest(msg.sender);
        (uint256 c, uint256 d, ) = getAccountData(msg.sender);
        uint256 newDebt = d + amount;
        if (_ltv(c, newDebt) > targetLtv) revert LtvTooHigh();
        // Fees: originación si hay feeController
        uint256 fee;
        if (feeController != address(0) && feeCollector != address(0)) {
            (bool ok, bytes memory data) = feeController.staticcall(abi.encodeWithSignature("getBorrowFee(address,uint256)", msg.sender, amount));
            if (ok && data.length >= 64) {
                (uint256 f, address collector) = abi.decode(data, (uint256, address));
                fee = f;
                if (fee > 0 && collector != address(0)) {
                    debtAsset.safeTransfer(collector, fee);
                }
            }
        }
        // update user principal using current index
        principalDebt[msg.sender] = _toPrincipal(newDebt);
        userIndex[msg.sender] = interestIndex;
        debtAsset.safeTransfer(msg.sender, amount);
        emit Borrow(msg.sender, amount, fee);
    }

    function repay(uint256 amount) external nonReentrant whenNotPaused {
        _repayFrom(msg.sender, msg.sender, amount);
    }

    function repayFrom(address payer, address user, uint256 amount) external nonReentrant whenNotPaused {
        _repayFrom(payer, user, amount);
    }

    function _repayFrom(address payer, address user, uint256 amount) internal {
        if (amount == 0) revert AmountZero();
        _applyInterest(user);
        debtAsset.safeTransferFrom(payer, address(this), amount);
        uint256 d = _debtOf(user);
        uint256 newDebt = amount >= d ? 0 : d - amount;
        principalDebt[user] = _toPrincipal(newDebt);
        userIndex[user] = interestIndex;
        emit Repay(user, amount);
    }

    function accrueInterest() external whenNotPaused {
        uint256 dt = block.timestamp - lastAccrual;
        if (dt == 0) return;
        // rate per second in 1e18 = (baseRateBps/10000) / secondsPerYear
        uint256 ratePerSecond = (baseRateBps * 1e14) / 31536000; // 1e18 scale
        // simple linear approximation: index *= (1 + ratePerSecond * dt)
        uint256 increment = (interestIndex * ratePerSecond * dt) / 1e18;
        interestIndex = interestIndex + increment;
        lastAccrual = block.timestamp;
        emit AccrueInterest(interestIndex, dt);
    }

    function getAccountData(address user) public view returns (uint256 collateral, uint256 _debt, uint256 healthFactor) {
        collateral = collateralVault.balanceOf(user);
        _debt = _debtOf(user);
        if (_debt == 0) return (collateral, 0, type(uint256).max);
        // Value collateral in debt units if oracle is set (price scaled 1e18). Otherwise assume 1:1
        uint256 collateralUsd = collateral;
        if (address(oracle) != address(0) && collateralToken != address(0)) {
            (uint256 price, ) = oracle.getPrice(collateralToken);
            // collateral * price / 1e18
            collateralUsd = (collateral * price) / 1e18;
        }
        uint256 maxDebt = (collateralUsd * liquidationLtv) / 10_000;
        healthFactor = (maxDebt * 1e18) / _debt;
    }

    function debtOf(address user) external view returns (uint256) {
        return _debtOf(user);
    }

    function _debtOf(address user) internal view returns (uint256) {
        uint256 p = principalDebt[user];
        if (p == 0) return 0;
        uint256 idx = interestIndex;
        uint256 uidx = userIndex[user];
        if (uidx == 0) uidx = 1e18;
        // scaled debt = principal * (idx / uidx)
        return (p * idx) / uidx;
    }

    function _toPrincipal(uint256 scaledDebt) internal view returns (uint256) {
        // principal = scaled / (idx / 1e18) = scaled * 1e18 / idx, but idx is 1e18-based so simplify
        if (scaledDebt == 0) return 0;
        return (scaledDebt * 1e18) / interestIndex;
    }

    function _applyInterest(address user) internal {
        // noop: index accrual is global; this keeps slot updated for user on state changes
        if (userIndex[user] == 0) {
            userIndex[user] = interestIndex;
        }
    }

    function _ltv(uint256 collateral, uint256 _debt) internal view returns (uint256) {
        if (collateral == 0) return type(uint256).max;
        uint256 collateralUsd = collateral;
        if (address(oracle) != address(0) && collateralToken != address(0)) {
            (uint256 price, ) = oracle.getPrice(collateralToken);
            collateralUsd = (collateral * price) / 1e18;
        }
        return (_debt * 10_000) / collateralUsd;
    }
}


