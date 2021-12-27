import { BigNumber, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

import {
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterCallOption
} from "../typechain";

import {
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    WBTC_PRICE_PRECISION,
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    OptionExecution
} from "../constants/constants";
import { printOptionState, getDeployedContractHelper } from "./utilities/utilities";
import { PKKTHodlBoosterPutOption } from "../typechain";

async function main() {
    //const { settler, alice, bob, trader} = await getNamedAccounts();
    const [deployer, settler, alice, bob, trader] = await ethers.getSigners();
    const [
        usdc,
        wbtc,
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getDeployedContracts();
    const users = [alice]
    await initializeUsers(usdc, wbtc, wbtcHodlBoosterCallOption, users);
    const wbtcQuota = BigNumber.from(25).mul(WBTC_MULTIPLIER);

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
    await printRoundInformation(wbtcHodlBoosterCallOption);

    // round 2
    await optionVault.connect(settler as Signer).initiateSettlement();
    await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
        BigNumber.from(1).mul(WBTC_MULTIPLIER)
    );
    await optionVault.connect(settler as Signer).settle([]);
    await optionVault.connect(settler as Signer).commitCurrent(commitParams);
    await printRoundInformation(wbtcHodlBoosterCallOption);

    // round 3
    await optionVault.connect(settler as Signer).initiateSettlement();
    await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
        BigNumber.from(1).mul(WBTC_MULTIPLIER)
    );
    await optionVault.connect(settler as Signer).settle(settleParams);
    await optionVault.connect(settler as Signer).commitCurrent(commitParams);
    await printRoundInformation(wbtcHodlBoosterCallOption);

    // round 4
    await optionVault.connect(settler as Signer).initiateSettlement();
    await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
        BigNumber.from(1).mul(WBTC_MULTIPLIER)
    );
    await optionVault.connect(settler as Signer).settle(settleParams);
    await optionVault.connect(settler as Signer).commitCurrent(commitParams);
    await printRoundInformation(wbtcHodlBoosterCallOption);

    let curSettleParams: any = [];
    const period = 6;
    // for(let i = 0; i < period; ++i) {
    //     // Initializes epoch
    //     //await wbtcHodlBoosterCallOption.connect(settler as Signer).rollToNext(wbtcQuota);
    //     await optionVault.connect(settler as Signer).initiateSettlement();

    //     await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
    //         BigNumber.from(1).mul(WBTC_MULTIPLIER)
    //     );
    //     if (i > 1) {
    //         curSettleParams = settleParams
    //     }
    //     // await settlementPeriod(
    //     //     optionVault,
    //     //     wbtcHodlBoosterCallOption,
    //     //     settler,
    //     //     curSettleParams,
    //     //     commitParams
    //     // );
    //     await optionVault.connect(settler as Signer).settle(curSettleParams);
    //     await optionVault.connect(settler as Signer).commitCurrent(commitParams);
    //     await optionVault.connect(settler as Signer).withdrawAsset(settler.address, wbtc.address);
    //     await printRoundInformation(wbtcHodlBoosterCallOption);
    //     // If we have something matured
    //     // if (i > 0) {
    //     //     let wbtcInstruction = await optionVault.settlementInstruction(wbtc.address);
    //     //     await wbtc.connect(trader as Signer).
    //     //         transfer(wbtcInstruction.targetAddress, wbtcInstruction.amount);
    //     //     await optionVault.connect(settler as Signer).finishSettlement();
    //     // }
    // }
}

const initializeUsers = async (usdc: ERC20Mock, wbtc: ERC20Mock, hodlBoosterOption, users: SignerWithAddress[]): Promise<void> => {
    for(let user of users) {
        await usdc.transfer(user.address, BigNumber.from(100).mul(USDC_MULTIPLIER));
        await usdc.connect(user as Signer).approve(
            hodlBoosterOption.address,
            BigNumber.from(100000).mul(USDC_MULTIPLIER)
        );
        await wbtc.transfer(user.address, BigNumber.from(10).mul(WBTC_MULTIPLIER));
        await wbtc.connect(user as Signer).approve(
            hodlBoosterOption.address,
            BigNumber.from(10).mul(WBTC_MULTIPLIER)
        );
    }
}

// Executes one complete settlement period for the PKKTHodlBoosterOption
const settlementPeriod = async (
    optionVault: OptionVault,
    holdBoosterOption: PKKTHodlBoosterOption,
    settler: SignerWithAddress,
    settleParams,
    commitParams) => {
    // await optionVault.connect(settler as Signer).prepareSettlement();
    // await holdBoosterOption.connect(settler as Signer).closePrevious(false);
    // await holdBoosterOption.connect(settler as Signer).commitCurrent(parameters);
    // await optionVault.connect(settler as Signer).startSettlement(trader.address);
    await optionVault.connect(settler as Signer).initiateSettlement();
    await optionVault.connect(settler as Signer).settle(settleParams);
    await optionVault.connect(settler as Signer).commitCurrent(commitParams);
    await printRoundInformation(holdBoosterOption);
}

const getDeployedContracts = async (): Promise<[
    ERC20Mock,
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterCallOption,
    PKKTHodlBoosterPutOption,
    PKKTHodlBoosterCallOption,
    PKKTHodlBoosterPutOption
]> => {
    const usdc = await getDeployedContractHelper("USDC") as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC") as ERC20Mock;
    const optionVault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const ethHodlBoosterCallOption = await getDeployedContractHelper(
        "ETHHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    const ethHodlBoosterPutOption = await getDeployedContractHelper(
        "ETHHodlBoosterPutOption"
    ) as PKKTHodlBoosterPutOption;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    const wbtcHodlBoosterPutOption = await getDeployedContractHelper(
        "WBTCHodlBoosterPutOption"
    ) as PKKTHodlBoosterPutOption;
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

// Helper function to get round and option state from Smart Contract
// Then print the information
const printRoundInformation = async (hodlBoosterOption: PKKTHodlBoosterOption) => {
    let round = await hodlBoosterOption.currentRound();
    let optionState = await hodlBoosterOption.optionStates(round);
    console.log(`Round: ${round}`);
    printOptionState(optionState)
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });