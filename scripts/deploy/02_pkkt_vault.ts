import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_VAULT_MAX, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS,
USDC_ADDRESS, ROPSTEN_USDC_ADDRESS, DAI_ADDRESS, ROPSTEN_DAI_ADDRESS } from "../../constants/constants"; 
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTVault, PKKTToken } from "../../typechain";
import * as dotenv from "dotenv";  
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  console.log("02 - Deploying PKKTVault on", network.name);

  const { deployer, owner } = await getNamedAccounts(); 

  const pkktToken = await deployments.get("PKKTToken");

  
  const vault = await deploy("Vault", {
    contract: "Vault",
    from: deployer,
  });

  // For now we pass in the deployer as the trader
  // TODO actually pass in the trader address
  const pkktVault = await deploy("PKKTVault", {
    from: deployer,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: 'initialize',
        args: [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK, deployer],
      },
    },
    libraries: {
      Vault: vault.address,
    },
  });
  
  console.log(`02 - Deployed PKKTVault on ${network.name} to ${pkktVault.address}`); 

  
  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const pkktVaultMax =  process.env.PKKT_FARM_MAX?? PKKT_VAULT_MAX;
  await pkktTokenContract.addMinter(pkktVault.address, BigInt(pkktVaultMax));
  console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktVaultMax}`); 

  
  const pkktVaultContract = await ethers.getContractAt("PKKTVault", pkktVault.address);

  const isMainnet = network.name === "mainnet" || network.name == "hardhat"; 

  const vaults = [
    {
      underlying: isMainnet ? USDT_ADDRESS : ROPSTEN_USDT_ADDRESS,
      decimals:6
    }, 
    { 
      underlying: isMainnet ? USDC_ADDRESS : ROPSTEN_USDC_ADDRESS,
      decimals:6
    }, 
    { 
      underlying: isMainnet ? DAI_ADDRESS : ROPSTEN_DAI_ADDRESS,
      decimals:18
    }]; 
  await pkktVaultContract.addMany(vaults, true);

   for(var i = 0; i < vaults.length; i++) { 
     const result = await pkktVaultContract.vaultInfo(i);
     console.log(`02 - Added vault ${result.underlying} (${result.decimals} decimals) on ${network.name}`)
   } 

  await pkktVaultContract.transferOwnership(owner);
  //revoke the deployer's authority after deployment
  console.log(`02 - Transfer owner of PKKTVault to ${owner} on ${network.name}`); 
};
main.tags = ["PKKTVault"];

export default main;

 