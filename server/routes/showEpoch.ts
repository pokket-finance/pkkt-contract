import { BigNumber } from "ethers";
import { Request, Response } from "express";

import {
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    WBTC_PRICE_PRECISION
} from "../../constants/constants";
import {
    getOptionContracts, settlementResubmit
} from "../utilities/utilities";

// /show/epoch route
export async function showEpoch(req: Request, res: Response) {
    const [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getOptionContracts();
    let round = await optionVault.currentRound();

    let optionRound = round.sub(1);
    if (round.isZero()) {
        optionRound = BigNumber.from(0);
    }
    let predictedEthOption = getPredictedOptionData(req.app, "predictedEthOption");
    let predictedWbtcOption = getPredictedOptionData(req.app, "predictedWbtcOption");

    // Get contract option data to display
    const ethCallOptionState = await ethHodlBoosterCallOption.optionStates(optionRound);
    const ethPutOptionState = await ethHodlBoosterPutOption.optionStates(optionRound);
    const wbtcCallOptionState = await wbtcHodlBoosterCallOption.optionStates(optionRound);
    const wbtcPutOptionState = await wbtcHodlBoosterPutOption.optionStates(optionRound);
    const ethOption = {
        callStrike: ethCallOptionState.strikePrice.div(10 ** ETH_PRICE_PRECISION),
        putStrike: ethPutOptionState.strikePrice.div(10 ** ETH_PRICE_PRECISION),
        callPremium: ethCallOptionState.premiumRate / RATIO_MULTIPLIER,
        putPremium: ethPutOptionState.premiumRate / RATIO_MULTIPLIER
    }
    const wbtcOption = {
        callStrike: wbtcCallOptionState.strikePrice.div(10 ** WBTC_PRICE_PRECISION),
        putStrike: wbtcPutOptionState.strikePrice.div(10 ** WBTC_PRICE_PRECISION),
        callPremium: wbtcCallOptionState.premiumRate / RATIO_MULTIPLIER,
        putPremium: wbtcPutOptionState.premiumRate / RATIO_MULTIPLIER
    }

    const initiateSettlementResubmit = settlementResubmit(req.app);

    res.render(
        "showEpoch",
        {
            round,
            ethOption,
            predictedEthOption: predictedEthOption,
            wbtcOption,
            predictedWbtcOption: predictedWbtcOption,
            initiateSettlementResubmit
        }
    );
}

function getPredictedOptionData(app, dataName: string) {
    let predictedOptionData = app.get(dataName);
    if (predictedOptionData === undefined) {
        predictedOptionData = {
            callStrike: 0,
            putStrike: 0,
            callPremium: 0,
            putPremium: 0
        }
    }
    return predictedOptionData;
}