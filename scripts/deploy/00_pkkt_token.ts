import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKTTOKEN_BYTECODE } from "../../constants/constants";
import PKKTTOKEN_ABI from "../../constants/abis/PKKTToken.json";
require("dotenv").config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  const { deploy } = deployments;
  console.log("00 - Deploying PKKTToken on", network.name);

  const { deployer, owner } = await getNamedAccounts();

  await deploy("PokketToken", {
    from: deployer,
    contract: {
      abi: PKKTTOKEN_ABI,
      bytecode: PKKTTOKEN_BYTECODE,
    },
    args: [process.env.PKKT_TOKEN_NAME, process.env.PKKT_SYMBOL, process.env.PKKT_CAP],
  });
};
main.tags = ["PokketToken"];

export default main;

 