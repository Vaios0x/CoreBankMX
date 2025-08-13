// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IOracle} from "../interfaces/IOracle.sol";
import {Roles} from "../access/Roles.sol";

contract OracleRouter is Roles {
    uint256 public maxStaleness = 120; // seconds
    uint256 public maxDeviationBps = 150; // 1.5%

    IOracle public primary;
    IOracle public fallbackOracle;

    event UpdateLimits(uint256 staleness, uint256 deviationBps);
    event UpdateAdapters(address primary, address fallbackOracle);

    constructor(address admin, IOracle _primary, IOracle _fallback) Roles(admin) {
        primary = _primary;
        fallbackOracle = _fallback;
    }

    function setLimits(uint256 staleness, uint256 deviationBps) external onlyRole(ROLE_ORACLE) {
        require(deviationBps <= 10_000, "bad");
        maxStaleness = staleness;
        maxDeviationBps = deviationBps;
        emit UpdateLimits(staleness, deviationBps);
    }

    function setAdapters(IOracle _primary, IOracle _fallback) external onlyRole(ROLE_ORACLE) {
        primary = _primary;
        fallbackOracle = _fallback;
        emit UpdateAdapters(address(_primary), address(_fallback));
    }

    function getPrice(address token) external view returns (uint256 price, uint256 updatedAt) {
        (uint256 p1, uint256 t1) = primary.getPrice(token);
        (uint256 p2, uint256 t2) = fallbackOracle.getPrice(token);
        bool fresh1 = block.timestamp - t1 <= maxStaleness;
        bool fresh2 = block.timestamp - t2 <= maxStaleness;
        if (fresh1 && fresh2) {
            if (p1 == 0 && p2 == 0) revert("zero");
            if (p1 == 0) return (p2, t2);
            if (p2 == 0) return (p1, t1);
            uint256 dev = p1 > p2 ? ((p1 - p2) * 10_000) / p1 : ((p2 - p1) * 10_000) / p2;
            // Si la desviación excede el umbral, preferimos fallback
            if (dev > maxDeviationBps) {
                return (p2, t2);
            }
            return (p1, t1);
        }
        if (fresh1) return (p1, t1);
        require(fresh2, "stale");
        return (p2, t2);
    }
}


