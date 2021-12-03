import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_VAULT_MAX, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS } from "../../constants/constants"; 
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
  console.log("03 - Deploying ETH-USDC-HodlBooster on", network.name);

  const { deployer, owner } = await getNamedAccounts(); 
 
  const isMainnet = network.name === "mainnet" || network.name == "hardhat"; 
  
  const structureData = await deploy("StructureData", {
    contract: "StructureData",
    from: deployer,
  });
  const result = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    contract: "PKKTHodlBoosterOption" ,
    args: ["ETH-USDC-HodlBooster", "ETHUSDCHodlBooster", "0x0", 
    isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS, 18, 6],
    libraries: {
      StructureData: structureData.address,
    },
  });
  
  console.log(`03 - Deployed ETH-USDC-HodlBooster on ${network.name} to ${result.address}`); 
  const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", result.address);
  await hodlBoosterOptionContract.transferOwnership(owner);
  console.log(`03 - Transfer owner of ETH-USDC-HodlBooster to ${owner} on ${network.name}`); 

   
};
main.tags = ["PKKTHodlBoosterOption"];

export default main;

 