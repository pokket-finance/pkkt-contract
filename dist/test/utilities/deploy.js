"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployContract = void 0;
const hardhat_1 = require("hardhat");
async function deployContract(name, signerOrOptions, args) {
    const factory = await hardhat_1.ethers.getContractFactory(name, signerOrOptions);
    const ctr = await factory.deploy(...(args || []));
    await ctr.deployed();
    return ctr;
}
exports.deployContract = deployContract;
