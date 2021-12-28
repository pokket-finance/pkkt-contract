// IMPORTANT this file CAN NOT import "hardhat" as these are utilities used for tasks

import { Contract } from "ethers";

/**
 * Retrieves the contract from deployments
 * and creates an object from Contract abi and address
 * @param name name of the contract to get from deployments
 * @returns contract object
 */
 export async function getDeployedContractHelper(name: string, ethers, deployments): Promise<Contract> {
    const Contract = await deployments.get(name);
    return await ethers.getContractAt(Contract.abi, Contract.address);
}