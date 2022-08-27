// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol';
import '@uniswap/v3-periphery/contracts/interfaces/external/IWETH9.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol';

import 'defi-toolbelt/LiquidityTools.sol';

contract SimpleLP {
    ISwapRouter public constant swapRouter = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IUniswapV3Factory public constant uniswapV3Factory = IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

    IWETH9 public WETH = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    IERC20 public DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);

    /// @dev for simplicity, all error checks are omitted
    function mintPosition() {

        // 1. Get pool address
        uint24 poolFee = 500;
        address pool = uniswapV3Factory.getPool(address(DAI), address(WETH), poolFee);

        // 2. Fetch current price in the pool (in relation to stablecoin) 
        //    - this call actually returns it's sqrt in Q96 format.
        (uint160 sqrtPriceX96, , , , , , ) = IUniswapV3Pool(pool).slot0();

        // 3. Calculate maximum liquidity that can be added to the pool 
        // in desired range using owned token amounts

        // Desired range is $1000-$5000, so 0.0002-0.001 in terms of DAI-ETH
        uint160 sqrtPriceLowerX96 = 1120455419495722814493687808 // in js: Math.sqrt(0.0002) * (2 ** 96)
        uint160 sqrtPriceUpperX96 = 2505414483750479155158843392 // in js: Math.sqrt(0.001) * (2 ** 96)

        // Owned amounts of tokens
        uint256 ownedAmountDAI = 5000 ether; // $5000 (ether decimals = DAI decimals)
        uint256 ownedAmountWETH = 10 ether;

        uint128 liquidity = LiquidityTools.calculateHighestLiquidity(
            sqrtPriceX96, // assume that exchange price is the same as the pool price 
                          // (i.e. the pool will be used to rebalance tokens)
            sqrtPriceX96,
            sqrtPriceLowerX96,
            sqrtPriceUpperX96,
            ownedAmountDAI,
            ownedAmountWETH
        )

        // 4. From the liquidity derive the required amounts of tokens
        //    - we are guaranteed that these amounts can be obtained
        //    - by performing exchange of our tokens using sqrtPriceX96 

        (uint256 requiredAmountDAI, uint256 requiredAmountUSDC) = LiquidityAmounts.getAmountsForLiquidity(
            sqrtPriceX96, sqrtPriceLowerX96, sqrtPriceUpperX96, liquidity
        );

        // 5. Perform the token swap
        // see: https://docs.uniswap.org/protocol/guides/swaps/single-swaps

        // 6. Provide the liquidity to the pool
        // see: https://docs.uniswap.org/protocol/guides/providing-liquidity/mint-a-position
    }
}