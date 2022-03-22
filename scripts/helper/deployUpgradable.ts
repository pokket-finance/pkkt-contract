import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";  
 

export async function deployUpgradeableContract (factory: ContractFactory,  args?: Array<any>, newAdmin?: string|undefined): Promise<Contract> { 
    const ctr: Contract = await upgrades.deployProxy(factory, [...(args || [])], 
    { 
      unsafeAllow: ['delegatecall'], 
      unsafeAllowLinkedLibraries: true, 
     });
    await ctr.deployed();
    if (newAdmin){
      await upgrades.admin.changeProxyAdmin(ctr.address, newAdmin);
    }
    return ctr;
}
 