import { HardhatRuntimeEnvironment } from "hardhat/types";
import { PKKT_VAULT_MAX, USDT_ADDRESS, ROPSTEN_USDT_ADDRESS,
USDC_ADDRESS, ROPSTEN_USDC_ADDRESS, DAI_ADDRESS, ROPSTEN_DAI_ADDRESS } from "../../constants/constants"; 
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();  

const main = async ({
  network,
  deployments,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) => {
  if (process.env.ONLY_HODLBOOSTER){
      console.log("skip Deploying PKKTToken");
      return;
  }
  const { deploy } = deployments;
  console.log("02 - Deploying PKKTVault on", network.name);

  const { deployer, owner, trader } = await getNamedAccounts(); 

  const pkktToken = await deployments.get("PKKTToken");
  const vault = await deploy("Vault", {
    from: deployer,
  });

  const pkktVault = await deploy("PKKTVault", {
    from: deployer,
    proxy: {
      owner: owner,
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        methodName: "initialize",
        args: [
          pkktToken.address,
          process.env.PKKT_PER_BLOCK,
          process.env.START_BLOCK,
          trader
        ],
      },
    },
    libraries: {
      Vault: vault.address,
    }
  });

  console.log(`02 - Deployed PKKTVault on ${network.name} Proxy: ${pkktVault.address} implementation ${pkktVault.implementation}`); 

  const pkktTokenContract = await ethers.getContractAt("PKKTToken", pkktToken.address);
  const pkktVaultMax = process.env.PKKT_FARM_MAX ?? PKKT_VAULT_MAX;
  await pkktTokenContract.addMinter(pkktVault.address, BigInt(pkktVaultMax));
  console.log(`02 - Added PKKTVault to PKKTToken as minter on ${network.name} with max ${pkktVaultMax}`);
};
main.tags = ["PKKTVault"];

export default main;

 