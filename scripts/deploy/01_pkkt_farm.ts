import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_FARM_MAX } from "../../constants/constants";
import { ethers } from "hardhat";
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
  const pool = await deploy("Pool", {
    from: deployer,
  });
  const pkktFarm = await deploy("PKKTFarm", {
    from: deployer,
    proxy: {
      owner: owner,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          pkktToken.address,
          process.env.PKKT_PER_BLOCK,
          process.env.START_BLOCK
        ],
      },
    },
    libraries: {
      Pool: pool.address,
    },
  });

  console.log(`01 - Deployed PKKTFarm on ${network.name} to Proxy: ${pkktFarm.address} implementation: ${pkktFarm.implementation}`);

  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const pkktFarmMax = process.env.PKKT_FARM_MAX ?? PKKT_FARM_MAX;
  await pkktTokenContract.addMinter(pkktFarm.address, BigInt(pkktFarmMax));
  console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktFarmMax}`);
}
main.tags = ["PKKTFarm"];
main.dependencies = ["PKKTToken"]

export default main;

 