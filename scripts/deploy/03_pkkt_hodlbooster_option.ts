import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS, WBTC_ADDRESS, ROPSTEN_WBTC_ADDRESS, USDT_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS} from "../../constants/constants"; 
import { BigNumber, BigNumberish, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption} from "../../typechain";
import * as dotenv from "dotenv";  
 
dotenv.config();   
const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  const { deployer, owner, trader } = await getNamedAccounts(); 
  const isMainnet = network.name === "mainnet" || network.name == "hardhat"; 
   
  
  console.log("03 - Deploying PKKTHodlBoosterOption on", network.name); 
  const structureData = await deploy("StructureData", {
    from: deployer,
  });
  const optionVault = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    args: [trader, [
      { 
        depositAssetAmountDecimals: ETH_DECIMALS,
        counterPartyAssetAmountDecimals: USDT_DECIMALS,
        depositAsset: NULL_ADDRESS,
        counterPartyAsset: isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
        callOptionId: 0,
        putOptionId: 0
      
      },
      { 
        depositAssetAmountDecimals: WBTC_DECIMALS,
        counterPartyAssetAmountDecimals: USDT_DECIMALS,
        depositAsset: isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS,
        counterPartyAsset: isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
        callOptionId: 0,
        putOptionId: 0
      
      }
    ]],
    contract: "PKKTHodlBoosterOption",
    libraries: {
      StructureData: structureData.address,
    } 
  }); 
  console.log(`03 - Deployed PKKTHodlBoosterOption on ${network.name} to ${optionVault.address}`);    

};
main.tags = ["PKKTHodlBoosterCallOption"];

export default main;

 