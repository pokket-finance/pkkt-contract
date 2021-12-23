import fsPromises from "fs/promises";
import { BigNumber } from "ethers";

import {
    USDC_DECIMALS,
    WBTC_DECIMALS,
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    NULL_ADDRESS
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

    const structureData = await deploy("StructureData", {
        from: deployer,
    });

    await deployOptionContract(
        "WBTCHodlBoosterCallOption",
        deployer,
        "PKKTHodlBoosterCallOption",
        settler,
        "WBTC-USDC-HodlBooster-Call",
        "WBTCUSDCHodlBoosterCall",
        WBTC.address,
        USDC.address,
        OptionVault,
        structureData.address,
        deploy,
        ethers
    );

    await deployOptionContract(
        "WBTCHodlBoosterPutOption",
        deployer,
        "PKKTHodlBoosterPutOption",
        settler,
        "WBTC-USDC-HodlBooster-Put",
        "WBTCUSDCHodlBoosterPut",
        WBTC.address,
        USDC.address,
        OptionVault,
        structureData.address,
        deploy,
        ethers
    )

    await deployOptionContract(
        "ETHHodlBoosterCallOption",
        deployer,
        "PKKTHodlBoosterCallOption",
        settler,
        "ETH-USDC-HodlBooster-Call",
        "ETHUSDCHodlBoosterCall",
        NULL_ADDRESS,
        USDC.address,
        OptionVault,
        structureData.address,
        deploy,
        ethers
    )

    await deployOptionContract(
        "ETHHodlBoosterPutOption",
        deployer,
        "PKKTHodlBoosterPutOption",
        settler,
        "ETH-USDC-HodlBooster-Put",
        "ETHUSDCHodlBoosterPut",
        NULL_ADDRESS,
        USDC.address,
        OptionVault,
        structureData.address,
        deploy,
        ethers
    )
}

const deployOptionContract = async (
    deploymentName: String,
    deployer: any,
    optionType: String,
    settler: any,
    optionName: String,
    optionSymbol: String,
    WBTCAddress: any,
    USDCAddress: any,
    OptionVault: any,
    libraryAddress: any,
    deploy: any,
    ethers: any) => {
    const PKKTHodlBoosterOption = await deploy(deploymentName, {
        from: deployer,
        contract: optionType,
        proxy: {
            owner: settler,
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [
                    optionName,
                    optionSymbol,
                    WBTCAddress,
                    USDCAddress,
                    WBTC_DECIMALS,
                    USDC_DECIMALS,
                    OptionVault.address
                ],
            },
        },
        libraries: {
            StructureData: libraryAddress,
        }
    });

    const pkktHodlBoosterOption = await ethers.getContractAt(
        optionType,
        PKKTHodlBoosterOption.address
    );
    console.log(`Deployed ${optionName} at: ${pkktHodlBoosterOption.address}`);

    await pkktHodlBoosterOption.transferOwnership(settler);

    const optionVault = await ethers.getContractAt(OptionVault.abi, OptionVault.address);

    await optionVault.addOption(pkktHodlBoosterOption.address);
    console.log(`Added ${optionName} to Option Vault at: ${optionVault.address}`);
}

export default main;