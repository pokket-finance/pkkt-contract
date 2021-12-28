import { BigNumber, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterOption,
} from "../../../typechain";

import {
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    WBTC_PRICE_PRECISION,
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    OptionExecution
} from "../../../constants/constants";
import { getDeployedContractHelper } from "./utilities";

async function main(taskArgs, { ethers, deployments }) {
    const [deployer, settler, alice, bob, trader] = await ethers.getSigners();
    const [
        usdc,
        wbtc,
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getDeployedContracts(ethers, deployments);
    const users = [alice]

    const ethPrice = 4000 * (10**ETH_PRICE_PRECISION);
    const btcPrice = 50000 * (10**WBTC_PRICE_PRECISION);

    let settleParams = [
        {
            callOption: ethHodlBoosterCallOption.address,
            putOption: ethHodlBoosterPutOption.address,
            execute: OptionExecution.NoExecution
        },
        {
            callOption: wbtcHodlBoosterCallOption.address,
            putOption: wbtcHodlBoosterPutOption.address,
            execute: OptionExecution.NoExecution
        }
    ];

    let commitParams = [
        {
            pricePrecision: ETH_PRICE_PRECISION,
            strikePrice: ethPrice,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: ethHodlBoosterCallOption.address
        },
        {
            pricePrecision: ETH_PRICE_PRECISION,
            strikePrice: ethPrice,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: ethHodlBoosterPutOption.address
        },
        {
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePrice: btcPrice,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterCallOption.address
        },
        {
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePrice: btcPrice,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterPutOption.address
        }
    ];
    // round 1
    await optionVault.connect(settler as Signer).initiateSettlement();
    await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
        BigNumber.from(1).mul(WBTC_MULTIPLIER)
    );
   // await printRoundInformation(wbtcHodlBoosterCallOption);


    // round 2
    // await optionVault.connect(settler as Signer).initiateSettlement();
    // await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
    //     BigNumber.from(1).mul(WBTC_MULTIPLIER)
    // );
    // await optionVault.connect(settler as Signer).settle([]);
    // await optionVault.connect(settler as Signer).setOptionParameters(commitParams);
    // // //await printRoundInformation(wbtcHodlBoosterCallOption);

    // // // round 3
    // await optionVault.connect(settler as Signer).initiateSettlement();
    // await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
    //     BigNumber.from(1).mul(WBTC_MULTIPLIER)
    // );
    // await optionVault.connect(settler as Signer).settle(settleParams);
    // await optionVault.connect(settler as Signer).setOptionParameters(commitParams);
    // //await printRoundInformation(wbtcHodlBoosterCallOption);

    // // round 4
    // await optionVault.connect(settler as Signer).initiateSettlement();
    // await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
    //     BigNumber.from(1).mul(WBTC_MULTIPLIER)
    // );
    // await optionVault.connect(settler as Signer).settle(settleParams);
    // await optionVault.connect(settler as Signer).commitCurrent(commitParams);
    //await printRoundInformation(wbtcHodlBoosterCallOption);
}

const getDeployedContracts = async (ethers, deployments): Promise<[
    ERC20Mock,
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterOption
]> => {
    const usdc = await getDeployedContractHelper("USDC", ethers, deployments) as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC", ethers, deployments) as ERC20Mock;
    const optionVault = await getDeployedContractHelper("OptionVault", ethers, deployments) as OptionVault;
    const ethHodlBoosterCallOption = await getDeployedContractHelper(
        "ETHHodlBoosterCallOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    const ethHodlBoosterPutOption = await getDeployedContractHelper(
        "ETHHodlBoosterPutOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterPutOption = await getDeployedContractHelper(
        "WBTCHodlBoosterPutOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterOption;
    return [
        usdc,
        wbtc,
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ];
}

export default main;