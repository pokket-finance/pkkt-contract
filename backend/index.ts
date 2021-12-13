import { ERC20Mock, OptionVault, PKKTHodlBoosterCallOption, PKKTHodlBoosterOption } from "../typechain";
import axios from "axios";
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

const main = async () => {
    //const hodlBoosterOption = await loadOptionData();
    //let hodlBoosterOption = ethers.getContractAt("PKKTHodlBoosterCallOption", "0x70613A63Ed0E852ae1684cd53Aa309469641b601");
    let HodlBoosterOption = await deployments.get("PKKTHodlBoosterCallOption");
    let hodlBoosterOption = await ethers.getContractAt(
        "PKKTHodlBoosterCallOption",
        HodlBoosterOption.address
    );
    await getEtherScanData(hodlBoosterOption);
}

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

const getData = async (params) => {
    let url = "https://api-rinkeby.etherscan.io/api?";
    // Generate api url parameters
    url += Object.entries(params).map(([key, value]) => `${key}=${value}`).join("&");
    url += `&apikey=${[process.env.ETHERSCAN_API_KEY]}`;
    return axios.get(url);
}

const loadOptionData = async () => {
    try {
        // GET TEST ETHER FOR OTHER ACCOUNTS
        const [deployer, settler, alice, bob, trader] = await ethers.getSigners();
        
        // Grab ethereum price from etherscan
        // const response = await getData(
        //     {
        //         module: "stats",
        //         action: "wbtcprice"
        //     }
        // );
        //let price = response.data.result.btcusd;
        let price = 40000;
        price *= (10 ** WBTCPricePrecision);

        let parameters = {
            quota: BigNumber.from(10).mul(WBTCMultiplier),
            pricePrecision: WBTCPricePrecision,
            strikePriceRatio: 0.1 * RationMultiplier,
            interestRate: 0.025 * RationMultiplier,
            callOrPut: true
        };

        const [
            usdc,
            wbtc,
            optionVault,
            wbtcHoldBoosterCall
        ] = await initializeContracts(deployer, settler);

        await usdc.transfer(alice.address, BigNumber.from(100).mul(USDCMultiplier));
        await usdc.transfer(bob.address, BigNumber.from(100).mul(USDCMultiplier));
        await usdc.connect(alice as Signer).approve(
            wbtcHoldBoosterCall.address,
            BigNumber.from(100000).mul(USDCMultiplier)
        );
        await usdc.connect(bob as Signer).approve(
            wbtcHoldBoosterCall.address,
            BigNumber.from(100000).mul(USDCMultiplier)
        );
        
        await wbtc.transfer(alice.address, BigNumber.from(10).mul(WBTCMultiplier));
        await wbtc.transfer(bob.address, BigNumber.from(10).mul(WBTCMultiplier));
        await wbtc.connect(alice as Signer).approve(
            wbtcHoldBoosterCall.address,
            BigNumber.from(10).mul(WBTCMultiplier)
        );
        await wbtc.connect(bob as Signer).approve(
            wbtcHoldBoosterCall.address,
            BigNumber.from(10).mul(WBTCMultiplier)
        );

        await wbtcHoldBoosterCall.connect(settler as Signer).rollToNext(parameters);

        await wbtcHoldBoosterCall.connect(alice as Signer).deposit(
            BigNumber.from(2).mul(WBTCMultiplier)
        );
        await wbtcHoldBoosterCall.connect(bob as Signer).deposit(
            BigNumber.from(1).mul(WBTCMultiplier)
        );

        await optionVault.allSettled();

        parameters = {
            quota: BigNumber.from(10).mul(WBTCMultiplier),
            pricePrecision: WBTCPricePrecision,
            strikePriceRatio: 0.1 * RationMultiplier, //10% up
            interestRate: 0.02 * RationMultiplier, //2% per week
            callOrPut: true
        };
        await settlementPeriod(
            optionVault,
            wbtcHoldBoosterCall,
            settler,
            trader,
            price,
            parameters
        );

        await optionVault.allSettled();

        const period = 1;
        for(let i = 0; i < period; ++i) {

            await wbtcHoldBoosterCall.connect(alice as Signer).deposit(
                BigNumber.from(1).mul(WBTCMultiplier).div(10)
            );
            await wbtcHoldBoosterCall.connect(bob as Signer).deposit(
                BigNumber.from(1).mul(WBTCMultiplier).div(10)
            );

            parameters = {
                quota: BigNumber.from(10).mul(WBTCMultiplier), //5eth
                pricePrecision: WBTCPricePrecision,
                strikePriceRatio: 0.1 * RationMultiplier, //10% up
                interestRate: 0.01 * RationMultiplier, //1% per week
                callOrPut: true
            }
            await settlementPeriod(
                optionVault,
                wbtcHoldBoosterCall,
                settler,
                trader,
                price,
                parameters
            );
        }
        return wbtcHoldBoosterCall;
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

    await optionVault.connect(settler as Signer).startSettlement(trader.address);

    // parameters = {
    //     quota: BigNumber.from(50).mul(WBTCMultiplier), //5eth
    //     pricePrecision: WBTCPricePrecision,
    //     strikePriceRatio: 0.1 * RationMultiplier, //10% up
    //     interestRate: 0.02 * RationMultiplier, //2% per week
    //     callOrPut: true
    // };
    await holdBoosterOption.connect(settler as Signer).rollToNext(parameters)
}

const initializeContracts = async (
    deployer: SignerWithAddress,
    settler: SignerWithAddress
    ): Promise<[ERC20Mock, ERC20Mock, OptionVault, PKKTHodlBoosterCallOption]> => {

    const { deploy } = await deployments;

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

    const wbtc: ERC20Mock = await deployContract(
        "ERC20Mock",
        deployer as Signer,
        [
            "Wraped BTC",
            "WBTC",
            BigNumber.from(100).mul(WBTCMultiplier),
            WBTC_DECIMALS
        ]
    ) as ERC20Mock;

    const optionVault: OptionVault = await deployContract(
        "OptionVault",
        deployer as Signer,
        [settler.address]
    ) as OptionVault;

    const name = "WBTC-USDC-HodlBooster-Call";
    // const wbtcHodlBoosterCall: PKKTHodlBoosterCallOption = await deployContract(
    //     "PKKTHodlBoosterCallOption",
    //     deployer as Signer,
    //     [
    //         name,
    //         "WBTCUSDCHodlBoosterCall",
    //         wbtc.address,
    //         usdc.address,
    //         ETH_DECIMALS,
    //         USDC_DECIMALS,
    //         optionVault.address
    //     ]
    // ) as PKKTHodlBoosterCallOption;
    const WbtcHodlBoosterCall = await deploy("PKKTHodlBoosterCallOption", {
        from: deployer.address,
        contract: "PKKTHodlBoosterCallOption",
        args: [
            "WBTC-USDC-HodlBooster-Call",
            "WBTCUSDCHodlBoosterCall",
            wbtc.address,
            usdc.address,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            optionVault.address
        ]
    });
    const wbtcHodlBoosterCall = await ethers.getContractAt(
        "PKKTHodlBoosterCallOption",
        WbtcHodlBoosterCall.address
    );
    console.log(`Deployed ${name} at: ${wbtcHodlBoosterCall.address}`);

    await wbtcHodlBoosterCall.transferOwnership(settler.address);

    await optionVault.addOption(wbtcHodlBoosterCall.address);
    console.log(`Added ${name} to Option Vault at: ${optionVault.address}`);

    return [usdc, wbtc, optionVault, wbtcHodlBoosterCall];
}

const printRoundInformation = async (hodlBoosterOption: PKKTHodlBoosterOption) => {
    let round = await hodlBoosterOption.currentRound();
    let optionState = await hodlBoosterOption.optionStates(round);
    console.log(`Round: ${round}`);
    printOptionState(optionState)
}

const printOptionState = async (optionState) => {
    console.log(`Underyling Price: ${optionState.underlyingPrice.toString()}`);
    console.log(`Total Amount: ${optionState.totalAmount.toString()}`);
    console.log(`Price Precision: ${optionState.pricePrecision.toString()}`);
    console.log(`Interest Rate: ${optionState.interestRate.toString()}`);
    console.log(`Executed: ${optionState.executed}`);
    console.log(`Strike Price: ${optionState.strikePrice.toString()}\n`);
}

main();