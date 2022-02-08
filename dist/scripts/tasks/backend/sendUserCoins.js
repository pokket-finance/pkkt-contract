"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("../../../constants/constants");
const utilities_1 = require("./utilities");
const main = async ({ target }, { network, ethers, deployments }) => {
    // The first two signers are the deployer and settler so we ignore them
    const [deployer] = await ethers.getSigners();
    const usdc = await (0, utilities_1.getDeployedContractHelper)("USDC", ethers, deployments);
    const wbtc = await (0, utilities_1.getDeployedContractHelper)("WBTC", ethers, deployments);
    await usdc.transfer(target, ethers_1.BigNumber.from(1000000).mul(constants_1.USDC_MULTIPLIER));
    console.log("Send 1000000 usdc to " + target);
    await wbtc.transfer(target, ethers_1.BigNumber.from(10).mul(constants_1.WBTC_MULTIPLIER));
    console.log("Send 10 wbtc to " + target);
    if (network.name === "hardhat") {
        await deployer.sendTransaction({
            to: target,
            value: ethers.utils.parseEther("100.0")
        });
        console.log("Send 100 eth to " + target);
    }
};
exports.default = main;
