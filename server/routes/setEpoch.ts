import { Request, Response } from "express";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import {
    getSettler,
    areOptionParamsSet,
    canSettle,
    settlementResubmit,
    getDeployedContractHelper,
    canShowMoneyMovement,
    isTransactionMined,
    canShowInitiateSettlement
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

    let setEpochGasEstimate;
    try {
        setEpochGasEstimate = await optionVault.connect(settler as Signer).estimateGas.setOptionParameters([
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER), 
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER), 
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER), 
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER)
        ]);
    } catch (err) {
        console.error(err);
    }

    const success = req.params.success;

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGweiStr = await ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);

    res.render(
        "setEpoch",
        {
            round,
            areOptionParametersSet,
            predictedEthOption,
            predictedWbtcOption,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            success,
            setEpochGasEstimate,
            minimumGasPrice: "N/A",
            recommendedGasPrice: gasPriceGwei, 
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
    const settler = await getSettler();
    try {
        let tx = await optionVault.connect(settler as Signer).setOptionParameters(optionParameters);
        req.app.set("setEpochTx", tx);
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