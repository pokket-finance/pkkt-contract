"use strict";
// IMPORTANT this file CAN NOT import "hardhat" as these are utilities used for tasks
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptionParameter = exports.packOptionParameter = exports.getDeployedContractHelper = void 0;
const ethers_1 = require("ethers");
/**
 * Retrieves the contract from deployments
 * and creates an object from Contract abi and address
 * @param name name of the contract to get from deployments
 * @returns contract object
 */
async function getDeployedContractHelper(name, ethers, deployments) {
    const Contract = await deployments.get(name);
    return await ethers.getContractAt(Contract.abi, Contract.address);
}
exports.getDeployedContractHelper = getDeployedContractHelper;
function packOptionParameter(strikePrice, premiumRate) {
    return ethers_1.BigNumber.from(strikePrice).shl(16).or(ethers_1.BigNumber.from(premiumRate));
}
exports.packOptionParameter = packOptionParameter;
function parseOptionParameter(value) {
    return [value.shr(16).toNumber(),
        value.and(ethers_1.BigNumber.from("0xffff")).toNumber()];
}
exports.parseOptionParameter = parseOptionParameter;
