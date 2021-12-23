import fsPromises from "fs/promises";
import { BigNumber } from "ethers";

import {
    USDC_DECIMALS,
    WBTC_DECIMALS,
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    NULL_ADDRESS
} from "../../../constants/constants";
import { PKKTHodlBoosterOption } from "../../../typechain";

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

    const optionVault = await ethers.getContractAt(OptionVault.abi, OptionVault.address);

    const structureData = await deploy("StructureData", {
        from: deployer,
    });

    const wbtcHodlBoosterCallOption = await deployOptionContract(
        "WBTCHodlBoosterCallOption",
        deployer,
        "PKKTHodlBoosterCallOption",
        settler,
        "WBTC-USDC-HodlBooster-Call",
        "WBTCUSDCHodlBoosterCall",
        WBTC.address,
        USDC.address,
        optionVault,
        structureData.address,
        deploy,
        ethers
    );

    const wbtcHodlBoosterPutOption = await deployOptionContract(
        "WBTCHodlBoosterPutOption",
        deployer,
        "PKKTHodlBoosterPutOption",
        settler,
        "WBTC-USDC-HodlBooster-Put",
        "WBTCUSDCHodlBoosterPut",
        WBTC.address,
        USDC.address,
        optionVault,
        structureData.address,
        deploy,
        ethers
    )
    
    // wbtc ping-pong setup
    wbtcHodlBoosterCallOption.setCounterPartyOption(wbtcHodlBoosterPutOption.address);
    wbtcHodlBoosterPutOption.setCounterPartyOption(wbtcHodlBoosterCallOption.address);

    await optionVault.addOptionPair({
        callOption: wbtcHodlBoosterCallOption.address,
        putOption: wbtcHodlBoosterPutOption.address,
        callOptionDeposit: WBTC.address,
        putOptionDeposit: USDC.address
    });

    const ethHodlBoosterCallOption = await deployOptionContract(
        "ETHHodlBoosterCallOption",
        deployer,
        "PKKTHodlBoosterCallOption",
        settler,
        "ETH-USDC-HodlBooster-Call",
        "ETHUSDCHodlBoosterCall",
        NULL_ADDRESS,
        USDC.address,
        optionVault,
        structureData.address,
        deploy,
        ethers
    )

    const ethHodlBoosterPutOption = await deployOptionContract(
        "ETHHodlBoosterPutOption",
        deployer,
        "PKKTHodlBoosterPutOption",
        settler,
        "ETH-USDC-HodlBooster-Put",
        "ETHUSDCHodlBoosterPut",
        NULL_ADDRESS,
        USDC.address,
        optionVault,
        structureData.address,
        deploy,
        ethers
    )

    await optionVault.addOptionPair({
        callOption: ethHodlBoosterCallOption.address,
        putOption: ethHodlBoosterPutOption.address,
        callOptionDeposit: NULL_ADDRESS,
        putOptionDeposit: USDC.address
    })

    // Eth Ping-pong setup
    ethHodlBoosterCallOption.setCounterPartyOption(ethHodlBoosterPutOption.address);
    ethHodlBoosterPutOption.setCounterPartyOption(ethHodlBoosterCallOption.address);
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
    optionVault: any,
    libraryAddress: any,
    deploy: any,
    ethers: any): Promise<PKKTHodlBoosterOption> => {
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
                    optionVault.address,
                    settler
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

    // await optionVault.addOption(pkktHodlBoosterOption.address);
    // console.log(`Added ${optionName} to Option Vault at: ${optionVault.address}`);

    return pkktHodlBoosterOption;
}

export default main;