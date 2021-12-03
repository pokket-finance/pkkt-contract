import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS, WBTC_ADDRESS, ROPSTEN_WBTC_ADDRESS} from "../../constants/constants"; 
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption } from "../../typechain";
import * as dotenv from "dotenv";  
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  console.log("03 - Deploying ETH-USDT-HodlBooster on", network.name);

  const { deployer, owner } = await getNamedAccounts(); 
 
  const isMainnet = network.name === "mainnet" || network.name == "hardhat"; 
  
  const structureData = await deploy("StructureData", {
    contract: "StructureData",
    from: deployer,
  });
  const result = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    contract: "PKKTHodlBoosterOption" ,
    args: ["ETH-USDT-HodlBooster", "ETHUSDTHodlBooster", NULL_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, 18, 6],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  console.log(`03 - Deployed ETH-USDT-HodlBooster on ${network.name} to ${result.address}`); 
  const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", result.address);
  await hodlBoosterOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of ETH-USDT-HodlBooster to ${owner} on ${network.name}`); 


  console.log("03 - Deploying WBTC-USDT-HodlBooster on", network.name);
  const result2 = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    contract: "PKKTHodlBoosterOption" ,
    args: ["WBTC-USDT-HodlBooster", "WBTCUSDTHodlBooster", 
    isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS, 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, 18, 6],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  console.log(`03 - Deployed WBTC-USDT-HodlBooster on ${network.name} to ${result2.address}`); 
  const hodlBoosterOptionContract2 = await ethers.getContractAt("PKKTHodlBoosterOption", result2.address);
  await hodlBoosterOptionContract2.transferOwnership(owner);
  console.log(`03 - Transfer owner of WBTC-USDT-HodlBooster to ${owner} on ${network.name}`);
   
};
main.tags = ["PKKTHodlBoosterOption"];

export default main;

 