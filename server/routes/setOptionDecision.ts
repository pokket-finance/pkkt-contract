import { Request, Response } from "express";
import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import * as dotenv from "dotenv"
dotenv.config();

import {
    ETH_DECIMALS,
    USDC_DECIMALS,
    WBTC_DECIMALS,
    OptionExecution,
    ETH_USDC_OPTION_ID,
    WBTC_USDC_OPTION_ID
} from "../../constants/constants";
import {
    getSettler,
    canSettle,
    settlementResubmit,
    setSettlementParameters,
    getDeployedContractHelper,
    canShowMoneyMovement,
    isTransactionMined,
    canShowInitiateSettlement,
    getPrices,
    getSettlerWallet,
    resendTransaction,
    getTransactionInformation
} from "../utilities/utilities"
import { PKKTHodlBoosterOption } from "../../typechain";

export async function getSetOptionDecision(req: Request, res: Response) {
    const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;

    const settler = await getSettler()

    const round = await optionVault.currentRound();

    let tempParams = {
        depositDebt: "0",
        counterPartyDebt: "0",
        depositAssetWithdrawal: "0",
        counterPartyAssetWithdrawal: "0",
        newDepositAssetAmount: "0",
        newCounterPartyAssetAmount: "0",
        callStrikePrice: "0",
        putStrikePrice: "0"
    };
    let notExerciseEthData = tempParams;
    let exerciseCallEthData = tempParams;
    let exercisePutEthData = tempParams;
    let notExerciseWbtcData = tempParams;
    let exerciseCallWbtcData = tempParams;
    let exercisePutWbtcData = tempParams;

    const canSettleVault = await canSettle(optionVault);

    if (canSettleVault && round > 2) {
        const strikePriceDecimals = 4;

        let ethOptionPair = await optionVault.optionPairs(ETH_USDC_OPTION_ID);
        let wbtcOptionPair = await optionVault.optionPairs(WBTC_USDC_OPTION_ID);
        notExerciseEthData = await getExerciseDecisionData(
            0,
            round,
            optionVault,
            settler,
            ethOptionPair,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        // TODO remove once smart contract bug is fixes
        // TODO for now simulate strike prices
        // const tempEthCallStrikePrice = "4500";
        // const tempEthPutStrikePrice = "3900";
        // const tempWbtcCallStrikePrice = "50000";
        // const tempWbtcPutStrikePrice = "38000";

        exerciseCallEthData = await getExerciseDecisionData(
            1,
            round,
            optionVault,
            settler,
            ethOptionPair,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        //exerciseCallEthData.callStrikePrice = tempEthCallStrikePrice;

        exercisePutEthData = await getExerciseDecisionData(
            2,
            round,
            optionVault,
            settler,
            ethOptionPair,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        //exercisePutEthData.putStrikePrice = tempEthPutStrikePrice;

        notExerciseWbtcData = await getExerciseDecisionData(
            3,
            round,
            optionVault,
            settler,
            wbtcOptionPair,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
    
        exerciseCallWbtcData = await getExerciseDecisionData(
            4,
            round,
            optionVault,
            settler,
            wbtcOptionPair,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        //exerciseCallWbtcData.callStrikePrice = tempWbtcCallStrikePrice;

        exercisePutWbtcData = await getExerciseDecisionData(
            5,
            round,
            optionVault,
            settler,
            wbtcOptionPair,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        //exercisePutWbtcData.putStrikePrice = tempWbtcPutStrikePrice;
    }

    let settleGasEstimate;
    try {
        settleGasEstimate = await optionVault.connect(settler as Signer)
            .estimateGas.settle([OptionExecution.NoExecution, OptionExecution.NoExecution]);
        req.app.set("settleGasEstimate", settleGasEstimate);
    } catch (err) {
        settleGasEstimate = req.app.get("settleGasEstimate");
    }

    const tx = req.app.get("settleTx");

    const { minimumGasPrice, gasPriceGwei, transactionMined } = await getTransactionInformation(tx);

    const priceData = await getPrices();
    const ethereumPrice = priceData.ethereum.usd;
    const wbtcPrice = priceData["wrapped-bitcoin"].usd;

    const canSetGasPrice = tx === undefined ? false : !transactionMined;

    res.render(
        "exerciseDecision",
        {
            notExerciseEthData,
            exerciseCallEthData,
            exercisePutEthData,
            notExerciseWbtcData,
            exerciseCallWbtcData,
            exercisePutWbtcData,
            canSettleVault,
            round,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            success: req.params.success,
            showMoneyMovement: (await canShowMoneyMovement(optionVault, round)),
            ethereumPrice,
            wbtcPrice,
            gasEstimate: settleGasEstimate,
            minimumGasPrice,
            recommendedGasPrice: gasPriceGwei,
            transactionMined,
            canSetGasPrice
        }
    );
}

export async function postSetOptionDecision(req: Request, res: Response) {
    const ethDecision = getExecutionStatus(req.body.ethOption);
    const wbtcDecision = getExecutionStatus(req.body.wbtcOption);
    let manualGasPriceWei;
    if (req.body.manualGasPrice) {
        manualGasPriceWei = ethers.utils.parseUnits(req.body.manualGasPrice, "gwei");
    }
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    if (!(await canSettle(vault))) {
        res.redirect("/set/decision");
        return;
    }
    let tx = req.app.get("settleTx");
    let transactionMined = true;
    if (tx !== undefined) {
        transactionMined = await isTransactionMined(tx);
    }
    const settler = await getSettler();
    try {
        if (!transactionMined) {
            let txResponse = await resendTransaction(tx, manualGasPriceWei);
            req.app.set("settleTx", txResponse);
            req.app.set("settleOverride", true);
        }
        else {
            req.app.set("settleDecisions", [ethDecision, wbtcDecision]);
        }
        res.redirect("/set/decision:true");
    } catch (err) {
        console.error(err);
        res.redirect("/set/decision:false");
    }
}

/**
 * Turns information from form into the option execution
 * @param executionDecision string retrieved from form
 * @returns option execution decision
 */
 function getExecutionStatus(executionDecision: String): OptionExecution {
    if (executionDecision == "noExercise"){
        return OptionExecution.NoExecution
    }
    else if (executionDecision == "exerciseCall") {
        return OptionExecution.ExecuteCall;
    }
    return OptionExecution.ExecutePut;
}

// TODO Move this type declaration somewhere else
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

async function getExerciseDecisionData(index, round, vault: PKKTHodlBoosterOption, settler, optionPair, callOptionAssetDecimals, putOptionAssetDecimals, strikePriceDecimals) {
        let accounting = await vault.connect(settler as Signer).executionAccountingResult(index);
        
        let callAssetAutoRoll = accounting.callOptionResult.autoRollAmount
            .add(accounting.callOptionResult.autoRollPremium)
            .add(accounting.putOptionResult.autoRollCounterPartyAmount)
            .add(accounting.putOptionResult.autoRollCounterPartyPremium);
        let callAssetReleased = accounting.callOptionResult.releasedAmount
            .add(accounting.callOptionResult.releasedPremium)
            .add(accounting.putOptionResult.releasedCounterPartyAmount)
            .add(accounting.putOptionResult.releasedCounterPartyPremium);
        let depositDebt =  ethers.utils.formatUnits(
            accounting.callOptionResult.depositAmount
                .add(callAssetAutoRoll)
                .sub(callAssetReleased),
            callOptionAssetDecimals
        );

        let putAssetAutoRoll =  accounting.callOptionResult.autoRollCounterPartyAmount
            .add(accounting.callOptionResult.autoRollCounterPartyPremium)
            .add(accounting.putOptionResult.autoRollAmount)
            .add(accounting.putOptionResult.autoRollPremium);
        let putAssetReleased = accounting.callOptionResult.releasedCounterPartyAmount
            .add(accounting.callOptionResult.releasedCounterPartyPremium)
            .add(accounting.putOptionResult.releasedAmount)
            .add(accounting.putOptionResult.releasedPremium);
        let counterPartyDebt = ethers.utils.formatUnits(
            accounting.putOptionResult.depositAmount
                .add(putAssetAutoRoll)
                .sub(putAssetReleased),
            putOptionAssetDecimals
        );

        let callAssetReleasedStr = ethers.utils.formatUnits(callAssetReleased, callOptionAssetDecimals);
        
        let putAssetReleasedStr = ethers.utils.formatUnits(putAssetReleased, putOptionAssetDecimals);

        let newDepositAssetAmount = ethers.utils.formatUnits(
            accounting.callOptionResult.depositAmount,
            callOptionAssetDecimals
        );

        let newCounterPartyAssetAmount = ethers.utils.formatUnits(
            accounting.putOptionResult.depositAmount,
            putOptionAssetDecimals
        )

        let maturedCallOptionState = await vault.getOptionStateByRound(optionPair.callOptionId, round - 2);
        let callStrikePrice = ethers.utils.formatUnits(
            maturedCallOptionState.strikePrice,
            strikePriceDecimals
        )

        let maturedPutOptionState = await vault.getOptionStateByRound(optionPair.putOptionId, round - 2);
        let putStrikePrice = ethers.utils.formatUnits(
            maturedPutOptionState.strikePrice,
            strikePriceDecimals
        );

        return {
            depositDebt,
            counterPartyDebt,
            depositAssetWithdrawal: callAssetReleasedStr,
            counterPartyAssetWithdrawal: putAssetReleasedStr,
            newDepositAssetAmount,
            newCounterPartyAssetAmount,
            callStrikePrice,
            putStrikePrice
        };
}
