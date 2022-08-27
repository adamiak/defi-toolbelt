import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { LiquidityToolsMock } from "../typechain-types";
import { BigNumber } from "bignumber.js";
import { bn, bi, biX96, MaxUint64squared } from "./helpers/bigintHelpers";
import { amountsForLiquidity } from "./helpers/liquidityHelpers";
import "./helpers/bigNumberChaiMatcher";

const ERR_TOLERANCE = bn("0.0000000000001");

export function eth(v: string): BigNumber { 
  return bn(ethers.utils.parseEther(v).toString());
};

describe("LiquidityTools", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deploy() {
    const Toolbox = await ethers.getContractFactory("LiquidityToolsMock");
    const toolbox = await Toolbox.deploy();
    return { toolbox };
  }

  describe("squareX96", function () {
    it("Should correctly handle simple integers", async function () {
      const { toolbox } = await loadFixture(deploy);
      expect(await toolbox.squareX96(0)).to.equal(0);
      expect(await toolbox.squareX96(1n << 96n)).to.equal(1n << 96n);
      expect(await toolbox.squareX96(4n << 96n)).to.equal(16n << 96n);
    });

    it("Should correctly handle values with decimals", async function () {
      const { toolbox } = await loadFixture(deploy);
      expect(await toolbox.squareX96(biX96("123.456"))).to.be.approximately(biX96("15241.383936"), 100);
    });

    it("Should correctly handle MAX_UIN160", async function () {
      const { toolbox } = await loadFixture(deploy);
      const MAX_UINT160 = (1n << 160n) - 1n;
      expect(await toolbox.squareX96(MAX_UINT160)).to.equal((MAX_UINT160 ** 2n) >> 96n);
    });

    it("Should correctly handle small values < 1.0", async function () {
      const { toolbox } = await loadFixture(deploy);
      expect(await toolbox.squareX96(biX96("0.000005"))).to.equal(biX96("0.000000000025"));
    })
  });

  describe("calculateHighestLiquidity() success scenarios:", function () {

    // Test scenarios simulate ETH-USD pool (even though token names are irrelevant)
    // because it's easier to understand, as the pool price is simply the price of ETH in $.

    // Notice: most popular ETH-stable pools are actually USD-ETH (stable comes first, as base, not quote) 
    // due to Uniswap sorting the pair by token address.

    // The scenario checks if tested function can arrive at required liquidity, and returns relative error.

    async function calculateErrorForScenario(
      toolbox: LiquidityToolsMock, 
      priceLower: BigNumber, 
      priceUpper: BigNumber, 
      ethUsdPoolPrice: BigNumber,
      usdTokenBalanceFraction?: BigNumber,    // how much balance is initially in USD token (rest is in ETH token)
      ethUsdExchangePrice?: BigNumber
    ): Promise<BigNumber> {
      if (ethUsdExchangePrice === undefined) {
        ethUsdExchangePrice = ethUsdPoolPrice
      }
    
      // The liquidity we choose doesn't really matter, so an arbitrary value is used
      const liquidity = bn("1000000000000000000");

      // Calculate amounts of tokens we would have for that liquidity (this is reverse of what we're testing)
      const [amountEth, amountUsd] = amountsForLiquidity(ethUsdPoolPrice, priceLower, priceUpper, liquidity);

      // Rebalance amounts if required (for testing cases where initial token amounts are not optimal)
      let [rebalancedEth, rebalancedUsd] = [amountEth, amountUsd];
      if (usdTokenBalanceFraction !== undefined) {
        expect(usdTokenBalanceFraction.lte(1)).to.equal(true, "usdTokenFraction must be <= 1.0");
        expect(usdTokenBalanceFraction.gte(0)).to.equal(true, "usdTokenFraction must be >= 0");
        const totalValueInUsd = amountUsd.plus(amountEth.times(ethUsdExchangePrice));
        rebalancedUsd = totalValueInUsd.times(usdTokenBalanceFraction);
        rebalancedEth = totalValueInUsd.minus(rebalancedUsd).div(ethUsdExchangePrice);
      }
      
      let res = await toolbox.calculateHighestLiquidity(
        biX96(ethUsdExchangePrice.sqrt()),
        biX96(ethUsdPoolPrice.sqrt()),
        biX96(priceLower.sqrt()),
        biX96(priceUpper.sqrt()),
        bi(rebalancedEth),
        bi(rebalancedUsd)
      );

      const absDiff = bn(res.toString()).minus(liquidity).abs();
      const error = absDiff.div(liquidity);
      return error;
    }

    const boundsAndPrices: Array<[string, BigNumber, BigNumber, BigNumber]> = [
      ["Max range", bn(0), MaxUint64squared, bn(1000)],
      ["Price in range", bn(500), bn(1500), bn(1000)],
      ["Price in range (small values)", bn(0.005), bn(0.150), bn(0.010)],
      ["Price in range (large values)", bn(5 * (10**6)), bn(15 * (10**6)), bn(10 * (10**6))],
      ["Price below range", bn(500), bn(1500), bn(100)],
      ["Price above range", bn(500), bn(1500), bn(2000)]
    ]

    const usdTokenBalanceFractions: Array<[string, BigNumber|undefined]> = [
      ["optimal tokens balance", undefined],
      ["tokens split 50/50", bn("0.5")],
      ["only ETH balance", bn("0")],
      ["only USD balance", bn("1")]
    ]; 

    const exchangePrices: Array<[string, BigNumber|undefined]> = [
      ["exchange price is the same as pool price", undefined],
      ["exchange price 1", bn(1)],
      ["exchange price 1000", bn(1000)],
      ["exchange price 0.001", bn("0.001")]
    ]

    for (const [rangeDesc, priceLower, priceUpper, price] of boundsAndPrices) {
      for (const [balanceDesc, usdTokenBalanceFraction] of usdTokenBalanceFractions) {
        for (const [exchangeDesc, exchangePrice] of exchangePrices) {

          const description = [rangeDesc, balanceDesc, exchangeDesc].join(', ');

          it(description, async function () {
            const { toolbox } = await loadFixture(deploy);
            expect(
              await calculateErrorForScenario(toolbox, priceLower, priceUpper, price, usdTokenBalanceFraction, exchangePrice)
            ).to.be.lessOrEqualThanBigNumber(bn(ERR_TOLERANCE));
          });
        }
      }
    }
  });

  describe("calculateHighestLiquidity() failure scenarios:", function () {
  
    it("Should fail when priceLower == priceUpper", async function () {
      const { toolbox } = await loadFixture(deploy);
      const [priceLower, priceUpper, price] = [bn(500), bn(500), bn(100)];
      await expect(toolbox.calculateHighestLiquidity(
        biX96(price.sqrt()),
        biX96(price.sqrt()),
        biX96(priceLower.sqrt()),
        biX96(priceUpper.sqrt()),
        1000000000n,
        1000000000n
      )).to.be.revertedWith("Wrong price bands");
    });

    it("Should fail when priceLower > priceUpper", async function () {
      const { toolbox } = await loadFixture(deploy);
      const [priceLower, priceUpper, price] = [bn(1000), bn(500), bn(100)];
      await expect(toolbox.calculateHighestLiquidity(
        biX96(price.sqrt()),
        biX96(price.sqrt()),
        biX96(priceLower.sqrt()),
        biX96(priceUpper.sqrt()),
        1000000000n,
        1000000000n
      )).to.be.revertedWith("Wrong price bands");
    });

  });
});
