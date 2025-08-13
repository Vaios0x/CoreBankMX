// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Roles} from "../access/Roles.sol";

/// @title FeeController
/// @notice Gestiona tarifas de originación e intercambio y descuentos para cuentas "pro".
contract FeeController is Roles {
    /// @dev tarifas en basis points (bps)
    uint256 public originationFeeBps = 100; // 1.00%
    uint256 public exchangeFeeBps = 20; // 0.20% (placeholder para futuros usos)
    uint256 public proDiscountBps = 50; // 0.50% de descuento

    /// @dev mínimo de monto para aplicar originación (en unidades del activo de deuda)
    uint256 public minBorrowAmount; // configurable

    /// @dev cobrador de fees
    address public feeCollector;

    mapping(address => bool) public isPro;

    event UpdateFees(uint256 originationFeeBps, uint256 exchangeFeeBps, uint256 proDiscountBps);
    event UpdateCollector(address indexed collector);
    event UpdateMinBorrow(uint256 amount);
    event SetPro(address indexed user, bool pro);

    constructor(address admin, address _collector, uint256 _minBorrowAmount) Roles(admin) {
        feeCollector = _collector;
        minBorrowAmount = _minBorrowAmount;
    }

    function setFees(uint256 _originationFeeBps, uint256 _exchangeFeeBps, uint256 _proDiscountBps) external onlyRole(ROLE_RISK) {
        require(_originationFeeBps <= 500 && _exchangeFeeBps <= 200 && _proDiscountBps <= 200, "fees");
        originationFeeBps = _originationFeeBps;
        exchangeFeeBps = _exchangeFeeBps;
        proDiscountBps = _proDiscountBps;
        emit UpdateFees(originationFeeBps, exchangeFeeBps, proDiscountBps);
    }

    function setCollector(address _collector) external onlyRole(ROLE_ADMIN) {
        require(_collector != address(0), "collector");
        feeCollector = _collector;
        emit UpdateCollector(_collector);
    }

    function setMinBorrow(uint256 amount) external onlyRole(ROLE_RISK) {
        minBorrowAmount = amount;
        emit UpdateMinBorrow(amount);
    }

    function setPro(address user, bool pro) external onlyRole(ROLE_ADMIN) {
        isPro[user] = pro;
        emit SetPro(user, pro);
    }

    /// @notice Calcula el fee de originación neto para un usuario y monto.
    function getBorrowFee(address user, uint256 amount) external view returns (uint256 fee, address collector) {
        uint256 bps = originationFeeBps;
        if (isPro[user]) {
            if (bps > proDiscountBps) bps -= proDiscountBps; else bps = 0;
        }
        fee = (amount * bps) / 10_000;
        collector = feeCollector;
    }
}


