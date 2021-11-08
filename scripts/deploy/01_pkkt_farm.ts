import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKTFARM_BYTECODE } from "../../constants/constants";
import PKKTFARM_ABI from "../../constants/abis/PKKTFARM.json";
import { ERC20, PoolFactory } from "../typechain";
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

  const result = await deploy("PKKTFarm", {
    from: deployer,
    contract: {
      abi: PKKTFARM_ABI,
      bytecode: PKKTFARM_BYTECODE,
    },
    args: [pkktToken.address, process.env.PKKT_PER_BLOCK, process.env.START_BLOCK],
  });
  
  console.log(`01 - Deployed PKKTFarm on ${network.name} to ${result.address}`); 
};
main.tags = ["PKKTFarm"];

export default main;

 