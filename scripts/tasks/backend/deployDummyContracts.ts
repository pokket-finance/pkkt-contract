import fsPromises from "fs/promises";
import { BigNumber } from "ethers";

import {
    USDC_DECIMALS,
    WBTC_DECIMALS,
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER
} from "../../../constants/constants";

const main = async ({ fresh }, { network, ethers, deployments, getNamedAccounts }) => {
    const { deploy } = await deployments;
    const { deployer, settler } = await getNamedAccounts();
    if(fresh) {
        const dir = `./deployments/${network.name}`;
        await removeDirectory(dir);
    }
    await deployContracts(deployer, settler, deploy, ethers);
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
            BigNumber.from(10000).mul(USDC_MULTIPLIER),
            USDC_DECIMALS,
        ],
    });

    const WBTC = await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer,
        args: [
            "Wrapped BTC",
            "WBTC",
            BigNumber.from(100).mul(WBTC_MULTIPLIER),
            WBTC_DECIMALS
        ],
    });

    const OptionVault = await deploy("OptionVault", {
        contract: "OptionVault",
        from: deployer,
        args: [
            settler,
        ],
    });

    const name = "WBTC-USDC-HodlBooster-Call";
    const structureData = await deploy("StructureData", {
        from: deployer,
    });
    const WbtcHodlBoosterCall = await deploy("WBTCHodlBoosterCallOption", {
        from: deployer,
        contract: "PKKTHodlBoosterCallOption",
        proxy: {
            owner: settler,
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [
                    "WBTC-USDC-HodlBooster-Call",
                    "WBTCUSDCHodlBoosterCall",
                    WBTC.address,
                    USDC.address,
                    WBTC_DECIMALS,
                    USDC_DECIMALS,
                    OptionVault.address
                ],
            },
        },
        libraries: {
            StructureData: structureData.address,
        }
    });

    const wbtcHodlBoosterCall = await ethers.getContractAt(
        "PKKTHodlBoosterCallOption",
        WbtcHodlBoosterCall.address
    );
    console.log(`Deployed ${name} at: ${wbtcHodlBoosterCall.address}`);

    await wbtcHodlBoosterCall.transferOwnership(settler);

    const optionVault = await ethers.getContractAt(OptionVault.abi, OptionVault.address);

    await optionVault.addOption(wbtcHodlBoosterCall.address);
    console.log(`Added ${name} to Option Vault at: ${optionVault.address}`);
}

export default main;