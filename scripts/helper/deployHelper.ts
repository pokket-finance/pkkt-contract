import { Contract, ContractFactory} from "ethers";
import { ethers, upgrades } from "hardhat";
import { Signer } from "ethers";  
import {DeployResult} from "hardhat-deploy/types";
import {RunTaskFunction} from "hardhat/types";

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

export async function postDeployment(result:DeployResult, run:RunTaskFunction, 
  contractName: string, networkName:string, constructorArguments?:any) { 
  if (result.newlyDeployed) {
    console.log(`Deployed ${contractName} at ${result.address} on ${networkName}`);
    const optionLifecycleContract = await ethers.getContractAt(contractName, result.address);
    if (!result.receipt?.confirmations || result.receipt.confirmations == 0) { 
      await optionLifecycleContract.deployed();
    } 
  }
  else{ 
    console.log(`${contractName} is already deployed at ${result.address} on ${networkName}`);
  }
  
  try {
    await run("verify:verify", {
      address: result.address,
      constructorArguments
    });
    console.log(`Verified ${contractName} on etherscan ${networkName}`);
  } catch (e) {
    console.error(e);
    //exit(-1);
  }
}