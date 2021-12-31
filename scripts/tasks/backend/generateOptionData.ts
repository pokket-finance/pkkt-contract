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
    ETH_MULTIPLIER,
    WBTC_PRICE_PRECISION,
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    OptionExecution
} from "../../../constants/constants";
import { getDeployedContractHelper } from "./utilities";

async function main({ command }, { ethers, deployments }) {
    console.log("Generating option data...");
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
            strikePrice: ethPrice*1.05,
            pricePrecision: ETH_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: ethHodlBoosterCallOption.address
          },  
          {
            strikePrice: ethPrice*0.95,
            pricePrecision: ETH_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: ethHodlBoosterPutOption.address
          },
          {
            strikePrice: btcPrice*1.05,
            pricePrecision: WBTC_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterCallOption.address
          }, 
          {
            strikePrice: btcPrice * 0.95,
            pricePrecision: WBTC_PRICE_PRECISION,
            premiumRate: 0.025 * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterPutOption.address
          },
    ];

    // Set Option Parameters
    if (command == 1) {
        // round 1
        await optionVault.connect(settler as Signer).initiateSettlement();

        await ethHodlBoosterCallOption.connect(alice as Signer).depositETH(
            { value: BigNumber.from(5).mul(ETH_MULTIPLIER) }
        );
        await ethHodlBoosterPutOption.connect(alice as Signer).deposit(
            BigNumber.from(6000).mul(USDC_MULTIPLIER)
        );
        await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
            BigNumber.from(3).mul(WBTC_MULTIPLIER)
        );
        await wbtcHodlBoosterPutOption.connect(bob as Signer).deposit(
            BigNumber.from(50000).mul(USDC_MULTIPLIER)
        );

        // round 2
        await optionVault.connect(settler as Signer).initiateSettlement();

        await ethHodlBoosterCallOption.connect(alice as Signer).depositETH(
            { value: BigNumber.from(1).mul(ETH_MULTIPLIER) }
        );
        await ethHodlBoosterPutOption.connect(alice as Signer).deposit(
            BigNumber.from(4000).mul(USDC_MULTIPLIER)
        );
        await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
            BigNumber.from(1).mul(WBTC_MULTIPLIER)
        );
        await wbtcHodlBoosterPutOption.connect(bob as Signer).deposit(
            BigNumber.from(150000).mul(USDC_MULTIPLIER)
        );

        await optionVault.connect(settler as Signer).settle([]);
        //await optionVault.connect(settler as Signer).setOptionParameters(commitParams);
        //await optionVault.connect(settler as Signer).initiateSettlement();
    }

    // initiate settlement
    else if (command == 2) {
        await optionVault.connect(settler as Signer).initiateSettlement();
        //await optionVault.connect(settler as Signer).setOptionParameters(commitParams);
        //await optionVault.connect(settler as Signer).settle(settleParams);
    }
    else if (command == 3) {

    }
    // await optionVault.connect(settler as Signer).setOptionParameters(commitParams);

    // // round 4
    // await optionVault.connect(settler as Signer).initiateSettlement();
    // await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
    //     BigNumber.from(1).mul(WBTC_MULTIPLIER)
    // );
    // await optionVault.connect(settler as Signer).settle(settleParams);
    // await optionVault.connect(settler as Signer).commitCurrent(commitParams);
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