import { Request, Response } from "express";
import { Signer } from "ethers";

import {
    getSettler,
    areOptionParamsSet,
    canSettle,
    settlementResubmit,
    getDeployedContractHelper,
    canShowMoneyMovement
} from "../utilities/utilities";
import {
    ETH_PRICE_PRECISION,
    WBTC_PRICE_PRECISION,
    RATIO_MULTIPLIER
} from "../../constants/constants";
import { PKKTHodlBoosterOption } from "../../typechain";
import { packOptionParameter } from "../../test/utilities/optionPair";

export async function getSetEpoch (req: Request, res: Response) {
    const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;

    const settler = await getSettler()
    const round = await optionVault.currentRound();
    let areOptionParametersSet = await areOptionParamsSet(round);
    const underSettlement = await canSettle(optionVault);
    if (underSettlement) {
        areOptionParametersSet = true;
    }
    let predictedEthOption = getPredictedOptionData(req.app, "predictedEthOption");
    let predictedWbtcOption = getPredictedOptionData(req.app , "predictedWbtcOption");

    const initiateSettlementResubmit = settlementResubmit(req.app);

    const success = req.params.success;

    res.render(
        "setEpoch",
        {
            round,
            areOptionParametersSet,
            predictedEthOption,
            predictedWbtcOption,
            initiateSettlementResubmit,
            success,
            showMoneyMovement: (await canShowMoneyMovement(optionVault, round))
        }
    );
};

export async function postSetEpoch(req: Request, res: Response) {
    const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const ethCallPremium = parseFloat(req.body.ethCallPremium);
    const ethPutPremium = parseFloat(req.body.ethPutPremium);
    const wbtcCallPremium = parseFloat(req.body.wbtcCallPremium);
    const wbtcPutPremium = parseFloat(req.body.wbtcPutPremium);
    const ethCallStrikePrice = req.body.ethCallStrike * (10 ** ETH_PRICE_PRECISION);
    const ethPutStrikePrice = req.body.ethPutStrike * (10 ** ETH_PRICE_PRECISION);
    const wbtcCallStrikePrice = req.body.wbtcCallStrike * (10 ** WBTC_PRICE_PRECISION);
    const wbtcPutStrikePrice = req.body.wbtcPutStrike * (10 ** WBTC_PRICE_PRECISION);
    let optionParameters = [
        packOptionParameter(ethCallStrikePrice, ethCallPremium * RATIO_MULTIPLIER),
        packOptionParameter(ethPutStrikePrice, ethPutPremium * RATIO_MULTIPLIER),
        packOptionParameter(wbtcCallStrikePrice, wbtcCallPremium * RATIO_MULTIPLIER),
        packOptionParameter(wbtcPutStrikePrice, wbtcPutPremium * RATIO_MULTIPLIER)
    ];
    console.log(optionParameters)
    const settler = await getSettler();
    try {
        await optionVault.connect(settler as Signer).setOptionParameters(optionParameters);
        res.redirect("/set/epoch:true");
    } catch (err) {
        console.error(err);
        res.redirect("/set/epoch:false");
    }
};

export async function postSetPredictedEpoch(req: Request, res: Response) {
    const ethCallPremium = parseFloat(req.body.predictedEthCallPremium);
    const ethPutPremium = parseFloat(req.body.predictedEthPutPremium);
    const wbtcCallPremium = parseFloat(req.body.predictedWbtcCallPremium);
    const wbtcPutPremium = parseFloat(req.body.predictedWbtcPutPremium);
    const ethCallStrikePrice = req.body.predictedEthCallStrike;
    const ethPutStrikePrice = req.body.predictedEthPutStrike;
    const wbtcCallStrikePrice = req.body.predictedWbtcCallStrike;
    const wbtcPutStrikePrice = req.body.predictedWbtcPutStrike;
    const predictedEthOption = {
        callStrike: ethCallStrikePrice,
        putStrike: ethPutStrikePrice,
        callPremium: ethCallPremium,
        putPremium: ethPutPremium
    }
    const predictedWbtcOption = {
        callStrike: wbtcCallStrikePrice,
        putStrike: wbtcPutStrikePrice,
        callPremium: wbtcCallPremium,
        putPremium: wbtcPutPremium
    }

    req.app.set("predictedEthOption", predictedEthOption);
    req.app.set("predictedWbtcOption", predictedWbtcOption);
    res.redirect("/set/epoch:true");
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