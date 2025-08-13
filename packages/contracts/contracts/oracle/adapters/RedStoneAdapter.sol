// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IOracle} from "../../interfaces/IOracle.sol";
import {Roles} from "../../access/Roles.sol";

contract RedStoneAdapter is IOracle, Roles {
    struct PriceData { uint256 price; uint256 updatedAt; }
    mapping(address => PriceData) public prices;

    constructor(address admin) Roles(admin) {}

    function pushPrice(address token, uint256 price, uint256 updatedAt) external onlyRole(ROLE_ORACLE) {
        prices[token] = PriceData({price: price, updatedAt: updatedAt});
    }

    function getPrice(address token) external view returns (uint256 price, uint256 updatedAt) {
        PriceData memory d = prices[token];
        return (d.price, d.updatedAt);
    }
}


