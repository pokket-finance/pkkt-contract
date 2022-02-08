"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const ethers_1 = require("ethers");
const constants_1 = require("../../../constants/constants");
const utilities_1 = require("./utilities");
const initializeUsers_1 = __importDefault(require("./initializeUsers"));
const generateOptionData_1 = __importDefault(require("./generateOptionData"));
const main = async ({ fresh, init, initbackend }, { network, ethers, deployments, getNamedAccounts }) => {
    const { deploy } = await deployments;
    const [deployerSigner, settlerSigner] = await ethers.getSigners();
    const { deployer, settler } = await getNamedAccounts();
    if (fresh) {
        const dir = `./deployments/${network.name}`;
        await removeDirectory(dir);
    }
    await deployContracts(deployer, settler, deploy, ethers);
    if (init) {
        const optionVault = await (0, utilities_1.getDeployedContractHelper)("PKKTHodlBoosterOption", ethers, deployments);
        await optionVault.connect(settlerSigner).initiateSettlement();
        console.log("Initialized the current round to :" + (await (await optionVault.currentRound()).toString()));
    }
    if (initbackend) {
        await (0, initializeUsers_1.default)([], { ethers, deployments, getNamedAccounts });
        await (0, generateOptionData_1.default)({ command: initbackend }, { ethers, deployments, getNamedAccounts });
    }
    // For testing stalled transactions
    // await network.provider.send("evm_setAutomine", [false]);
    // await network.provider.send("evm_setIntervalMining", [0]);
};
// Remove the given directory
const removeDirectory = async (dir) => {
    try {
        await promises_1.default.rmdir(dir, { recursive: true });
        console.log(`${dir} removed`);
    }
    catch (err) {
        console.error(err);
    }
};
// Deploy the initial contracts
const deployContracts = async (deployer, settler, deploy, ethers) => {
    const USDC = await deploy("USDC", {
        contract: "ERC20Mock",
        from: deployer,
        args: [
            "USDCToken",
            "USDC",
            ethers_1.BigNumber.from(10000000).mul(constants_1.USDC_MULTIPLIER),
            constants_1.USDC_DECIMALS,
        ],
    });
    console.log("Deployed USDC at " + USDC.address);
    const WBTC = await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer,
        args: [
            "Wrapped BTC",
            "WBTC",
            ethers_1.BigNumber.from(100000).mul(constants_1.WBTC_MULTIPLIER),
            constants_1.WBTC_DECIMALS
        ],
    });
    console.log("Deployed WBTC at " + WBTC.address);
    const optionLifecycle = await deploy("OptionLifecycle", {
        from: deployer,
    });
    const optionVault = await deploy("PKKTHodlBoosterOption", {
        from: deployer,
        args: [settler, [
                {
                    depositAssetAmountDecimals: constants_1.ETH_DECIMALS,
                    counterPartyAssetAmountDecimals: constants_1.USDT_DECIMALS,
                    depositAsset: constants_1.NULL_ADDRESS,
                    counterPartyAsset: USDC.address,
                    callOptionId: 0,
                    putOptionId: 0
                },
                {
                    depositAssetAmountDecimals: constants_1.WBTC_DECIMALS,
                    counterPartyAssetAmountDecimals: constants_1.USDT_DECIMALS,
                    depositAsset: WBTC.address,
                    counterPartyAsset: USDC.address,
                    callOptionId: 0,
                    putOptionId: 0
                }
            ]],
        contract: "PKKTHodlBoosterOption",
        libraries: {
            OptionLifecycle: optionLifecycle.address,
        }
    });
    console.log("Deployed Option Vault at " + optionVault.address);
};
exports.default = main;
