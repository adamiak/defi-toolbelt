import { BigNumber } from "bignumber.js";
import { Assertion } from "chai";

Assertion.addMethod("lessOrEqualThanBigNumber", function (expected: BigNumber) {
  const actual = new BigNumber(this._obj);
  this.assert(
    actual.lte(expected),
    'expected #{act} to be less than or equal to #{exp}',
    'expected #{act} to be greater than #{exp}',
    expected.toFixed(),
    actual.toFixed() 
  );
});

declare global {
    export namespace Chai {
        interface Assertion {
            lessOrEqualThanBigNumber(v: BigNumber): Promise<void>;
        }
    }
}
