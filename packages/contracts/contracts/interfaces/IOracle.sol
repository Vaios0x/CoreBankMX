// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOracle {
    error StalePrice();
    error ExcessiveDeviation();

    function getPrice(address token) external view returns (uint256 price, uint256 updatedAt);
}


