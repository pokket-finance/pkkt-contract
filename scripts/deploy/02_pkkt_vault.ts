import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_VAULT_MAX, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS,
USDC_ADDRESS, ROPSTEN_USDC_ADDRESS, DAI_ADDRESS, ROPSTEN_DAI_ADDRESS } from "../../constants/constants"; 
import { Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { PKKTVault, PKKTToken } from "../../typechain";
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
  console.log("02 - Deploying PKKTVault on", network.name);

  //const { deployer, owner } = await getNamedAccounts(); 

  const pkktToken = await deployments.get("PKKTToken");

  const [deployer] = await ethers.getSigners();
  const vault = await deployContract("Vault", deployer as Signer);

  // For now deployer will have access to the trader role
  // TODO change trader from from deployer to actual trader
  const pkktVault = await deployUpgradeableContract(
    "PKKTVault",
    { signer:deployer as Signer, libraries: { Vault: vault.address } },
    [pkktToken.address, "100", 13603000, deployer.address]
  );
  console.log(`02 - Deployed PKKTVault on ${network.name} to ${pkktVault.address}`); 
};
main.tags = ["PKKTVault"];

export default main;

 