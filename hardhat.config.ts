import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "hardhat-log-remover";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import exportDeployments from "./scripts/tasks/exportDeployments";

dotenv.config();  
  

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 export default {
  paths: {
    deploy: "scripts/deploy",
    deployments: "deployments",
  }, 
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
        gasLimit: 8e6,
        blockNumber: 12570201, 
        accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
      } 
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`, 
      accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`, 
      accounts: [`0x${process.env.ROPSTEN_PRIVATE_KEY}`],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: "0xf9C2085C9601dd5D4F06762F94C31D0F8c419329",
      3: "0xf9C2085C9601dd5D4F06762F94C31D0F8c419329",
    },
    owner: {
      default: 0,
      1: "0x0B1983a488Bcad8f16AaDa89BEd47CdCa4eECB42",
      3: "0x0B1983a488Bcad8f16AaDa89BEd47CdCa4eECB42",
    }
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    enabled: process.env.REPORT_GAS === "true",
  },
  mocha: {
    timeout: 500000,
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        runs: 200,
        enabled: true,
      },
    },
  },
};

task("export-deployments", "Exports deployments into JSON", exportDeployments);
