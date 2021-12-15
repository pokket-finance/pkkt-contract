import { ERC20Mock, OptionVault, PKKTHodlBoosterCallOption, PKKTHodlBoosterOption } from "../typechain";
import axios from "axios";
import express from "express";
import fsPromises from "fs/promises";
import * as dotenv from "dotenv";
dotenv.config();
import { deployments, ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { Contract } from "@ethersproject/contracts";

import { deployContract } from "../test/utilities/deploy";
import { ETH_DECIMALS, NULL_ADDRESS, SETTLEMENTPERIOD, USDC_DECIMALS, WBTC_DECIMALS } from "../constants/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


const USDCMultiplier = BigNumber.from(10).pow(USDC_DECIMALS);  
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);   
const ETHPricePrecision = 4;
const WBTCPricePrecision = 4;
const RationMultiplier = 10000;

const app = express();
const port = 3000;

// Make api request in "/" route
// app.get("/", async (req, res) => {
//     let HodlBoosterOption = await deployments.get("PKKTHodlBoosterCallOption");
//     let hodlBoosterOption = await ethers.getContractAt(
//         "PKKTHodlBoosterCallOption",
//         HodlBoosterOption.address
//     );
//     await getEtherScanData(hodlBoosterOption);
//     res.send("hello");
// });

// // Start the express server
// app.listen(port, () => {
//     console.log(`server is listening on ${port}`);
// });

const main = async () => {
    const [deployer, settler, alice, bob, trader]: SignerWithAddress[] = await ethers.getSigners();
    const [usdc, wbtc, optionVault, wbtcHodlBoosterCallOption] = await getDeployedContracts();
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
    await getVaultInfo();
    await getUsersNAV(alice, bob);
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

const getDeployedContractHelper = async (name: string): Promise<Contract> => {
    const Contract = await deployments.get(name);
    return await ethers.getContractAt(Contract.abi, Contract.address);
}

const getVaultInfo = async () => {
    const optionVault: OptionVault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const wbtc: ERC20Mock = await getDeployedContractHelper("WBTC") as ERC20Mock;
    let maturedAmount: BigNumber = await optionVault.getMaturedAmount(wbtc.address);
    let pendingAmount: BigNumber = await optionVault.getPendingAmount(wbtc.address);
    console.log(`Matured: ${maturedAmount}, Pending: ${pendingAmount}`);
}

const getUsersNAV = async (...users: SignerWithAddress[]) => {
    const wbtcHodlBoosterCallOption: PKKTHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    for(const user of users) {
        let pendingAmount: BigNumber = await wbtcHodlBoosterCallOption
            .connect(user as Signer)
            .getPendingAsset();
        let ongoingAmount: BigNumber = await wbtcHodlBoosterCallOption
            .connect(user as Signer)
            .getOngoingAsset(0);
        let userNAV: BigNumber = pendingAmount.add(ongoingAmount);
        console.log("User NAV: ", userNAV.toString());
    }
}

// Makes api request to etherscan to get data about our options
const getEtherScanData = async (hodlBoosterOption) => {
    console.log(`Retrieving Data from Etherscan for ${hodlBoosterOption.address}`);
    const response = await getData(
        {
            module: "account",
            action: "tokentx",
            address: hodlBoosterOption.address,
            startblock: "0",
            endblock: "99999999",
            page: "1",
            offset: "100",
            sort: "asc"
        }
    );
    const result = response.data.result;
    const blockNumbers = result.map(res => res.blockNumber);
    console.log(blockNumbers);
    for(let blockNumber of blockNumbers) {
        const optionState = await hodlBoosterOption.getRoundData(blockNumber);
        printOptionState(optionState);
    }
}

// Helper function to generate api url and request the endpoint
const getData = async (params) => {
    let url = "https://api-rinkeby.etherscan.io/api?";
    // Generate api url parameters
    url += Object.entries(params).map(([key, value]) => `${key}=${value}`).join("&");
    url += `&apikey=${[process.env.ETHERSCAN_API_KEY]}`;
    return axios.get(url);
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
        price *= (10 ** WBTCPricePrecision);

        let parameters = {
            quota: BigNumber.from(10).mul(WBTCMultiplier),
            pricePrecision: WBTCPricePrecision,
            strikePriceRatio: 0.1 * RationMultiplier,
            premiumRate: 0.02 * RationMultiplier,
            callOrPut: true
        };

        await usdc.transfer(alice.address, BigNumber.from(100).mul(USDCMultiplier));
        await usdc.transfer(bob.address, BigNumber.from(100).mul(USDCMultiplier));
        await usdc.connect(alice as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(100000).mul(USDCMultiplier)
        );
        await usdc.connect(bob as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(100000).mul(USDCMultiplier)
        );
        
        await wbtc.transfer(alice.address, BigNumber.from(10).mul(WBTCMultiplier));
        await wbtc.transfer(bob.address, BigNumber.from(10).mul(WBTCMultiplier));
        await wbtc.connect(alice as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(10).mul(WBTCMultiplier)
        );
        await wbtc.connect(bob as Signer).approve(
            wbtcHodlBoosterCall.address,
            BigNumber.from(10).mul(WBTCMultiplier)
        );

        // Essentially initialzes process
        await wbtcHodlBoosterCall.connect(settler as Signer).rollToNext(parameters);

        await wbtcHodlBoosterCall.connect(alice as Signer).deposit(
            BigNumber.from(2).mul(WBTCMultiplier)
        );
        await wbtcHodlBoosterCall.connect(bob as Signer).deposit(
            BigNumber.from(5).mul(WBTCMultiplier).div(10)
        );

        parameters = {
            quota: BigNumber.from(10).mul(WBTCMultiplier),
            pricePrecision: WBTCPricePrecision,
            strikePriceRatio: 0.1 * RationMultiplier, //10% up
            premiumRate: 0.02 * RationMultiplier, //2% per week
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
                BigNumber.from(1).mul(WBTCMultiplier)
            );
            await wbtcHodlBoosterCall.connect(bob as Signer).deposit(
                BigNumber.from(1).mul(WBTCMultiplier)
            );

            parameters = {
                quota: BigNumber.from(2).mul(WBTCMultiplier), //5eth
                pricePrecision: WBTCPricePrecision,
                strikePriceRatio: 0.1 * RationMultiplier, //10% up
                premiumRate: 0.005 * RationMultiplier, //1% per week
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

main();