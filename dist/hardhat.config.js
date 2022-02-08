"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("hardhat/config");
require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-log-remover");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");
require("solidity-coverage");
require("@typechain/hardhat");
require("hardhat-gas-reporter");
const dotenv = __importStar(require("dotenv"));
const exportDeployments_1 = __importDefault(require("./scripts/tasks/exportDeployments"));
const proposeUpgrade_1 = __importDefault(require("./scripts/tasks/proposeUpgrade"));
const upgradeTo_1 = __importDefault(require("./scripts/tasks/upgradeTo"));
const deployDummyContracts_1 = __importDefault(require("./scripts/tasks/backend/deployDummyContracts"));
const generateSubgraphManifest_1 = __importDefault(require("./scripts/tasks/backend/generateSubgraphManifest"));
const initializeUsers_1 = __importDefault(require("./scripts/tasks/backend/initializeUsers"));
const generateOptionData_1 = __importDefault(require("./scripts/tasks/backend/generateOptionData"));
const sendUserCoins_1 = __importDefault(require("./scripts/tasks/backend/sendUserCoins"));
const transferOwnerShip_1 = __importDefault(require("./scripts/tasks/transferOwnerShip"));
const verifyContracts_1 = __importDefault(require("./scripts/tasks/verifyContracts"));
const prepareAccounts_1 = __importDefault(require("./scripts/tasks/prepareAccounts"));
const initiateSettlement_1 = __importDefault(require("./scripts/tasks/initiateSettlement"));
dotenv.config();
let data = require(process.env.CONFIG_FILE);
var accounts = data.deployerPrivateKey ?
    [`0x${data.deployerPrivateKey}`] : {
    mnemonic: "test test test test test test test test test test test junk",
};
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
exports.default = {
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
        },
        ropsten: {
            url: (_a = process.env.ROPSTEN_RPC_URL) !== null && _a !== void 0 ? _a : `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            gas: 2100000,
            accounts: accounts,
            gasPrice: 20e9,
        },
        rinkeby: {
            url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            gas: 2100000,
            gasPrice: 100000000000,
            accounts: accounts,
        },
    },
    namedAccounts: {
        deployer: {
            default: data.deployerAddress ? data.deployerAddress : 0,
            3: data.deployerAddress ? data.deployerAddress : 0,
            1: data.deployerAddress ? data.deployerAddress : 0,
        },
        settler: {
            default: data.settlerAddress ? data.settlerAddress : 1,
        },
        alice: {
            default: 2,
        },
        bob: {
            default: 3,
        },
        owner: {
            default: 4
        },
        trader: {
            default: 5,
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
(0, config_1.task)("accounts", "Prints the list of accounts", async (args, hre) => {
    const accounts = await hre.ethers.getSigners();
    for (const account of accounts) {
        console.log(await account.getAddress());
    }
});
(0, config_1.task)("export-deployments", "Exports deployments into JSON", exportDeployments_1.default);
(0, config_1.task)("prepare-accounts", "Prepare accounts", prepareAccounts_1.default)
    .addFlag("forcesettlerkey", "If set, settler private key must be input if missing");
(0, config_1.task)("transfer-ownership", "Transfer ownership of PKKTHodlBoosterOption from initial deployer to another account", transferOwnerShip_1.default);
(0, config_1.task)("new-epoch", "Initiate a new epoch", initiateSettlement_1.default);
(0, config_1.task)("verify-contracts", "Verify solidity source", verifyContracts_1.default);
(0, config_1.task)("propose-upgrade", "Proposes the new implementation for upgrade to gnosis safe for approval", proposeUpgrade_1.default)
    .addParam("proxyname", "name of proxy in ./deployments")
    .addParam("implname", "name of new implementation contract")
    .addParam("libraryname", "Name of the library deploy with contract");
(0, config_1.task)("upgrade-to", "Upgrades the proxy with the new implementation contract", upgradeTo_1.default)
    .addParam("proxyname", "name of proxy in ./deployments")
    .addParam("implname", "name of new implementation contract")
    .addParam("libraryname", "Name of the library to deploy with contract");
(0, config_1.task)("deploy-dummy-contracts", "Deploys contracts to allow backend interaction", deployDummyContracts_1.default)
    .addFlag("fresh", "If set, deletes the existing network deployments folder")
    .addFlag("init", "If set, init the first round")
    .addOptionalParam("initbackend", "If set, initializes the backend");
(0, config_1.task)("initialize-dummy-users", "Initializes Alice and Bob to interact with deployed dummy contracts", initializeUsers_1.default);
(0, config_1.task)("send-coins", "Send test coins to specific address", sendUserCoins_1.default)
    .addParam("target", "target address");
(0, config_1.task)("generate-dummy-data", "Generates dummy option data for various purposes", generateOptionData_1.default)
    .addParam("command", "number of the command you want to generate data");
(0, config_1.task)("generate-subgraph-manifest", "Adds necessary information to the subgraph manifest (subgraph.yaml)", generateSubgraphManifest_1.default)
    .addOptionalParam("startBlock", "startblock for subgraph to begin indexing at, does not need to be set for local network");
