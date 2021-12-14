import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NULL_ADDRESS, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS, WBTC_ADDRESS, ROPSTEN_WBTC_ADDRESS, USDT_DECIMALS, WBTC_DECIMALS, ETH_DECIMALS} from "../../constants/constants"; 
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { OptionVault, PKKTHodlBoosterCallOption, PKKTHodlBoosterPutOption } from "../../typechain";
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
  const { deployer, owner } = await getNamedAccounts(); 
  const isMainnet = network.name === "mainnet" || network.name == "hardhat"; 
  console.log("03 - Deploying OptionVault on", network.name);
  const optionVault = await deploy("OptionVault", {
    from: deployer,
    args: [owner],
    contract: "OptionVault"  
  });
  const optionVaultContract = await ethers.getContractAt("OptionVault", optionVault.address);
  console.log(`03 - Deployed OptionVault on on ${network.name} to ${optionVault.address}`);   
  const structureData = await deploy("StructureData", {
    from: deployer,
  });

  console.log(`03 - Deploying ETH-USDT-HodlBooster-Call on ${network.name}`);

  const ethHodlBoosterCall = await deploy("ETHPKKTHodlBoosterCallOption", {
    from: deployer,
    contract: "PKKTHodlBoosterCallOption",
    proxy: {
      owner: owner,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          "ETH-USDT-HodlBooster-Call",
          "ETHUSDTHodlBoosterCall",
          NULL_ADDRESS,
          isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
          ETH_DECIMALS,
          USDT_DECIMALS,
          optionVault.address
        ],
      },
    },
    libraries: {
      StructureData: structureData.address,
    }
  });

  await optionVaultContract.addOption(ethHodlBoosterCall.address);

  console.log(`03 - Deployed ETH-USDT-HodlBooster-Call on ${network.name} to ${ethHodlBoosterCall.address}`); 
  const ethHodlBoosterCallOptionContract = await ethers.getContractAt(
    "PKKTHodlBoosterCallOption",
    ethHodlBoosterCall.address
  );

  console.log("03 - Deploying ETH-USDT-HodlBooster-Put on", network.name);

  const ethHodlBoosterPut = await deploy("ETHPKKTHodlBoosterPutOption", {
    from: deployer,
    contract: "PKKTHodlBoosterPutOption",
    proxy: {
      owner: owner,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          "ETH-USDT-HodlBooster-Put",
          "ETHUSDTHodlBoosterPut",
          isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS,
          isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
          ETH_DECIMALS,
          USDT_DECIMALS,
          optionVault.address
        ],
      },
    },
    libraries: {
      StructureData: structureData.address,
    },
  });

  await optionVaultContract.addOption(ethHodlBoosterPut.address);
  console.log(`03 - Deployed ETH-USDT-HodlBooster-Put on ${network.name} to ${ethHodlBoosterPut.address}`);
  const ethHodlBoosterPutOptionContract = await ethers.getContractAt("PKKTHodlBoosterPutOption", ethHodlBoosterPut.address);

  console.log("03 - Deploying WBTC-USDT-HodlBooster-Call on", network.name);
  const wbtcHodlBoosterCall = await deploy("WBTCPKKTHodlBoosterCallOption", {
    from: deployer,
    contract: "PKKTHodlBoosterCallOption" ,
    proxy: {
      owner: owner,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          "WBTC-USDT-HodlBooster-Call",
          "WBTCUSDTHodlBoosterCall", 
          isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS, 
          isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
          WBTC_DECIMALS,
          USDT_DECIMALS,
          optionVault.address
        ]
      }
    },
    libraries: {
      StructureData: structureData.address,
    },
  });

  await optionVaultContract.addOption(wbtcHodlBoosterCall.address);
  console.log(`03 - Deployed WBTC-USDT-HodlBooster-Call on ${network.name} to ${wbtcHodlBoosterCall.address}`); 

  console.log("03 - Deploying WBTC-USDT-HodlBooster-Put on", network.name);
  const wbtcHodlBoosterPut = await deploy("WBTCPKKTHodlBoosterPutOption", {
    from: deployer,
    contract: "PKKTHodlBoosterPutOption" ,
    proxy: {
      owner: owner,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          "WBTC-USDT-HodlBooster-Call",
          "WBTCUSDTHodlBoosterPut", 
          isMainnet ? WBTC_ADDRESS : ROPSTEN_WBTC_ADDRESS, 
          isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
          WBTC_DECIMALS,
          USDT_DECIMALS,
          optionVault.address
        ],
      }
    },
    libraries: {
      StructureData: structureData.address,
    },
  });

  await optionVaultContract.addOption(wbtcHodlBoosterPut.address);
  console.log(`03 - Deployed WBTC-USDT-HodlBooster-Put on ${network.name} to ${wbtcHodlBoosterPut.address}`); 
};
main.tags = ["PKKTHodlBoosterCallOption"];

export default main;

 