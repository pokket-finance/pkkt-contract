import { Contract } from "ethers";
import { Signer } from "ethers";
import { FactoryOptions } from "@nomiclabs/hardhat-ethers/types";
export declare function deployUpgradeableContract(name: string, signerOrOptions?: Signer | FactoryOptions, args?: Array<any>): Promise<Contract>;
