import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";
import { Libraries } from "hardhat-deploy/dist/types";
import {
  FactoryOptions,
  HardhatEthersHelpers as HardhatEthersHelpersBase,
} from "@nomiclabs/hardhat-ethers/types";
 

export async function deployUpgradeableContract (name: string, signerAddress:string, args?: Array<any>,
  libraries?: Libraries|undefined): Promise<Contract> {
  const signer = (await ethers.getSigner(signerAddress)) as Signer;  
  const factory: ContractFactory = await ethers.getContractFactory(name, signer);
    const ctr: Contract = await upgrades.deployProxy(factory, [...(args || [])], 
    { 
      unsafeAllow: ['delegatecall'], 
      unsafeAllowLinkedLibraries: true,
      ...libraries
     });
    //await ctr.deployed();
    return ctr;
}
 