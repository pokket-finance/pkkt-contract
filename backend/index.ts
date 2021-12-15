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
    if (true) {
        const dir = `./deployments/hardhat`;
        await removeDirectory(dir);
        await deployContracts(deployer, settler);
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
    }
    await getUserMaturedData(alice);
    await getUserData(alice, bob);
}

const removeDirectory = async (dir) => {
    try {
        await fsPromises.rmdir(dir, { recursive: true });
        console.log(`${dir} removed`);
    } catch (err) {
        console.error(err);
    }
};

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

const getUserMaturedData = async (alice: SignerWithAddress) => {
    const wbtcHodlBoosterCallOption: PKKTHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    let aliceData1 = await wbtcHodlBoosterCallOption.maturedDepositAssetAmount(alice.address);
    let aliceData2 = await wbtcHodlBoosterCallOption.maturedCounterPartyAssetAmount(alice.address);
    console.log(`Alicedata: ${aliceData1}`);
    console.log(`Alice data: ${aliceData2}`);
};

const getUserData = async (...users: SignerWithAddress[]) => {
    const wbtcHodlBoosterCallOption: PKKTHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    let userData: ([BigNumber, number, BigNumber, boolean, BigNumber] & {
        pendingAsset: BigNumber;
        nextCursor: number;
        totalRound: BigNumber;
        hasState: boolean;
        assetToTerminate: BigNumber;
    })[] = [];
    for(const user of users) {
        let datum = await wbtcHodlBoosterCallOption.userStates(user.address);
        userData.push(datum);
    }
    
    for(const userState of userData) {
        await printUserState(userState);
    }
}

const printUserState = async (userState:
    [
        BigNumber,
        number,
        BigNumber,
        boolean,
        BigNumber
    ] & {
        pendingAsset: BigNumber;
        nextCursor: number;
        totalRound: BigNumber;
        hasState: boolean;
        assetToTerminate: BigNumber
    }) => {
    console.log(`Pending Asset (current round): ${userState.pendingAsset.toString()}`);
    console.log("Next cursor: ", userState.nextCursor.toString());
    console.log("Total Round", userState.totalRound.toString());
    console.log("Has State: ", userState.hasState);
    console.log("Asset To Terminate: ", userState.assetToTerminate.toString());
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

// Deploy the initial contracts
const deployContracts = async (deployer: SignerWithAddress, settler: SignerWithAddress) => {

    const { deploy } = await deployments;

    const USDC = await deploy("USDC", {
        contract: "ERC20Mock",
        from: deployer.address,
        args: [
            "USDCToken",
            "USDC",
            BigNumber.from(10000).mul(USDCMultiplier),
            USDC_DECIMALS,
        ],
    });

    const WBTC = await deploy("WBTC", {
        contract: "ERC20Mock",
        from: deployer.address,
        args: [
            "Wrapped BTC",
            "WBTC",
            BigNumber.from(100).mul(WBTCMultiplier),
            WBTC_DECIMALS
        ],
    });

    const OptionVault = await deploy("OptionVault", {
        contract: "OptionVault",
        from: deployer.address,
        args: [
            settler.address,
        ],
    });

    const name = "WBTC-USDC-HodlBooster-Call";
    const structureData = await deploy("StructureData", {
        from: deployer.address,
    });
    const WbtcHodlBoosterCall = await deploy("WBTCHodlBoosterCallOption", {
        from: deployer.address,
        contract: "PKKTHodlBoosterCallOption",
        proxy: {
            owner: settler.address,
            proxyContract: "OpenZeppelinTransparentProxy",
            execute: {
                methodName: "initialize",
                args: [
                    "WBTC-USDC-HodlBooster-Call",
                    "WBTCUSDCHodlBoosterCall",
                    WBTC.address,
                    USDC.address,
                    WBTC_DECIMALS,
                    USDC_DECIMALS,
                    OptionVault.address
                ],
            },
        },
        libraries: {
            StructureData: structureData.address,
        }
    });

    const wbtcHodlBoosterCall = await ethers.getContractAt(
        "PKKTHodlBoosterCallOption",
        WbtcHodlBoosterCall.address
    );
    console.log(`Deployed ${name} at: ${wbtcHodlBoosterCall.address}`);

    await wbtcHodlBoosterCall.transferOwnership(settler.address);

    const optionVault = await ethers.getContractAt(OptionVault.abi, OptionVault.address);

    await optionVault.addOption(wbtcHodlBoosterCall.address);
    console.log(`Added ${name} to Option Vault at: ${optionVault.address}`);
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