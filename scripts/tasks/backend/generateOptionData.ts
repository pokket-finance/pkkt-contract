import { BigNumber, Contract, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterCallOption
} from "../../../typechain";

import {
    USDC_MULTIPLIER,
    WBTC_MULTIPLIER,
    WBTC_PRICE_PRECISION,
    RATIO_MULTIPLIER
} from "../../../constants/constants";

const main = async (args, { ethers, deployments }) => {
    //const { settler, alice, bob, trader} = await getNamedAccounts();
    const [deployer, settler, alice, bob, trader] = await ethers.getSigners();
    const [usdc, wbtc, optionVault, wbtcHodlBoosterCallOption] = await getDeployedContracts(ethers, deployments);
    await generateOptionData(
        settler,
        alice,
        bob,
        trader,
        usdc,
        wbtc,
        optionVault,
        wbtcHodlBoosterCallOption
    );
}

const getDeployedContracts = async (ethers, deployments): Promise<[
    ERC20Mock,
    ERC20Mock,
    OptionVault,
    PKKTHodlBoosterCallOption
]> => {
    const usdc = await getDeployedContractHelper("USDC", ethers, deployments) as ERC20Mock;
    const wbtc = await getDeployedContractHelper("WBTC", ethers, deployments) as ERC20Mock;
    const optionVault = await getDeployedContractHelper("OptionVault", ethers, deployments) as OptionVault;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption",
        ethers,
        deployments
    ) as PKKTHodlBoosterCallOption;
    return [usdc, wbtc, optionVault, wbtcHodlBoosterCallOption];
}

const getDeployedContractHelper = async (name: string, ethers, deployments): Promise<Contract> => {
    const Contract = await deployments.get(name);
    return await ethers.getContractAt(Contract.abi, Contract.address);
}

// Generate option data on the rinkeby test network
const generateOptionData = async (
    settler: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress,
    trader: SignerWithAddress,
    usdc: ERC20Mock,
    wbtc: ERC20Mock,
    optionVault: OptionVault,
    wbtcHodlBoosterCall: PKKTHodlBoosterCallOption
) => {
    try {
        
        let price = 40000;
        price *= (10 ** WBTC_PRICE_PRECISION);

        let parameters = {
            quota: BigNumber.from(10).mul(WBTC_MULTIPLIER),
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePriceRatio: 0.1 * RATIO_MULTIPLIER,
            premiumRate: 0.02 * RATIO_MULTIPLIER,
            callOrPut: true
        };

        await usdc.transfer(alice.address, BigNumber.from(100).mul(USDC_MULTIPLIER));
        await usdc.transfer(bob.address, BigNumber.from(100).mul(USDC_MULTIPLIER));
        await usdc.connect(alice as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(100000).mul(USDC_MULTIPLIER)
        );
        await usdc.connect(bob as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(100000).mul(USDC_MULTIPLIER)
        );
        
        await wbtc.transfer(alice.address, BigNumber.from(10).mul(WBTC_MULTIPLIER));
        await wbtc.transfer(bob.address, BigNumber.from(10).mul(WBTC_MULTIPLIER));
        await wbtc.connect(alice as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(10).mul(WBTC_MULTIPLIER)
        );
        await wbtc.connect(bob as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(10).mul(WBTC_MULTIPLIER)
        );

        // Essentially initialzes process
        await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(parameters);

        await wbtcHodlBoosterCall.connect(alice as Signer).deposit(
            BigNumber.from(2).mul(WBTC_MULTIPLIER)
        );
        await wbtcHodlBoosterCall.connect(bob as Signer).deposit(
            BigNumber.from(5).mul(WBTC_MULTIPLIER).div(10)
        );

        parameters = {
            quota: BigNumber.from(10).mul(WBTC_MULTIPLIER),
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePriceRatio: 0.1 * RATIO_MULTIPLIER, //10% up
            premiumRate: 0.02 * RATIO_MULTIPLIER, //2% per week
            callOrPut: true
        };
        await settlementPeriod(
            optionVault,
            wbtcHodlBoosterCall,
            settler,
            trader,
            price,
            parameters
        );

        const period = 1;
        for(let i = 0; i < period; ++i) {

            await wbtcHodlBoosterCall.connect(alice as Signer).deposit(
                BigNumber.from(1).mul(WBTC_MULTIPLIER)
            );
            await wbtcHodlBoosterCall.connect(bob as Signer).deposit(
                BigNumber.from(1).mul(WBTC_MULTIPLIER)
            );

            parameters = {
                quota: BigNumber.from(2).mul(WBTC_MULTIPLIER), //5eth
                pricePrecision: WBTC_PRICE_PRECISION,
                strikePriceRatio: 0.1 * RATIO_MULTIPLIER, //10% up
                premiumRate: 0.005 * RATIO_MULTIPLIER, //1% per week
                callOrPut: true
            }
            await settlementPeriod(
                optionVault,
                wbtcHodlBoosterCall,
                settler,
                trader,
                price,
                parameters
            );
        }

        let wbtcInstruction = await optionVault.settlementInstruction(wbtc.address);
        await wbtc.connect(trader as Signer).
            transfer(wbtcInstruction.targetAddress, wbtcInstruction.amount);
        await optionVault.connect(settler as Signer).finishSettlement();
    } catch(err) {
        console.error(err);
    }
}

// Executes one complete settlement period for the PKKTHodlBoosterOption
const settlementPeriod = async (
    optionVault: OptionVault,
    holdBoosterOption: PKKTHodlBoosterOption,
    settler: SignerWithAddress,
    trader: SignerWithAddress,
    price: number,
    parameters) => {
    await optionVault.connect(settler as Signer).prepareSettlement();
    await holdBoosterOption.connect(settler as Signer).closePrevious(price);
    await holdBoosterOption.connect(settler as Signer).commitCurrent();
    await optionVault.connect(settler as Signer).startSettlement(trader.address);
    await printRoundInformation(holdBoosterOption);
    await holdBoosterOption.connect(settler as Signer).rollToNext(parameters)
}

// Helper function to get round and option state from Smart Contract
// Then print the information
const printRoundInformation = async (hodlBoosterOption: PKKTHodlBoosterOption) => {
    let round = await hodlBoosterOption.currentRound();
    let optionState = await hodlBoosterOption.optionStates(round);
    console.log(`Round: ${round}`);
    printOptionState(optionState)
}

// Helper function to print the given option state
const printOptionState = async (optionState) => {
    console.log(`Underyling Price: ${optionState.underlyingPrice.toString()}`);
    console.log(`Total Amount: ${optionState.totalAmount.toString()}`);
    console.log(`Price Precision: ${optionState.pricePrecision.toString()}`);
    console.log(`Premium Rate: ${optionState.premiumRate.toString()}`);
    console.log(`Executed: ${optionState.executed}`);
    console.log(`Strike Price: ${optionState.strikePrice.toString()}\n`);
}

export default main;