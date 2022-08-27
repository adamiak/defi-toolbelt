// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

import '@openzeppelin/contracts/math/SafeMath.sol';
import './utils/FullMath.sol';

library LiquidityTools {
    using SafeMath for uint256;
    /// @dev Value representing 2^96, used internally for calculations
    uint256 private constant Q96 = 0x1000000000000000000000000;

    /// @notice Calculate the highest liquidity that can be provided to a concentrated liquidity pool
    ///     (think Uniswap v3) using owned tokens. The code will rebalance the tokens (using exchange price)
    ///     to obtain correct proportions for the pool (price and range).
    /// @dev Internal calculations use floating point numbers in Q96 format.
    ///     Rather than passing values themselves, their square root is required,
    ///     both to save gas, and because Uniswap returns them this way.
    /// @param sqrtExchangePriceX96  Sqrt of exchange price (in Q96 format) that
    ///     can be used to swap tokens if rebalance is needed. Usually the same as
    ///     `sqrtPoolPriceX96` (when pool that liquidity will be provided to is also
    ///     used for prior exchange).
    /// @param sqrtPoolPriceX96 Sqrt of the current pool price (in Q96 format)
    /// @param sqrtPriceLowerX96 Sqrt of the lower price of LP range (in Q96 format) 
    /// @param sqrtPriceUpperX96 Sqrt of the upper price of LP range (in Q96 format) 
    /// @param amountTokenA Currently owned amount of the base token
    /// @param amountTokenB Currently owned amount of the quote token
    /// @return liquidity Calculated liquidity
    function calculateHighestLiquidity(
        uint160 sqrtExchangePriceX96,
        uint160 sqrtPoolPriceX96,
        uint160 sqrtPriceLowerX96, 
        uint160 sqrtPriceUpperX96,
        uint256 amountTokenA,
        uint256 amountTokenB 
    ) internal pure returns (uint128 liquidity) {
        // Price bands can't be equal, it would lead to division by zero.
        require(sqrtPriceLowerX96 < sqrtPriceUpperX96, "Wrong price bands");

        // 1. Calculate total balance expressed in tokenB.

        uint256 exchangePriceX96 = squareX96(sqrtExchangePriceX96); // exchangePrice = tokenB / tokenA
        uint256 exchangedTokenA = FullMath.mulDiv(amountTokenA, exchangePriceX96, Q96); 
        uint256 totalBalanceInTokenB = amountTokenB.add(exchangedTokenA);

        // 2. Calculate liquidity at current pool price that would yield that balance
        //    (if amount of tokenA in the pool was exchanged using provided exchangePrice).

        uint256 sqrtPriceX96 = (
            sqrtPoolPriceX96 > sqrtPriceUpperX96 ? sqrtPriceUpperX96 : 
            sqrtPoolPriceX96 < sqrtPriceLowerX96 ? sqrtPriceLowerX96 :
            sqrtPoolPriceX96
        );
        uint256 intermediate = FullMath.mulDiv(sqrtPriceUpperX96 - sqrtPriceX96, Q96, sqrtPriceUpperX96);
        // multiplication by exchangePrice as it may differ from poolPrice:
        uint256 factor0 = FullMath.mulDiv(exchangePriceX96, intermediate, sqrtPriceX96);
        uint256 factor1 = sqrtPriceX96 - sqrtPriceLowerX96;
        liquidity = toUint128(
            FullMath.mulDiv(totalBalanceInTokenB, Q96, factor0.add(factor1))
        );
    }

    /// @notice Calculates a square (x*x) of a number passed in Q96 format
    /// @dev This function never overflows.
    /// @param x96 Floating point value in Q96 format
    /// @return resX96 Square of `x96` in Q96 format
    function squareX96(uint160 x96) internal pure returns (uint256 resX96) {
        resX96 = FullMath.mulDiv(x96, x96, Q96);
    }

    /// @notice Safely downcasts uint256 to uint128
    /// @dev Throws if cast would overflow
    /// @param x The uint256 to be downcasted
    /// @return y The passed value, downcasted to uint128
    function toUint128(uint256 x) internal pure returns (uint128 y) {
        require((y = uint128(x)) == x, "Casting to uint128 overflown");
    }
}
