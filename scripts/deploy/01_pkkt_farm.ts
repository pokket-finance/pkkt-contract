import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKTFARM_BYTECODE, PKKT_FARM_MAX } from "../../constants/constants";
import PKKTFARM_ABI from "../../constants/abis/PKKTFARM.json";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { PKKTFarm, PKKTToken } from "../../typechain";
import * as dotenv from "dotenv";  
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  console.log("01 - Deploying PKKTFarm on", network.name);

  const { deployer, owner } = await getNamedAccounts();

  const pkktToken = await deployments.get("PKKTToken");

  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const result = await deploy("PKKTFarm", {
    from: deployer,
    contract: {
      abi: PKKTFARM_ABI,
      bytecode: PKKTFARM_BYTECODE,
    },
    args: [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK],
  });
  
  console.log(`01 - Deployed PKKTFarm on ${network.name} to ${result.address}`); 

  const pkktFarmMax =  process.env.PKKT_FARM_MAX ?? PKKT_FARM_MAX;
  await pkktTokenContract.addMinter(result.address, BigInt(pkktFarmMax));
  console.log(`01 - Added PKKTFarm to PKKTToken as minter on ${network.name} with max ${pkktFarmMax}`); 

  
  const pkktFarmContract = await ethers.getContractAt("PKKTFarm", result.address);
  await pkktFarmContract.transferOwnership(owner);
  console.log(`01 - Transfer owner of PKKTFarm to ${owner} on ${network.name}`); 

  //todo: add lps 

};
main.tags = ["PKKTFarm"];

export default main;

 