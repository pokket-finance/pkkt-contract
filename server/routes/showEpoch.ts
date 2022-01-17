import { BigNumber } from "ethers";
import { Request, Response } from "express";

import {
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    WBTC_PRICE_PRECISION,
    ETH_USDC_OPTION_ID,
    WBTC_USDC_OPTION_ID
} from "../utilities/constants"; 
import {
    canSettle,
    canShowMoneyMovement,
    getPKKTHodlBoosterOption,
    getOptionStateData,
    settlementResubmit,
    isTransactionMined,
    canShowInitiateSettlement,
    getPredictedOptionData
} from "../utilities/utilities";
import { getPredictedEthData } from "./predictedData"; 


// /show/epoch route
export async function showEpoch(req: Request, res: Response) {

    const optionVault = await getPKKTHodlBoosterOption();
    let round = await optionVault.currentRound();

    let optionRound = round - 1;
    if (round === 0) {
        optionRound = 0;
    }
    let predictedEthOption = getPredictedOptionData(req.app, ETH_USDC_OPTION_ID);
    let predictedWbtcOption = getPredictedOptionData(req.app, WBTC_USDC_OPTION_ID);
    
    let ethOption = {
        callStrike: BigNumber.from(0),
        putStrike: BigNumber.from(0),
        callPremium: 0,
        putPremium: 0
    };
    let wbtcOption = {
        callStrike: BigNumber.from(0),
        putStrike: BigNumber.from(0),
        callPremium: 0,
        putPremium: 0
    }
    try {
        // Get contract option data to display
        const [
            ethCallOptionState,
            ethPutOptionState,
            wbtcCallOptionState,
            wbtcPutOptionState] = await getOptionStateData(optionVault, round);
        ethOption = {
            callStrike: ethCallOptionState.strikePrice.div(10 ** ETH_PRICE_PRECISION),
            putStrike: ethPutOptionState.strikePrice.div(10 ** ETH_PRICE_PRECISION),
            callPremium: ethCallOptionState.premiumRate / RATIO_MULTIPLIER,
            putPremium: ethPutOptionState.premiumRate / RATIO_MULTIPLIER
        }
        wbtcOption = {
            callStrike: wbtcCallOptionState.strikePrice.div(10 ** WBTC_PRICE_PRECISION),
            putStrike: wbtcPutOptionState.strikePrice.div(10 ** WBTC_PRICE_PRECISION),
            callPremium: wbtcCallOptionState.premiumRate / RATIO_MULTIPLIER,
            putPremium: wbtcPutOptionState.premiumRate / RATIO_MULTIPLIER
        }
    } catch (err) {
        console.error(err);
    }

    //const initiateSettlementResubmit = settlementResubmit(req.app);

    res.render(
        "showEpoch",
        {
            round,
            ethOption,
            predictedEthOption: predictedEthOption,
            wbtcOption,
            predictedWbtcOption: predictedWbtcOption,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            showMoneyMovement: (await canShowMoneyMovement(optionVault, round))
        }
    );
}

