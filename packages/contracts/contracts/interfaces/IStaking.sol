// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IStaking {
    event Stake(address indexed user, uint256 assets, uint256 shares);
    event Unstake(address indexed user, uint256 assets, uint256 shares);
    event Compound(uint256 rewards, uint256 newIndex);

    function deposit(uint256 assets) external returns (uint256 shares);
    function withdraw(uint256 assets) external returns (uint256 shares);
    function compound() external;
}


