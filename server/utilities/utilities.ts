import { BigNumber, Contract, Signer, Wallet, ethers } from "ethers"; 
import axios from "axios";
import nodemailer from "nodemailer";

import { OptionExecution, NULL_ADDRESS, ETH_USDC_OPTION_ID, WBTC_USDC_OPTION_ID } from "./constants";
 
import { getPKKTHodlBoosterOptionContract,PKKTHodlBoosterOption, 
getERC20TokenContract, ERC20 } from "@pokket-finance/smartcontract";  

import * as dotenv from "dotenv";
dotenv.config();
export type PredictedData = { 
    pairId: number,
    callStrike: number,
    putStrike: number,
    callPremium: number,
    putPremium: number
};

export type PredictedDataArray = {
    data: PredictedData[]
};
// type OptionState = {
//         round: BigNumber;
//         totalAmount: BigNumber;
//         strikePrice: BigNumber;
//         premiumRate: number;
//         pricePrecision: number;
//         executed: boolean;
//         callOrPut: boolean;
// }
export let transporter;
// TODO initialize emailer with actual email server
export async function initializeEmailer() {
    let testAccount = await nodemailer.createTestAccount();

    // object used for sending emails
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
}
 
export let predictedDataDb;

export async function initializePredictedData() {
    
    const JSONdb = require('simple-json-db');
    predictedDataDb = new JSONdb('predictedData.json'); 
}

/**
 * Retrieves the contract from deployments
 * and creates an object from Contract abi and address
 * @param name name of the contract to get from deployments
 * @returns contract object
 */
export async function getPKKTHodlBoosterOption(): Promise<PKKTHodlBoosterOption> {
  
    let address: string;
    address = process.env.VAULT_ADDRESS ?? ""; //should not happen
    return await getPKKTHodlBoosterOptionContract(address, settlerWallet);
}

export async function getWBTC(): Promise<ERC20> {
    
    let address: string;
    address = process.env.WBTC_ADDRESS ?? ""; //should not happen
    return await getERC20TokenContract(address, settlerWallet);
}
export async function getUSDC(): Promise<ERC20> {
    
    let address: string;
    address = process.env.USDC_ADDRESS ?? ""; //should not happen
    return await getERC20TokenContract(address, settlerWallet);
}
/**
 * Gets the tvl option data
 * @param options ethcall, ethput, wbtccall, wbtcput options
 * @param vault vault managing the options
 * @returns tvl option data including ongoing, locked, pending, released, and released counterparty
 */
export async function getTVLOptionData(options, vault) {
    let optionData: any = [];
    for(const option of options) {
        let name = await option.name();
        let assetDecimals = await option.depositAssetAmountDecimals();
        let counterPartyDecimals = await option.counterPartyAssetAmountDecimals();
        let optionTVL = await option.getOptionSnapShot();

        optionData.push(
            {
                name,
                active: ethers.utils.formatUnits(optionTVL.totalOngoing, assetDecimals),
                locked: ethers.utils.formatUnits(optionTVL.totalLocked, assetDecimals),
                pending: ethers.utils.formatUnits(optionTVL.totalPending, assetDecimals),
                released: ethers.utils.formatUnits(optionTVL.totalReleasedDeposit, assetDecimals),
                releasedCounterParty: ethers.utils.formatUnits(optionTVL.totalReleasedCounterParty, counterPartyDecimals)
            }
        );
    }
    return optionData;
}

/**
 * Sets the settlement parameters and settles the option vault
 * @param ethDecision exercise decision for the eth options
 * can only exercise one or none of the options they are European
 * @param wbtcDecision exercise decision for the wbtc options
 * can only exercise one or none of the options as they are European
 */
export async function setSettlementParameters(ethDecision: OptionExecution, wbtcDecision: OptionExecution) {
    const optionVault = await getPKKTHodlBoosterOption();
 
    const settleParameters = [ ethDecision, wbtcDecision];

    try {
        await optionVault.settle(settleParameters);
    } catch (err) {
        console.error(err);
    }
}

type SettlementAccountingResult = {
    round: BigNumber
    depositAmount: BigNumber 
    autoRollAmount: BigNumber
    autoRollPremium: BigNumber 
    releasedAmount: BigNumber 
    releasedPremium: BigNumber
    autoRollCounterPartyAmount: BigNumber
    autoRollCounterPartyPremium: BigNumber
    releasedCounterPartyAmount: BigNumber
    releasedCounterPartyPremium: BigNumber
    option: String
    executed: Boolean
}

type OptionPairExecutionAccountingResult = {  
    callOptionResult: SettlementAccountingResult
    putOptionResult: SettlementAccountingResult
    execute: OptionExecution
}

export function packOptionParameter (strikePrice: number, premiumRate: number): BigNumber { 
    return BigNumber.from(strikePrice).shl(16).or(BigNumber.from(premiumRate));
 }
 
/**
 * Determines whether or not we can settle the vault
 * @param vault option vault to get execution accounting result
 * @param settler allows us to connect to vault
 * @param round checks if the option parameters are set
 * @returns whether or not we can settle the vault
 */
 export async function canSettle(vault: PKKTHodlBoosterOption): Promise<boolean> {
    return await vault.underSettlement();
}

export async function canShowMoneyMovement(vault: PKKTHodlBoosterOption, round): Promise<boolean> {
    return !(await canSettle(vault)) && round > 2;
}

/**
 * Checks if the option parameters are set for the given round.
 * @param round round to check
 * @returns whether or not the option parameters are set
 */
export async function areOptionParamsSet(round: number): Promise<boolean> {
    if (round === 0) {
        return false;
    }
    const vault = await getPKKTHodlBoosterOption();

    const optionStates = await getOptionStateData(vault, round);
    for (let optionState of optionStates) {
        if (!optionState.strikePrice.isZero() || optionState.premiumRate !== 0) {
            return true;
        }
    }
    return false;
}

export async function getOptionStateData(vault: PKKTHodlBoosterOption, round: number) {
    let ethOption = await vault.optionPairs(ETH_USDC_OPTION_ID);
    let wbtcOption = await vault.optionPairs(WBTC_USDC_OPTION_ID);
    const ethCallOptionState = await vault.getOptionStateByRound(
        ethOption.callOptionId,
        round - 1
    );
    const ethPutOptionState = await vault.getOptionStateByRound(
        ethOption.putOptionId,
        round - 1
    );
    const wbtcCallOptionState = await vault.getOptionStateByRound(
        wbtcOption.callOptionId,
        round - 1
    );
    const wbtcPutOptionState = await vault.getOptionStateByRound(
        wbtcOption.putOptionId,
        round - 1
    );
    return [
        ethCallOptionState,
        ethPutOptionState,
        wbtcCallOptionState,
        wbtcPutOptionState
    ]
}

/**
 * Function to get the settler account
 * @returns the settler account
 */
 
export let settlerWallet: ethers.Wallet;
export function initializeSettlerWallet() { 
    // TODO abstract this for the settler
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL, Number(process.env.CHAIN_ID));  
    const privateKey =  provider.network.chainId == 3 ? 
        "0x" + process.env.ROPSTEN_SETTLER_PRIVATE_KEY:
        "0x" + process.env.MAINNET_SETTLER_PRIVATE_KEY;
    //const privateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
    settlerWallet = new ethers.Wallet(privateKey, provider);
}
 

export function settlementResubmit(app): boolean {
    let initiateSettlementResubmit = app.get("initiateSettlementResubmit");
    if (initiateSettlementResubmit === undefined) {
        initiateSettlementResubmit = false;
    }
    return initiateSettlementResubmit;
}

export async function canShowInitiateSettlement(app): Promise<boolean> {
    let tx = app.get("initiateSettlementTx");
    if (tx === undefined){
        return false;
    }
    return !(await isTransactionMined(tx));
}

/**
 * Gets the money movement data for the given asset
 * @param vault to get the settlement cash flow result
 * @param settler 
 * @param assetDecimals for formatting data
 * @param assetAddress asset to get data for
 * @returns data about the settlement cash flow result
 */
export async function getMoneyMovementData(vault: PKKTHodlBoosterOption, assetDecimals, assetAddress: string) {
    let assetCashFlow = await vault.settlementCashflowResult(assetAddress);
    return {
        queuedLiquidity: ethers.utils.formatUnits(
            assetCashFlow.newDepositAmount,
            assetDecimals
        ),
        withdrawalRequest: ethers.utils.formatUnits(
            assetCashFlow.newReleasedAmount,
            assetDecimals
        ),
        leftover: ethers.utils.formatUnits(
            assetCashFlow.leftOverAmount,
            assetDecimals
        ),
        required: ethers.utils.formatUnits(
            assetCashFlow.leftOverAmount
                .add(assetCashFlow.newDepositAmount)
                .sub(assetCashFlow.newReleasedAmount),
            assetDecimals
        )
    };
}

export async function isTransactionMined(tx): Promise<boolean> { 
    const provider = settlerWallet.provider;
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    if(txReceipt){
        if(txReceipt.blockNumber){
            //console.log(JSON.stringify(txReceipt, null, 4));
            return true;
        }
    }
    return false;
}

export function getPredictedOptionData(app, optionId: number) { 
    var data = predictedDataDb.JSON(); 
    let predictedOptionData =  data?.data?.find(d=>d.pairId == optionId); 
    if (!predictedOptionData) {
        predictedOptionData = {
            callStrike: 0,
            putStrike: 0,
            callPremium: 0,
            putPremium: 0,
            pairId: optionId  
        }
    }
    return predictedOptionData;
}

export async function getPrices() {
    const pricesUrl = "https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin%2Cethereum&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false";
    const priceData = await axios.get(pricesUrl);
    return priceData.data;
}

export async function getTransactionInformation(tx) {
    let transactionMined = true;
    if (tx) {
        transactionMined = await isTransactionMined(tx);
    }
    let minimumGasPriceWei;
    let minimumGasPrice = 0;
    if (!transactionMined) {
        minimumGasPriceWei = tx.gasPrice;
        let gasPriceStr = ethers.utils.formatUnits(minimumGasPriceWei, "gwei");
        minimumGasPrice = parseFloat(gasPriceStr) * 1.1;
    }
    
    const provider = settlerWallet.provider;
    const gasPrice = await provider.getGasPrice();
    const gasPriceGweiStr = ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);
    return { minimumGasPrice, gasPriceGwei, transactionMined };
}

export async function resendTransaction(tx, manualGasPriceWei) { 
    let unsignedTx = {
        gasPrice: manualGasPriceWei,
        gasLimit: tx.gasLimit,
        to: tx.to,
        value: tx.value,
        nonce: tx.nonce,
        data: tx.data,
        chainId: tx.chainId
    }
    const signedTx = await settlerWallet.signTransaction(unsignedTx); 
    return await settlerWallet.provider.sendTransaction(signedTx);
}