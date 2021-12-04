import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";
 

export async function deployUpgradeableContract (name: string, signerOrOptions?: Signer  | FactoryOptions, args?: Array<any>): Promise<Contract> {
    const factory: ContractFactory = await ethers.getContractFactory(name, signerOrOptions);
    const ctr: Contract = await upgrades.deployProxy(factory, [...(args || [])], { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true });
    //await ctr.deployed();
    return ctr;
}
 