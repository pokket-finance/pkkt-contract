import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS, WBTC_ADDRESS, ROPSTEN_WBTC_ADDRESS, USDT_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS} from "../../constants/constants"; 
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { OptionVault, PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption } from "../../typechain";
import * as dotenv from "dotenv";  
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { deployer, owner } = await getNamedAccounts(); 
  const isMainnet = network.name === "mainnet" || network.name == "hardhat"; 
  console.log("03 - Deploying OptionVault on", network.name);
  const optionVault = await deploy("OptionVault", {
    from: deployer,
    contract: "OptionVault"  
  });
  const optionVaultContract = await ethers.getContractAt("OptionVault", optionVault.address);
  console.log(`03 - Deployed OptionVault on on ${network.name} to ${optionVault.address}`);   
  const structureData = await deploy("StructureData", {
    contract: "StructureData",
    from: deployer,
  });
  
  console.log("03 - Deploying ETH-USDT-HodlBooster-Call on", network.name);

  const ethHodlBoosterCall = await deploy("PKKTHodlBoosterCallOption", {
    from: deployer,
    contract: "PKKTHodlBoosterCallOption" ,
    args: ["ETH-USDT-HodlBooster-Call", "ETHUSDTHodlBoosterCall", NULL_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, ETH_DECIMALS, USDT_DECIMALS, optionVault.address],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  await optionVaultContract.addOption(ethHodlBoosterCall.address);
  console.log(`03 - Deployed ETH-USDT-HodlBooster-Call on ${network.name} to ${ethHodlBoosterCall.address}`); 
  const ethHodlBoosterCallOptionContract = await ethers.getContractAt("PKKTHodlBoosterCallOption", ethHodlBoosterCall.address);
  
  await ethHodlBoosterCallOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of ETH-USDT-HodlBooster-Call to ${owner} on ${network.name}`); 


  console.log("03 - Deploying ETH-USDT-HodlBooster-Put on", network.name);
  const ethHodlBoosterPut = await deploy("PKKTHodlBoosterPutOption", {
    from: deployer,
    contract: "PKKTHodlBoosterPutOption" ,
    args: ["ETH-USDT-HodlBooster-Put", "ETHUSDTHodlBoosterPut", NULL_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, ETH_DECIMALS, USDT_DECIMALS, optionVault.address],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  await optionVaultContract.addOption(ethHodlBoosterPut.address);
  console.log(`03 - Deployed ETH-USDT-HodlBooster-Put on ${network.name} to ${ethHodlBoosterPut.address}`); 
  const ethHodlBoosterPutOptionContract = await ethers.getContractAt("PKKTHodlBoosterPutOption", ethHodlBoosterPut.address);
  
  await ethHodlBoosterPutOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of ETH-USDT-HodlBooster-Put to ${owner} on ${network.name}`); 

 

  console.log("03 - Deploying WBTC-USDT-HodlBooster-Call on", network.name);
  const wbtcHodlBoosterCall = await deploy("PKKTHodlBoosterCallOption", {
    from: deployer,
    contract: "PKKTHodlBoosterCallOption" ,
    args: ["WBTC-USDT-HodlBooster-Call", "WBTCUSDTHodlBoosterCall", 
    isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, WBTC_DECIMALS, USDT_DECIMALS, optionVault.address],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  await optionVaultContract.addOption(wbtcHodlBoosterCall.address);
  console.log(`03 - Deployed WBTC-USDT-HodlBooster-Call on ${network.name} to ${wbtcHodlBoosterCall.address}`); 
  const wbtcHodlBoosterCallOptionContract = await ethers.getContractAt("PKKTHodlBoosterCallOption", wbtcHodlBoosterCall.address);
  await wbtcHodlBoosterCallOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of WBTC-USDT-HodlBooster-Call to ${owner} on ${network.name}`);

  
  console.log("03 - Deploying WBTC-USDT-HodlBooster-Put on", network.name);
  const wbtcHodlBoosterPut = await deploy("PKKTHodlBoosterPutOption", {
    from: deployer,
    contract: "PKKTHodlBoosterPutOption" ,
    args: ["WBTC-USDT-HodlBooster-Call", "WBTCUSDTHodlBoosterPut", 
    isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, WBTC_DECIMALS, USDT_DECIMALS, optionVault.address],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  await optionVaultContract.addOption(wbtcHodlBoosterPut.address);
  console.log(`03 - Deployed WBTC-USDT-HodlBooster-Put on ${network.name} to ${wbtcHodlBoosterPut.address}`); 
  const wbtcHodlBoosterPutOptionContract = await ethers.getContractAt("PKKTHodlBoosterPutOption", wbtcHodlBoosterPut.address);
  await wbtcHodlBoosterPutOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of WBTC-USDT-HodlBooster-Put to ${owner} on ${network.name}`);


   
};
main.tags = ["PKKTHodlBoosterCallOption"];

export default main;

 