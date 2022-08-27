// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

import "../LiquidityTools.sol";

contract LiquidityToolsMock {

    function squareX96(uint160 x96) public pure returns (uint256 result) {
        return LiquidityTools.squareX96(x96);
    }

    function calculateHighestLiquidity(
        uint160 sqrtExchangePriceX96,
        uint160 sqrtPoolPriceX96,
        uint160 sqrtPriceLowerX96, 
        uint160 sqrtPriceUpperX96,
        uint256 amountTokenA,
        uint256 amountTokenB
    ) public pure returns (uint128 liquidity) {
        return LiquidityTools.calculateHighestLiquidity(
            sqrtExchangePriceX96,
            sqrtPoolPriceX96,
            sqrtPriceLowerX96, 
            sqrtPriceUpperX96,
            amountTokenA,
            amountTokenB
        );
    }
}