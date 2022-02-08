"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const constants_1 = require("../../../constants/constants");
const utilities_1 = require("./utilities");
const main = async (taskArgs, { ethers, deployments, getNamedAccounts }) => {
    console.log("Initializing users...");
    // The first two signers are the deployer and settler so we ignore them
    const [, , alice, bob, , carol] = await ethers.getSigners();
    const usdc = await (0, utilities_1.getDeployedContractHelper)("USDC", ethers, deployments);
    const wbtc = await (0, utilities_1.getDeployedContractHelper)("WBTC", ethers, deployments);
    const optionVault = await (0, utilities_1.getDeployedContractHelper)("PKKTHodlBoosterOption", ethers, deployments);
    ;
    const users = [alice, bob, carol];
    for (let user of users) {
        //console.log(`${user.address} `);
        await usdc.transfer(user.address, ethers_1.BigNumber.from(1000000).mul(constants_1.USDC_MULTIPLIER));
        await usdc.connect(user).approve(optionVault.address, ethers_1.BigNumber.from(1000000).mul(constants_1.USDC_MULTIPLIER));
        await wbtc.transfer(user.address, ethers_1.BigNumber.from(100).mul(constants_1.WBTC_MULTIPLIER));
        await wbtc.connect(user).approve(optionVault.address, ethers_1.BigNumber.from(100).mul(constants_1.WBTC_MULTIPLIER));
        // var b = await user.getBalance();
        // console.log(b.toString());
        // await user.sendTransaction({
        //     to: "0x98DC5e836bF40496a5190a02c0c8412505eBE52F",
        //     value: ethers.utils.parseEther("5.0")
        // }) 
    }
};
exports.default = main;
