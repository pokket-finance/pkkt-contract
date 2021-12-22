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
    RATIO_MULTIPLIER
} from "../constants/constants";
import { printOptionState, getDeployedContractHelper } from "./utilities/utilities";

async function main() {
    //const { settler, alice, bob, trader} = await getNamedAccounts();
    const [deployer, settler, alice, bob, trader] = await ethers.getSigners();
    const [usdc, wbtc, optionVault, wbtcHodlBoosterCallOption] = await getDeployedContracts();
    const users = [alice]
    await initializeUsers(usdc, wbtc, wbtcHodlBoosterCallOption, users);
    const wbtcQuota = BigNumber.from(25).mul(WBTC_MULTIPLIER);


    const btcPrice = 50000 * (10**WBTC_PRICE_PRECISION);
    let parameters = {
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePrice: btcPrice, //10% up
            premiumRate: 0.02 * RATIO_MULTIPLIER, //2% per week
    };

    const period = 6;
    for(let i = 0; i < period; ++i) {
        // Initializes epoch
        await wbtcHodlBoosterCallOption.connect(settler as Signer).rollToNext(wbtcQuota);

        await wbtcHodlBoosterCallOption.connect(alice as Signer).deposit(
            BigNumber.from(1).mul(WBTC_MULTIPLIER)
        );
        await settlementPeriod(
            optionVault,
            wbtcHodlBoosterCallOption,
            settler,
            trader,
            BigNumber.from(btcPrice),
            parameters
        );
        // If we have something matured
        if (i > 0) {
            let wbtcInstruction = await optionVault.settlementInstruction(wbtc.address);
            await wbtc.connect(trader as Signer).
                transfer(wbtcInstruction.targetAddress, wbtcInstruction.amount);
            await optionVault.connect(settler as Signer).finishSettlement();
        }
    }
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

const settlementPeriod = async (
    optionVault: OptionVault,
    holdBoosterOption: PKKTHodlBoosterOption,
    settler: SignerWithAddress,
    trader: SignerWithAddress,
    quota: BigNumber,
    parameters) => {
    await optionVault.connect(settler as Signer).prepareSettlement();
    await holdBoosterOption.connect(settler as Signer).closePrevious(false);
    await holdBoosterOption.connect(settler as Signer).commitCurrent(parameters);
    await optionVault.connect(settler as Signer).startSettlement(trader.address);
    await printRoundInformation(holdBoosterOption);
}

const getDeployedContracts = async (): Promise<[
    ERC20Mock,
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterCallOption
]> => {
    const usdc = await getDeployedContractHelper("USDC") as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC") as ERC20Mock;
    const optionVault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    return [usdc, wbtc, optionVault, wbtcHodlBoosterCallOption];
}

// Generate option data on the rinkeby test network
// const generateOptionData = async (
//     settler: SignerWithAddress,
//     alice: SignerWithAddress,
//     bob: SignerWithAddress,
//     trader: SignerWithAddress,
//     usdc: ERC20Mock,
//     wbtc: ERC20Mock,
//     optionVault: OptionVault,
//     wbtcHodlBoosterCall: PKKTHodlBoosterCallOption
// ) => {
//     try {

//         // Essentially initialzes process
//         await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(parameters);

//         await wbtcHodlBoosterCall.connect(alice as Signer).deposit(
//             BigNumber.from(2).mul(WBTC_MULTIPLIER)
//         );
//         await wbtcHodlBoosterCall.connect(bob as Signer).deposit(
//             BigNumber.from(5).mul(WBTC_MULTIPLIER).div(10)
//         );

//         parameters = {
//             quota: BigNumber.from(10).mul(WBTC_MULTIPLIER),
//             pricePrecision: WBTC_PRICE_PRECISION,
//             strikePriceRatio: 0.1 * RATIO_MULTIPLIER, //10% up
//             premiumRate: 0.02 * RATIO_MULTIPLIER, //2% per week
//             callOrPut: true
//         };
//         await settlementPeriod(
//             optionVault,
//             wbtcHodlBoosterCall,
//             settler,
//             trader,
//             price,
//             parameters
//         );

//         const period = 1;
//         for(let i = 0; i < period; ++i) {

//             await wbtcHodlBoosterCall.connect(alice as Signer).deposit(
//                 BigNumber.from(1).mul(WBTC_MULTIPLIER)
//             );
//             await wbtcHodlBoosterCall.connect(bob as Signer).deposit(
//                 BigNumber.from(1).mul(WBTC_MULTIPLIER)
//             );

//             parameters = {
//                 quota: BigNumber.from(2).mul(WBTC_MULTIPLIER), //5eth
//                 pricePrecision: WBTC_PRICE_PRECISION,
//                 strikePriceRatio: 0.1 * RATIO_MULTIPLIER, //10% up
//                 premiumRate: 0.005 * RATIO_MULTIPLIER, //1% per week
//                 callOrPut: true
//             }
//             await settlementPeriod(
//                 optionVault,
//                 wbtcHodlBoosterCall,
//                 settler,
//                 trader,
//                 price,
//                 parameters
//             );
//         }

//         let wbtcInstruction = await optionVault.settlementInstruction(wbtc.address);
//         await wbtc.connect(trader as Signer).
//             transfer(wbtcInstruction.targetAddress, wbtcInstruction.amount);
//         await optionVault.connect(settler as Signer).finishSettlement();
//     } catch(err) {
//         console.error(err);
//     }
// }

// Executes one complete settlement period for the PKKTHodlBoosterOption


// // Helper function to get round and option state from Smart Contract
// // Then print the information
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