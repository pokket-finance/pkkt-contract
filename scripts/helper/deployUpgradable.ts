import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";
 

export async function deployUpgradeableContract (name: string, signerAddress:string, args?: Array<any>): Promise<Contract> {
  const signer = (await ethers.getSigner(signerAddress)) as Signer;  
  const factory: ContractFactory = await ethers.getContractFactory(name, signer);
    const ctr: Contract = await upgrades.deployProxy(factory, [...(args || [])], { unsafeAllow: ['delegatecall'], unsafeAllowLinkedLibraries: true });
    //await ctr.deployed();
    return ctr;
}
 