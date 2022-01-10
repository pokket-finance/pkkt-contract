import { BigNumber } from "ethers";
import { Request, Response } from "express";

import {
    ETH_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    WBTC_PRICE_PRECISION
} from "../../constants/constants";
import { PKKTHodlBoosterOption } from "../../typechain";
import {
    getDeployedContractHelper,
    getOptionStateData,
    settlementResubmit
} from "../utilities/utilities";

// /show/epoch route
export async function showEpoch(req: Request, res: Response) {

    const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption
    let round = await optionVault.currentRound();

    let optionRound = round - 1;
    if (round === 0) {
        optionRound = 0;
    }
    let predictedEthOption = getPredictedOptionData(req.app, "predictedEthOption");
    let predictedWbtcOption = getPredictedOptionData(req.app, "predictedWbtcOption");

    // Get contract option data to display
    const [
        ethCallOptionState,
        ethPutOptionState,
        wbtcCallOptionState,
        wbtcPutOptionState] = await getOptionStateData(optionVault, round);
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