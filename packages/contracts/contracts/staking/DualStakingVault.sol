// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Roles} from "../access/Roles.sol";

contract DualStakingVault is Roles {
    IERC20 public immutable asset;
    uint256 public rewardsIndex = 1e18;
    mapping(address => uint256) public shares;
    uint256 public totalShares;

    event Stake(address indexed user, uint256 assets, uint256 shares);
    event Unstake(address indexed user, uint256 assets, uint256 shares);
    event Compound(uint256 rewards, uint256 newIndex);

    constructor(address admin, IERC20 _asset) Roles(admin) { asset = _asset; }

    function deposit(uint256 assets) external returns (uint256 out) {
        asset.transferFrom(msg.sender, address(this), assets);
        out = assets; // 1:1 for mock
        shares[msg.sender] += out; totalShares += out;
        emit Stake(msg.sender, assets, out);
    }

    function withdraw(uint256 assets) external returns (uint256 burned) {
        burned = assets; // 1:1 for mock
        require(shares[msg.sender] >= burned, "shares");
        shares[msg.sender] -= burned; totalShares -= burned;
        asset.transfer(msg.sender, assets);
        emit Unstake(msg.sender, assets, burned);
    }

    function compound() external onlyRole(ROLE_KEEPER) {
        // For mock: increase index by 0.1%
        uint256 rewards = (rewardsIndex * 10) / 10_000;
        rewardsIndex += rewards;
        emit Compound(rewards, rewardsIndex);
    }
}


