import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKTFARM_BYTECODE, PKKT_FARM_MAX } from "../../constants/constants";
import PKKTFARM_ABI from "../../constants/abis/PKKTFARM.json";
import { ContractFactory, Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import { PKKTFarm, PKKTToken } from "../../typechain";
import * as dotenv from "dotenv";  
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployUpgradeableContract } from "../../test/utilities/deployUpgradable";
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  console.log("01 - Deploying PKKTFarm on", network.name);

  //const { deployer, owner } = await getNamedAccounts();

  const pkktToken = await deployments.get("PKKTToken");

  const [deployer] = await ethers.getSigners();

  const pkktFarm = await deployUpgradeableContract(
    "PKKTFarm",
    deployer as Signer,
    [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK]
  );
  console.log(`01 - Deployed PKKTFarm on ${network.name} to ${pkktFarm.address}`);

  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const pkktFarmMax = process.env.PKKT_FARM_MAX ?? PKKT_FARM_MAX;
  await pkktTokenContract.addMinter(pkktFarm.address, BigInt(pkktFarmMax));
  console.log(`01 - Added PKKTFarm to PKKTToken as minter on ${network.name} with max ${pkktFarmMax}`);
};
main.tags = ["PKKTFarm"];

export default main;

 