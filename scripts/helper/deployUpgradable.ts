import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";  
 

export async function deployUpgradeableContract (factory: ContractFactory, args?: Array<any>): Promise<Contract> { 
    const ctr: Contract = await upgrades.deployProxy(factory, [...(args || [])], 
    { 
      unsafeAllow: ['delegatecall'], 
      unsafeAllowLinkedLibraries: true, 
     });
    await ctr.deployed();
    return ctr;
}
 