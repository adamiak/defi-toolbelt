import { BigNumber } from "bignumber.js";

export function liquidityForAmount0(priceLower: BigNumber, priceUpper: BigNumber, amount0: BigNumber): BigNumber {
  const sqrtA = priceLower.sqrt();
  const sqrtB = priceUpper.sqrt();
  return (
    amount0.times(sqrtA).times(sqrtB)           // amount0 * sqrtA * sqrtB
  ).dividedBy(                                  //            /
    sqrtB.minus(sqrtA)                          //      sqrtB - sqrtA
  ).decimalPlaces(0, BigNumber.ROUND_DOWN);
}

export function liquidityForAmount1(priceLower: BigNumber, priceUpper: BigNumber, amount1: BigNumber): BigNumber {
  const sqrtA = priceLower.sqrt();
  const sqrtB = priceUpper.sqrt();
  return amount1.dividedBy(sqrtB.minus(sqrtA))  // amount1 * (sqrtB - sqrtA)
    .decimalPlaces(0, BigNumber.ROUND_DOWN);
}

export function amount0ForLiquidity(priceLower: BigNumber, priceUpper: BigNumber, liquidity: BigNumber): BigNumber {
  const sqrtA = priceLower.sqrt();
  const sqrtB = priceUpper.sqrt();
  return (
    liquidity.times(sqrtB.minus(sqrtA))         // liquidity * (sqrtB - sqrtA)
  ).dividedBy(                                  //            /
    sqrtA.times(sqrtB)                          //      sqrtA * sqrtB
  ).decimalPlaces(0, BigNumber.ROUND_DOWN);
}

export function amount1ForLiquidity(priceLower: BigNumber, priceUpper: BigNumber, liquidity: BigNumber): BigNumber {
  const sqrtA = priceLower.sqrt();
  const sqrtB = priceUpper.sqrt();
  return liquidity.times(sqrtB.minus(sqrtA))    // liquidity * (sqrtB - sqrtA)
    .decimalPlaces(0, BigNumber.ROUND_DOWN);
}

export function amountsForLiquidity(price: BigNumber, priceLower: BigNumber, priceUpper: BigNumber, liquidity: BigNumber): BigNumber[] {
  let amount0 = new BigNumber(0);
  let amount1 = new BigNumber(0);

  if (price.lte(priceLower)) {
      amount0 = amount0ForLiquidity(priceLower, priceUpper, liquidity);
  } else if (price.lt(priceUpper)) {
      amount0 = amount0ForLiquidity(price, priceUpper, liquidity);
      amount1 = amount1ForLiquidity(priceLower, price, liquidity);
  } else {
      amount1 = amount1ForLiquidity(priceLower, priceUpper, liquidity);
  }
  return [amount0, amount1];
}