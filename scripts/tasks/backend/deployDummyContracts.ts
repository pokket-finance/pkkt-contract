import fsPromises from "fs/promises";
import { BigNumber, Signer } from "ethers";

import {
    USDC_DECIMALS,
    WBTC_DECIMALS,
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    NULL_ADDRESS,
    ETH_DECIMALS,
    USDT_DECIMALS
} from "../../../constants/constants";
import { PKKTHodlBoosterOption } from "../../../typechain";
import { getDeployedContractHelper } from "./utilities";
import initializeUsers from "./initializeUsers";
import generateOptionData from "./generateOptionData";

const main = async ({ fresh, init, initbackend }, { network, ethers, deployments, getNamedAccounts }) => {
    const { deploy } = await deployments;
    const [deployerSigner, settlerSigner] = await ethers.getSigners();
    const { deployer, settler } = await getNamedAccounts();
    if(fresh) {
        const dir = `./deployments/${network.name}`;
        await removeDirectory(dir);
    }
    await deployContracts(deployer, settler, deploy, ethers);
    
    if (init) {
        const optionVault = await getDeployedContractHelper(
            "PKKTHodlBoosterOption",
            ethers,
            deployments
        ) as PKKTHodlBoosterOption;
        await optionVault.connect(settlerSigner as Signer).initiateSettlement();
        console.log("Initialized the current round to :" + (await (await optionVault.currentRound()).toString()));
    }

    if (initbackend) {
        await initializeUsers([], { ethers, deployments, getNamedAccounts });
        await generateOptionData({ command: initbackend }, { ethers, deployments, getNamedAccounts });
    }
    // For testing stalled transactions
    // await network.provider.send("evm_setAutomine", [false]);
    // await network.provider.send("evm_setIntervalMining", [0]);
}

// Remove the given directory
const removeDirectory = async (dir) => {
    try {
        await fsPromises.rmdir(dir, { recursive: true });
        console.log(`${dir} removed`);
    } catch (err) {
        console.error(err);
    }
};

// Deploy the initial contracts
const deployContracts = async (deployer, settler, deploy, ethers) => { 
    const USDC = await deploy("USDC", {
        contract: "ERC20Mock",
        from: deployer,
        args: [
            "USDCToken",
            "USDC",
            BigNumber.from(10000000).mul(USDC_MULTIPLIER),
            USDC_DECIMALS,
        ],
    });
    console.log("Deployed USDC at " + USDC.address);

    const WBTC = await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer,
        args: [
            "Wrapped BTC",
            "WBTC",
            BigNumber.from(100000).mul(WBTC_MULTIPLIER),
            WBTC_DECIMALS
        ],
    });

    console.log("Deployed WBTC at " + WBTC.address);
 

    const optionLifecycle = await deploy("OptionLifecycle", {
        from: deployer,
    });

    const optionVault = await deploy("PKKTHodlBoosterOption", {
        from: deployer,
        args: [settler, [
          { 
            depositAssetAmountDecimals: ETH_DECIMALS,
            counterPartyAssetAmountDecimals: USDT_DECIMALS,
            depositAsset: NULL_ADDRESS,
            counterPartyAsset: USDC.address,
            callOptionId: 0,
            putOptionId: 0
          
          },
          { 
            depositAssetAmountDecimals: WBTC_DECIMALS,
            counterPartyAssetAmountDecimals: USDT_DECIMALS,
            depositAsset: WBTC.address,
            counterPartyAsset: USDC.address,
            callOptionId: 0,
            putOptionId: 0
          
          }
        ]],
        contract: "PKKTHodlBoosterOption",
        libraries: {
          OptionLifecycle: optionLifecycle.address,
        } 
      }); 
      console.log("Deployed Option Vault at " + optionVault.address);   
}
 

export default main;