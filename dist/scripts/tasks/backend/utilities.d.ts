import { Contract, BigNumber } from "ethers";
/**
 * Retrieves the contract from deployments
 * and creates an object from Contract abi and address
 * @param name name of the contract to get from deployments
 * @returns contract object
 */
export declare function getDeployedContractHelper(name: string, ethers: any, deployments: any): Promise<Contract>;
export declare function packOptionParameter(strikePrice: number, premiumRate: number): BigNumber;
export declare function parseOptionParameter(value: BigNumber): [number, number];
