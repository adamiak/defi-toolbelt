// BigNumber is used because bigint doesn't support decimals
import { BigNumber } from "bignumber.js";

BigNumber.set({ 
  DECIMAL_PLACES: 30, 
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  RANGE: 500
});

const Q96 = bn(2).pow(96);

// Used to pass upper price band (so that sqrt gives max uint160 as X96 decimal)
export const MaxUint64squared: BigNumber = bn(2).pow(160-96).minus(1).pow(2);

// sqrt without losing decimals
export function sqrt(v: bigint | number): BigNumber {
  return new BigNumber(v.toString()).sqrt();
}

// Constructing BigNumber:

export function bn(v: BigNumber | string | number): BigNumber {
  return new BigNumber(v);
}

export function bnX96(v: BigNumber | string | number): BigNumber {
  return bn(v).times(Q96);
}

// Constructing bigint:

// NOTICE: drops decimals
export function bi(v: BigNumber): bigint {
  return BigInt(v.toFixed(0));
}

// NOTICE: drops decimals over Q96
export function biX96(v: BigNumber | string | number): bigint {
  return BigInt(bnX96(v).toFixed(0));
}
