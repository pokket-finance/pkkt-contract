import { Request, Response } from "express";
import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";

import {
    ETH_DECIMALS,
    USDC_DECIMALS,
    WBTC_DECIMALS,
    OptionExecution
} from "../../constants/constants";
import {
    getOptionContracts,
    getSettler,
    canSettle,
    settlementResubmit,
    setSettlementParameters
} from "../utilities/utilities"

export async function getSetOptionDecision(req: Request, res: Response) {
    const [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getOptionContracts();

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

    const canSettleVault = await canSettle(
        optionVault,
        settler,
        round,
        [
            ethHodlBoosterPutOption,
            ethHodlBoosterCallOption,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption
        ]
    );

    if (canSettleVault && round.gt(2)) {
        const strikePriceDecimals = 4;

        notExerciseEthData = await getExerciseDecisionData(
            0,
            optionVault,
            settler,
            ethHodlBoosterCallOption,
            ethHodlBoosterPutOption,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exerciseCallEthData = await getExerciseDecisionData(
            1,
            optionVault,
            settler,
            ethHodlBoosterCallOption,
            ethHodlBoosterPutOption,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exercisePutEthData = await getExerciseDecisionData(
            2,
            optionVault,
            settler,
            ethHodlBoosterCallOption,
            ethHodlBoosterPutOption,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        notExerciseWbtcData = await getExerciseDecisionData(
            3,
            optionVault,
            settler,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exerciseCallWbtcData = await getExerciseDecisionData(
            4,
            optionVault,
            settler,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exercisePutWbtcData = await getExerciseDecisionData(
            5,
            optionVault,
            settler,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
    }

    const initiateSettlementResubmit = settlementResubmit(req.app);
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
            initiateSettlementResubmit,
            success: req.params.success
        }
    );
}

export async function postSetOptionDecision(req: Request, res: Response) {
    const ethDecision = getExecutionStatus(req.body.ethOption);
    const wbtcDecision = getExecutionStatus(req.body.wbtcOption);
    try{
        await setSettlementParameters(ethDecision, wbtcDecision);
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

async function getExerciseDecisionData(index, vault, settler, callOption, putOption, callOptionAssetDecimals, putOptionAssetDecimals, strikePriceDecimals) {
        let accounting: OptionPairExecutionAccountingResult = await vault.connect(settler as Signer).executionAccountingResult(index);
        
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

        let maturedCallOptionState = await callOption.optionStates(accounting.callOptionResult.round.sub(1));
        let callStrikePrice = ethers.utils.formatUnits(
            maturedCallOptionState.strikePrice,
            strikePriceDecimals
        )

        let maturedPutOptionState = await putOption.optionStates(accounting.putOptionResult.round.sub(1));
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
