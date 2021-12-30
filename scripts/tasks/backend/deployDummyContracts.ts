import fsPromises from "fs/promises";
import { BigNumber, Signer } from "ethers";

import {
    USDC_DECIMALS,
    WBTC_DECIMALS,
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    NULL_ADDRESS,
    ETH_DECIMALS
} from "../../../constants/constants";
import { PKKTHodlBoosterOption,OptionVault } from "../../../typechain";
import { getDeployedContractHelper } from "./utilities";

const main = async ({ fresh, init }, { network, ethers, deployments, getNamedAccounts }) => {
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
            "OptionVault",
            ethers,
            deployments
        ) as OptionVault;
        await optionVault.connect(settlerSigner as Signer).initiateSettlement();
        console.log("Initialized the current round to :" + (await (await optionVault.currentRound()).toString()));
    }
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

    const ethHodlBoosterCallOption = await deployOptionContract(
        "ETHHodlBoosterCallOption",
        deployer,
        "PKKTHodlBoosterOption",
        settler,
        "ETH-USDC-HodlBooster-Call",
        "ETHUSDCHodlBoosterCall",
        NULL_ADDRESS,
        USDC.address,
        ETH_DECIMALS,
        USDC_DECIMALS,
        optionVault,
        structureData.address,
        true,
        deploy,
        ethers
    );

    const ethHodlBoosterPutOption = await deployOptionContract(
        "ETHHodlBoosterPutOption",
        deployer,
        "PKKTHodlBoosterOption",
        settler,
        "ETH-USDC-HodlBooster-Put",
        "ETHUSDCHodlBoosterPut",
        USDC.address,
        NULL_ADDRESS,
        ETH_DECIMALS,
        USDC_DECIMALS,
        optionVault,
        structureData.address,
        false,
        deploy,
        ethers
    );

    // Eth Ping-pong setup
    ethHodlBoosterCallOption.setCounterPartyOption(ethHodlBoosterPutOption.address);
    ethHodlBoosterPutOption.setCounterPartyOption(ethHodlBoosterCallOption.address);

    await optionVault.addOptionPair({
        callOption: ethHodlBoosterCallOption.address,
        putOption: ethHodlBoosterPutOption.address,
        callOptionDeposit: NULL_ADDRESS,
        putOptionDeposit: USDC.address
    });

    const wbtcHodlBoosterCallOption = await deployOptionContract(
        "WBTCHodlBoosterCallOption",
        deployer,
        "PKKTHodlBoosterOption",
        settler,
        "WBTC-USDC-HodlBooster-Call",
        "WBTCUSDCHodlBoosterCall",
        WBTC.address,
        USDC.address,
        WBTC_DECIMALS,
        USDC_DECIMALS,
        optionVault,
        structureData.address,
        true,
        deploy,
        ethers
    );

    const wbtcHodlBoosterPutOption = await deployOptionContract(
        "WBTCHodlBoosterPutOption",
        deployer,
        "PKKTHodlBoosterOption",
        settler,
        "WBTC-USDC-HodlBooster-Put",
        "WBTCUSDCHodlBoosterPut",
        USDC.address,
        WBTC.address,
        WBTC_DECIMALS,
        USDC_DECIMALS,
        optionVault,
        structureData.address,
        false,
        deploy,
        ethers
    );
    
    // wbtc ping-pong setup
    wbtcHodlBoosterCallOption.setCounterPartyOption(wbtcHodlBoosterPutOption.address);
    wbtcHodlBoosterPutOption.setCounterPartyOption(wbtcHodlBoosterCallOption.address);

    await optionVault.addOptionPair({
        callOption: wbtcHodlBoosterCallOption.address,
        putOption: wbtcHodlBoosterPutOption.address,
        callOptionDeposit: WBTC.address,
        putOptionDeposit: USDC.address
    });
}

const deployOptionContract = async (
    deploymentName: String,
    deployer: any,
    optionType: String,
    settler: any,
    optionName: String,
    optionSymbol: String,
    depositAssetAddress: any,
    counterPartyAddress: any,
    depositAssetDecimals: number,
    counterPartyAssetDecimals: number,
    optionVault: any,
    isCall: boolean,
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
                    isCall ? depositAssetAddress : counterPartyAddress,
                    isCall ? counterPartyAddress : depositAssetAddress,
                    isCall ? depositAssetDecimals: counterPartyAssetDecimals,
                    isCall ? counterPartyAssetDecimals: depositAssetDecimals,
                    optionVault.address,
                    isCall,
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