import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_VAULT_MAX, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS,
USDC_ADDRESS, ROPSTEN_USDC_ADDRESS, DAI_ADDRESS, ROPSTEN_DAI_ADDRESS } from "../../constants/constants"; 
import { Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { PKKTVault, PKKTToken } from "../../typechain";
import * as dotenv from "dotenv";
import { deployContract } from "../../test/utilities/deploy";
import { deployUpgradeableContract } from "../../test/utilities/deployUpgradable";
import { DefenderRelayProvider, DefenderRelaySigner } from "defender-relay-client/lib/ethers";
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
  // const credentials = { apiKey: "", apiSecret:"" };
  // const provider = new DefenderRelayProvider(credentials);
  // const deployer = new DefenderRelaySigner(credentials, provider, { speed: "fast" });
  const vault = await deployContract("Vault", deployer as Signer);
  // For now deployer will have access to the trader role
  const traderAddress = process.env.TRADER_ADDRESS ?? (await deployer.getAddress());
  const pkktVault = await deployUpgradeableContract(
    "PKKTVault",
    { signer:deployer as Signer, libraries: { Vault: vault.address } },
    [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK, traderAddress]
  );
  console.log(`02 - Deployed PKKTVault on ${network.name} to ${pkktVault.address}`); 

  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const pkktVaultMax = process.env.PKKT_FARM_MAX ?? PKKT_VAULT_MAX;
  await pkktTokenContract.addMinter(pkktVault.address, BigInt(pkktVaultMax));
  console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktVaultMax}`);
};
main.tags = ["PKKTVault"];

export default main;

 