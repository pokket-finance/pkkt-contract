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
import sendUserCoins from "./scripts/tasks/sendUserCoins";
import transferOwnerShip from './scripts/tasks/transferOwnerShip'; 
import prepareAccounts from './scripts/tasks/prepareAccounts';
import initiateSettlement from './scripts/tasks/initiateSettlement';
import setSettler from './scripts/tasks/setSettler';
import configureEmail from './scripts/tasks/configureEmail';

dotenv.config();
 
let data = require(process.env.CONFIG_FILE as string); 
var accounts = data.deployerPrivateKey ? 
[`0x${data.deployerPrivateKey}`] : {
  mnemonic: "test test test test test test test test test test test junk",
};
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
        accounts: accounts,
      } 
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`, 
      accounts: accounts,
      chainId: 1
    },
    ropsten: {
      url: process.env.ROPSTEN_RPC_URL || `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      gas: 2100000, 
      accounts: accounts,
      gasPrice: 20e9,
      chainId: 3
    }, 
    bsctest: { 
      url: process.env.BSCTEST_RPC_URL || `https://data-seed-prebsc-1-s1.binance.org:8545`,
      gas: 2100000,
      gasPrice: 20e9,
      accounts: accounts,
      chainId: 97
    },
    bsc: { 
      url: process.env.BSC_RPC_URL || `https://bsc-dataseed.binance.org`,
      gas: 2100000,
      gasPrice: 5e9,
      accounts: accounts,
      chainId: 56
    }
  },
  namedAccounts: {
    deployer: {
      default: data.deployerAddress || 0,
      //ropsten
      3: data.deployerAddress || 0,
      //main
      1: data.deployerAddress || 0,
      //bscmain
      56: data.deployerAddress || 0,
      //bsctest
      97: data.deployerAddress || 0
    },
    owner: { 
      default: data.ownerAddress || 1,
    },
    manager: { 
      default: data.settlerAddress || 2,
    },
    admin : {
      default: 3,
      //bscmain
      56: data.adminAddress || 3,
      //bsctest
      97: data.adminAddress || 3
      
    },
    alice: {
      default: 4, 
    },
    bob: {
      default: 5, 
    },
    trader: { 
      default: 6, 
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

/*task("prepare-accounts", "Prepare accounts", prepareAccounts)
.addFlag("forcesettlerkey", "If set, settler private key must be input if missing");
task("transfer-ownership", "Transfer ownership of PKKTHodlBoosterOption from initial deployer to another account", transferOwnerShip);

task("new-epoch", "Initiate a new epoch", initiateSettlement);
 
task("propose-upgrade", "Proposes the new implementation for upgrade to gnosis safe for approval", proposeUpgrade)
  .addParam("proxyname", "name of proxy in ./deployments")
  .addParam("implname", "name of new implementation contract")
  .addParam("libraryname", "Name of the library deploy with contract");

task("upgrade-to", "Upgrades the proxy with the new implementation contract", upgradeTo)
  .addParam("proxyname", "name of proxy in ./deployments")
  .addParam("implname", "name of new implementation contract")
  .addParam("libraryname", "Name of the library to deploy with contract");


task("send-coins", "Send test coins to specific address", sendUserCoins)
.addParam("target", "target address");

task("set-settler", "Reset the settler", setSettler);
task("configure-email", "Configure the email server", configureEmail);*/
