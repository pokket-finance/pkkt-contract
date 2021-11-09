import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_VAULT_MAX } from "../../constants/constants"; 
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
  console.log(vault.address);
  const result = await deploy("PKKTVault", {
    from: deployer,
    contract: "PKKTVault" ,
    args: [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK],
    libraries: {
        Vault: vault.address,
      },
  });
  
  console.log(`02 - Deployed PKKTVault on ${network.name} to ${result.address}`); 

  
  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const pkktVaultMax =  process.env.PKKT_FARM_MAX?? PKKT_VAULT_MAX;
  await pkktTokenContract.addMinter(result.address, BigInt(pkktVaultMax));
  console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktVaultMax}`); 

  
  const pkktVaultContract = await ethers.getContractAt("PKKTVault", result.address);
  await pkktVaultContract.transferOwnership(owner);
  console.log(`02 - Transfer owner of PKKTFarm to ${owner} on ${network.name}`); 

  //todo: add lps 

};
main.tags = ["PKKTVault"];

export default main;

 