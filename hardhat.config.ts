import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-docgen";

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  docgen: {
    exclude: [ 'utils', 'mocks' ]
  }
};

export default config;
