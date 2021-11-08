import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKTTOKEN_BYTECODE } from "../../constants/constants";
import PKKTTOKEN_ABI from "../../constants/abis/PKKTToken.json";
import * as dotenv from "dotenv";  
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  console.log("00 - Deploying PKKTToken on", network.name);

  const { deployer, owner } = await getNamedAccounts();

  const result = await deploy("PKKTToken", {
    from: deployer,
    contract: {
      abi: PKKTTOKEN_ABI,
      bytecode: PKKTTOKEN_BYTECODE,
    },
    args: [process.env.PKKT_TOKEN_NAME, process.env.PKKT_SYMBOL, process.env.PKKT_CAP],
  });
  
  console.log(`00 - Deployed PKKTToken on ${network.name} to ${result.address}`); 
};
main.tags = ["PKKTToken"];

export default main;

 