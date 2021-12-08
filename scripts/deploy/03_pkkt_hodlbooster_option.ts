import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS, WBTC_ADDRESS, ROPSTEN_WBTC_ADDRESS} from "../../constants/constants"; 
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { OptionVault, PKKTHodlBoosterOption } from "../../typechain";
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

  console.log(`03 - Deploying OptionVault on on ${network.name} to ${optionVault.address}`);   
 
  
  const structureData = await deploy("StructureData", {
    contract: "StructureData",
    from: deployer,
  });
  const ethHodlBooster = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    contract: "PKKTHodlBoosterOption" ,
    args: ["ETH-USDT-HodlBooster", "ETHUSDTHodlBooster", NULL_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, 18, 6, optionVault.address],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  console.log(`03 - Deployed ETH-USDT-HodlBooster on ${network.name} to ${ethHodlBooster.address}`); 
  const ethHodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", ethHodlBooster.address);
  await ethHodlBoosterOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of ETH-USDT-HodlBooster to ${owner} on ${network.name}`); 


  console.log("03 - Deploying WBTC-USDT-HodlBooster on", network.name);
  const wbtcHodlBooster = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    contract: "PKKTHodlBoosterOption" ,
    args: ["WBTC-USDT-HodlBooster", "WBTCUSDTHodlBooster", 
    isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, 18, 6, optionVault.address],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  console.log(`03 - Deployed WBTC-USDT-HodlBooster on ${network.name} to ${wbtcHodlBooster.address}`); 
  const wbtcHodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", wbtcHodlBooster.address);
  await wbtcHodlBoosterOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of WBTC-USDT-HodlBooster to ${owner} on ${network.name}`);
   
};
main.tags = ["PKKTHodlBoosterOption"];

export default main;

 