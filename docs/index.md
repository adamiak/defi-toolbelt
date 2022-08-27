# Solidity API

## LiquidityTools

### Q96

```solidity
uint256 Q96
```

_Value representing 2^96, used internally for calculations_

### calculateHighestLiquidity

```solidity
function calculateHighestLiquidity(uint160 sqrtExchangePriceX96, uint160 sqrtPoolPriceX96, uint160 sqrtPriceLowerX96, uint160 sqrtPriceUpperX96, uint256 amountTokenA, uint256 amountTokenB) internal pure returns (uint128 liquidity)
```

Calculate the highest liquidity that can be provided to a concentrated liquidity pool
    (think Uniswap v3) using owned tokens. The code will rebalance the tokens (using exchange price)
    to obtain correct proportions for the pool (price and range).

_Internal calculations use floating point numbers in Q96 format.
    Rather than passing values themselves, their square root is required,
    both to save gas, and because Uniswap returns them this way._

| Name | Type | Description |
| ---- | ---- | ----------- |
| sqrtExchangePriceX96 | uint160 | Sqrt of exchange price (in Q96 format) that     can be used to swap tokens if rebalance is needed. Usually the same as     `sqrtPoolPriceX96` (when pool that liquidity will be provided to is also     used for prior exchange). |
| sqrtPoolPriceX96 | uint160 | Sqrt of the current pool price (in Q96 format) |
| sqrtPriceLowerX96 | uint160 | Sqrt of the lower price of LP range (in Q96 format) |
| sqrtPriceUpperX96 | uint160 | Sqrt of the upper price of LP range (in Q96 format) |
| amountTokenA | uint256 | Currently owned amount of the base token |
| amountTokenB | uint256 | Currently owned amount of the quote token |

| Name | Type | Description |
| ---- | ---- | ----------- |
| liquidity | uint128 | Calculated liquidity |

### squareX96

```solidity
function squareX96(uint160 x96) internal pure returns (uint256 resX96)
```

Calculates a square (x*x) of a number passed in Q96 format

_This function never overflows._

| Name | Type | Description |
| ---- | ---- | ----------- |
| x96 | uint160 | Floating point value in Q96 format |

| Name | Type | Description |
| ---- | ---- | ----------- |
| resX96 | uint256 | Square of `x96` in Q96 format |

### toUint128

```solidity
function toUint128(uint256 x) internal pure returns (uint128 y)
```

Safely downcasts uint256 to uint128

_Throws if cast would overflow_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | uint256 | The uint256 to be downcasted |

| Name | Type | Description |
| ---- | ---- | ----------- |
| y | uint128 | The passed value, downcasted to uint128 |

