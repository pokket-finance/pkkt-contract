import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "hardhat-contract-sizer";
import "hardhat-log-remover";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@openzeppelin/hardhat-upgrades";
import "solidity-coverage";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";
import exportDeployments from "./scripts/tasks/exportDeployments";
import proposeUpgrade from "./scripts/tasks/proposeUpgrade";
import upgradeTo from "./scripts/tasks/upgradeTo";
import deployDummyContracts from "./scripts/tasks/backend/deployDummyContracts";
import generateSubgraphManifest from "./scripts/tasks/backend/generateSubgraphManifest";
import initializeUsers from "./scripts/tasks/backend/initializeUsers";
import generateOptionData from "./scripts/tasks/backend/generateOptionData";
import sendUserCoins from "./scripts/tasks/backend/sendUserCoins";
import transferOwnerShip from './scripts/tasks/transferOwnerShip';
import verifyContracts from './scripts/tasks/verifyContracts';

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
        blockNumber: 13600000, 
        accounts: [`0x${process.env.MAINNET_PRIVATE_KEY}`],
      } 
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`, 
      accounts:[`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      gas: 2100000,
      accounts:[`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      gas: 2100000,
      gasPrice: 100000000000,
      accounts: { mnemonic: process.env.DEPLOYER_PRIVATE_KEY },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: "0x4EF10084EB9541EbE1d0Ed060Cdc87C37a850E8B",
      3: "0x4EF10084EB9541EbE1d0Ed060Cdc87C37a850E8B", //ropsten
      4: "0x4EF10084EB9541EbE1d0Ed060Cdc87C37a850E8B"
    },
    settler: {
      default: 1,
      3: "0x7FAa46FB04BB00de3F6D5E90d78b4a37f8E48cd4",
      4: "0x7FAa46FB04BB00de3F6D5E90d78b4a37f8E48cd4"
    },
    alice: {
      default: 2, 
    },
    bob: {
      default: 3, 
    },
    owner: {
      default: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      1: "0x0B1983a488Bcad8f16AaDa89BEd47CdCa4eECB42",
      3: "0x0B1983a488Bcad8f16AaDa89BEd47CdCa4eECB42",
      4: "0x4EF10084EB9541EbE1d0Ed060Cdc87C37a850E8B"
    },
    trader: { 
      default: 4, 
    }
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    //coinmarketcap: process.env.COINMARKETCAP_API_KEY,
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
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
      console.log(await account.getAddress());
  }
});
task("export-deployments", "Exports deployments into JSON", exportDeployments);

task("transfer-ownership", "Transfer ownership of PKKTHodlBoosterOption from initial deployer to another account", transferOwnerShip)
.addParam("owneraccount", "The account of new owner, take, a gnosis-safe account");


task("verify-contracts", "Verify solidity source", verifyContracts);


task("propose-upgrade", "Proposes the new implementation for upgrade to gnosis safe for approval", proposeUpgrade)
  .addParam("proxyname", "name of proxy in ./deployments")
  .addParam("implname", "name of new implementation contract")
  .addParam("libraryname", "Name of the library deploy with contract");

task("upgrade-to", "Upgrades the proxy with the new implementation contract", upgradeTo)
  .addParam("proxyname", "name of proxy in ./deployments")
  .addParam("implname", "name of new implementation contract")
  .addParam("libraryname", "Name of the library to deploy with contract");

task("deploy-dummy-contracts", "Deploys contracts to allow backend interaction", deployDummyContracts)
  .addFlag("fresh", "If set, deletes the existing network deployments folder")
  .addFlag("init", "If set, init the first round")
  .addOptionalParam("initbackend", "If set, initializes the backend");

task("initialize-dummy-users", "Initializes Alice and Bob to interact with deployed dummy contracts", initializeUsers)
task("send-coins", "Send test coins to specific address", sendUserCoins)
.addParam("target", "target address");

task("generate-dummy-data", "Generates dummy option data for various purposes", generateOptionData)
  .addParam("command", "number of the command you want to generate data");

task("generate-subgraph-manifest", "Adds necessary information to the subgraph manifest (subgraph.yaml)", generateSubgraphManifest)
  .addOptionalParam("startBlock", "startblock for subgraph to begin indexing at, does not need to be set for local network");
