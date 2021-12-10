import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS, WBTC_ADDRESS, ROPSTEN_WBTC_ADDRESS} from "../../constants/constants"; 
import { BigNumber, Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption } from "../../typechain";
import * as dotenv from "dotenv";  
import { deployContract } from "../../test/utilities/deploy";
import { deployUpgradeableContract } from "../../test/utilities/deployUpgradable";
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
  
  const pkktVault = await deployments.get("PKKTVault");

  const structureData = await deploy("StructureData", {
    from: deployer,
  });

  const pkktHodlBoosterOption = await deploy("PKKTHodlBoosterOption", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          "ETH-USDT-HodlBooster",
          "ETHUSDTHodlBooster",
          NULL_ADDRESS,
          isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
          18,
          6,
          pkktVault.address
        ],
      },
    },
    libraries: {
      StructureData: structureData.address,
    }
  });
  console.log(`03 - Deployed ETH-USDT-HodlBooster on ${network.name} to ${pkktHodlBoosterOption.address}`); 

  console.log(`03 - Deploying WBTC-USDT-HodlBooster on ${network.name}`);
  const pkktHodlBoosterOption2 = await deploy("PKKTHodlBoosterOption2", {
    from: deployer,
    contract: "PKKTHodlBoosterOption",
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          "WBTC-USDT-HodlBooster",
          "WBTCUSDTHodlBooster",
          isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS,
          isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
          18,
          6,
          pkktVault.address
        ],
      },
    },
    libraries: {
      StructureData: structureData.address,
    }
  });
  
  console.log(`03 - Deployed WBTC-USDT-HodlBooster on ${network.name} to ${pkktHodlBoosterOption2.address}`); 
};
main.tags = ["PKKTHodlBoosterOption"];

export default main;

 