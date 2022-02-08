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
    console.log("01 - Deploying PKKTFarm on", network.name);
    const { deployer, owner } = await getNamedAccounts();
    const pkktToken = await deployments.get("PKKTToken");
    const pool = await deploy("Pool", {
        from: deployer,
    });
    const pkktFarm = await deploy("PKKTFarm", {
        from: deployer,
        proxy: {
            owner: owner,
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [
                    pkktToken.address,
                    process.env.PKKT_PER_BLOCK,
                    process.env.START_BLOCK
                ],
            },
        },
        libraries: {
            Pool: pool.address,
        },
    });
    console.log(`01 - Deployed PKKTFarm on ${network.name} to Proxy: ${pkktFarm.address} implementation: ${pkktFarm.implementation}`);
    const pkktTokenContract = await hardhat_1.ethers.getContractAt("PKKTToken", pkktToken.address);
    const pkktFarmMax = (_a = process.env.PKKT_FARM_MAX) !== null && _a !== void 0 ? _a : constants_1.PKKT_FARM_MAX;
    await pkktTokenContract.addMinter(pkktFarm.address, BigInt(pkktFarmMax));
    console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktFarmMax}`);
};
main.tags = ["PKKTFarm"];
main.dependencies = ["PKKTToken"];
exports.default = main;
