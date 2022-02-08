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
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants/constants");
const hardhat_1 = require("hardhat");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const main = async ({ network, deployments, getNamedAccounts, }) => {
    var _a;
    if (process.env.ONLY_HODLBOOSTER) {
        console.log("skip Deploying PKKTToken");
        return;
    }
    const { deploy } = deployments;
    console.log("02 - Deploying PKKTVault on", network.name);
    const { deployer, owner, trader } = await getNamedAccounts();
    const pkktToken = await deployments.get("PKKTToken");
    const vault = await deploy("Vault", {
        from: deployer,
    });
    const pkktVault = await deploy("PKKTVault", {
        from: deployer,
        proxy: {
            owner: owner,
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [
                    pkktToken.address,
                    process.env.PKKT_PER_BLOCK,
                    process.env.START_BLOCK,
                    trader
                ],
            },
        },
        libraries: {
            Vault: vault.address,
        }
    });
    console.log(`02 - Deployed PKKTVault on ${network.name} Proxy: ${pkktVault.address} implementation ${pkktVault.implementation}`);
    const pkktTokenContract = await hardhat_1.ethers.getContractAt("PKKTToken", pkktToken.address);
    const pkktVaultMax = (_a = process.env.PKKT_FARM_MAX) !== null && _a !== void 0 ? _a : constants_1.PKKT_VAULT_MAX;
    await pkktTokenContract.addMinter(pkktVault.address, BigInt(pkktVaultMax));
    console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktVaultMax}`);
};
main.tags = ["PKKTVault"];
exports.default = main;
