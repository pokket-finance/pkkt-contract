import { ERC20Mock, OptionVault, PKKTHodlBoosterCallOption, PKKTHodlBoosterOption } from "../typechain";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { Contract } from "@ethersproject/contracts";

import { deployContract } from "../test/utilities/deploy";
import { ETH_DECIMALS, NULL_ADDRESS, SETTLEMENTPERIOD, USDC_DECIMALS } from "../constants/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const url = `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${[process.env.ETHERSCAN_API_KEY]}`;
const USDCMultiplier = BigNumber.from(10).pow(USDC_DECIMALS);
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);
const ETHPricePrecision = 4;
const RationMultiplier = 10000;  

const main = async () => {
    await loadOptionData();
}

const getEtherScanData = async () => {
    
}

const loadOptionData = async () => {
    try {
        const [deployer, settler, alice, bob, trader] = await ethers.getSigners();

        const users = [alice, bob];
        
        // Grab ethereum price from etherscan
        const response = await axios.get(url);
        let ethPrice = response.data.result.ethusd;
        ethPrice *= (10 ** ETHPricePrecision);

        let parameters = {
            quota: BigNumber.from(10).mul(ETHMultiplier),
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultiplier,
            interestRate: 0.025 * RationMultiplier,
            callOrPut: true
        };

        const [
            usdc,
            optionVault,
            ethHodlBoosterCall
        ] = await initializeContracts(deployer, settler);

        await usdc.transfer(alice.address, BigNumber.from(100).mul(USDCMultiplier));
        await usdc.transfer(bob.address, BigNumber.from(100).mul(USDCMultiplier));

        await ethHodlBoosterCall.connect(settler as Signer).rollToNext(parameters);
        await ethHodlBoosterCall.connect(alice as Signer).depositETH(
            { value: BigNumber.from(4).mul(ETHMultiplier) }
        );
        await ethHodlBoosterCall.connect(bob as Signer).depositETH(
            { value: BigNumber.from(6).mul(ETHMultiplier) }
        );
        printOptionState(ethHodlBoosterCall);

        await optionVault.allSettled();

        parameters = {
            quota: BigNumber.from(50).mul(ETHMultiplier), //5eth
            pricePrecision: ETHPricePrecision,
            strikePriceRatio: 0.1 * RationMultiplier, //10% up
            interestRate: 0.02 * RationMultiplier, //2% per week
            callOrPut: true
        };
        await settlementPeriod(
            optionVault,
            ethHodlBoosterCall,
            settler,
            trader,
            ethPrice,
            parameters
        );

        await optionVault.allSettled();

        const period = 1;
        for(let i = 0; i < period; ++i) {

            await ethHodlBoosterCall.connect(alice as Signer).depositETH(
                { value: BigNumber.from(1).mul(ETHMultiplier) }
            );
            await ethHodlBoosterCall.connect(bob as Signer).depositETH(
                { value: BigNumber.from(1).mul(ETHMultiplier) }
            );

            parameters = {
                quota: BigNumber.from(50).mul(ETHMultiplier), //5eth
                pricePrecision: ETHPricePrecision,
                strikePriceRatio: 0.1 * RationMultiplier, //10% up
                interestRate: 0.01 * RationMultiplier, //1% per week
                callOrPut: true
            }
            settlementPeriod(
                optionVault,
                ethHodlBoosterCall,
                settler,
                trader,
                ethPrice,
                parameters
            );
        }
    } catch(err) {
        console.error(err);
    }
}

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
    //printOptionState(holdBoosterOption);

    await optionVault.connect(settler as Signer).startSettlement(trader.address);

    parameters = {
        quota: BigNumber.from(50).mul(ETHMultiplier), //5eth
        pricePrecision: ETHPricePrecision,
        strikePriceRatio: 0.1 * RationMultiplier, //10% up
        interestRate: 0.02 * RationMultiplier, //2% per week
        callOrPut: true
    };
    await holdBoosterOption.connect(settler as Signer).rollToNext(parameters)
    //printOptionState(holdBoosterOption);
}

const initializeContracts = async (
    deployer: SignerWithAddress,
    settler: SignerWithAddress
    ): Promise<[ERC20Mock, OptionVault, PKKTHodlBoosterCallOption]> => {
    const usdc: ERC20Mock = await deployContract(
        "ERC20Mock",
        deployer as Signer,
        [
            "USDCToken",
            "USDC",
            BigNumber.from(10000).mul(USDCMultiplier),
            USDC_DECIMALS
        ]
    ) as ERC20Mock;

    const optionVault: OptionVault = await deployContract(
        "OptionVault",
        deployer as Signer,
        [settler.address]
    ) as OptionVault;

    const name = "ETH-USDC-HodlBooster-Call";
    const ethHodlBoosterCall: PKKTHodlBoosterCallOption = await deployContract(
        "PKKTHodlBoosterCallOption",
        deployer as Signer,
        [
            name,
            "ETHUSDCHodlBoosterCall",
            NULL_ADDRESS,
            usdc.address,
            ETH_DECIMALS,
            USDC_DECIMALS,
            optionVault.address
        ]
    ) as PKKTHodlBoosterCallOption;
    console.log(`Deployed ${name} at: ${ethHodlBoosterCall.address}`);

    await ethHodlBoosterCall.transferOwnership(settler.address);

    await optionVault.addOption(ethHodlBoosterCall.address);
    console.log(`Added ${name} to Option Vault at: ${optionVault.address}`);

    return [usdc, optionVault, ethHodlBoosterCall];
}

const printOptionState = async (hodlBoosterOption: PKKTHodlBoosterOption) => {
    let round = await hodlBoosterOption.currentRound();
    let optionState = await hodlBoosterOption.optionStates(round);
    console.log(`Round: ${round}`);
    console.log(`Underyling Price: ${optionState.underlyingPrice.toString()}`);
    console.log(`Total Amount: ${optionState.totalAmount.toString()}`);
    console.log(`Price Precision: ${optionState.pricePrecision.toString()}`);
    console.log(`Interest Rate: ${optionState.interestRate.toString()}`);
    console.log(`Executed: ${optionState.executed}`);
    console.log(`Strike Price: ${optionState.strikePrice.toString()}\n`);
}

main();