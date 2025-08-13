// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library SafeCastPlus {
    function toUint128(uint256 x) internal pure returns (uint128) {
        require(x <= type(uint128).max, 'Overflow');
        return uint128(x);
    }

    function toUint64(uint256 x) internal pure returns (uint64) {
        require(x <= type(uint64).max, 'Overflow');
        return uint64(x);
    }
}


