import { ContractFactory } from "@ethersproject/contracts";

/**
 * Prepares an upgrade to be run from an admin address (multi-sig wallet)
 * @param address Proxy address which handles the contract we want to upgrade 
 * @param name Name of the new implementation contract we want to upgrade to
 * @param ethers hardhat-ethers library injected from config file
 * @param upgrades openzeppelin upgrades library injected from config file
 */
const main = async ({ address, name}, { ethers, upgrades }) => {
    const NewImplementationContract = await ethers.getContractFactory(name);
    console.log("Preparing to upgrade...");
    const newImplementationAddress = await upgrades.prepareUpgrade(
        address,
        NewImplementationContract as ContractFactory,
        { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true }
    );
    console.log(`${name} at: ${newImplementationAddress}`);
}

export default main;