"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployUpgradeableContract = void 0;
const hardhat_1 = require("hardhat");
async function deployUpgradeableContract(name, signerOrOptions, args) {
    const factory = await hardhat_1.ethers.getContractFactory(name, signerOrOptions);
    const ctr = await hardhat_1.upgrades.deployProxy(factory, [...(args || [])], { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true });
    //await ctr.deployed();
    return ctr;
}
exports.deployUpgradeableContract = deployUpgradeableContract;
