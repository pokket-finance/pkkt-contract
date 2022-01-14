import { Request, Response } from "express";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import nodemailer from "nodemailer";

import {
    getSettler,
    areOptionParamsSet,
    canSettle,
    settlementResubmit,
    getDeployedContractHelper,
    canShowMoneyMovement,
    isTransactionMined,
    canShowInitiateSettlement,
    getPrices,
    getTransactionInformation,
    getSettlerWallet,
    resendTransaction,
    transporter,
    getMoneyMovementData,
    getPredictedOptionData,
    predictedDataDb, 
} from "../utilities/utilities";
import {
    ETH_PRICE_PRECISION,
    WBTC_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    ETH_USDC_OPTION_ID,
    WBTC_USDC_OPTION_ID,
    ETH_DECIMALS,
    WBTC_DECIMALS,
    USDC_DECIMALS,
    NULL_ADDRESS
} from "../../constants/constants"; 
import { PKKTHodlBoosterOption } from "../../typechain";
import { packOptionParameter } from "../../test/utilities/optionPair";
import { dataSource } from "@graphprotocol/graph-ts";
 
export async function getSetEpoch (req: Request, res: Response) { 
    const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;

    const settler = await getSettler();
    const round = await optionVault.currentRound();
    let areOptionParametersSet = await areOptionParamsSet(round);
    const underSettlement = await canSettle(optionVault);
    if (underSettlement) {
        areOptionParametersSet = true;
    }
    let predictedEthOption = getPredictedOptionData(req.app, ETH_USDC_OPTION_ID);
    let predictedWbtcOption = getPredictedOptionData(req.app , WBTC_USDC_OPTION_ID);

    let setEpochGasEstimate;
    try { 
        setEpochGasEstimate = await optionVault.connect(settler as Signer).estimateGas.setOptionParameters([
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER), 
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER), 
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER), 
            packOptionParameter(0, 0.02 * RATIO_MULTIPLIER)
        ]); 
        req.app.set("setEpochGasEstimate", setEpochGasEstimate)
    } catch (err) {
        setEpochGasEstimate = req.app.get("setEpochGasEstimate");
    } 

    const success = req.params.success;
    const tx = req.app.get("setEpochTx");
    const { minimumGasPrice, gasPriceGwei, transactionMined } = await getTransactionInformation(tx);

    // Get vault balances
    // const ethOption = await optionVault.optionPairs(ETH_USDC_OPTION_ID);
    // const wbtcOption = await optionVault.optionPairs(WBTC_USDC_OPTION_ID);

    // let ethBalance: any = await ethers.provider.getBalance(optionVault.address);
    // ethBalance = ethers.utils.formatUnits(ethBalance, ETH_DECIMALS);

    // const wbtc = await getDeployedContractHelper("WBTC");
    // let wbtcBalance: any = await wbtc.balanceOf(optionVault.address);
    // wbtcBalance = ethers.utils.formatUnits(wbtcBalance, WBTC_DECIMALS);

    // const usdc = await getDeployedContractHelper("USDC");
    // let usdcBalance: any = await usdc.balanceOf(usdc.address);
    // usdcBalance = ethers.utils.formatUnits(usdcBalance, USDC_DECIMALS);

    const wbtc = await getDeployedContractHelper("WBTC");
    const usdc = await getDeployedContractHelper("USDC");
    let ethData = await getMoneyMovementData(optionVault, settler, ETH_DECIMALS, NULL_ADDRESS);
    let wbtcData = await getMoneyMovementData(optionVault, settler, WBTC_DECIMALS, wbtc.address);
    let usdcData = await getMoneyMovementData(optionVault, settler, USDC_DECIMALS, usdc.address);

    const priceData = await getPrices();
    const ethPrice = priceData.ethereum.usd;
    const wbtcPrice = priceData["wrapped-bitcoin"].usd;

    res.render(
        "setEpoch",
        {
            round,
            areOptionParametersSet,
            predictedEthOption,
            predictedWbtcOption,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            success,
            gasEstimate: setEpochGasEstimate,
            minimumGasPrice,
            transactionMined,
            recommendedGasPrice: gasPriceGwei, 
            showMoneyMovement: (await canShowMoneyMovement(optionVault, round)),
            ethBalance: ethData.required,
            wbtcBalance: wbtcData.required,
            usdcBalance: usdcData.required,
            ethPrice,
            wbtcPrice
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
    const manualGasPriceWei = ethers.utils.parseUnits(req.body.manualGasPrice, "gwei");
    const settler = await getSettler();
    let round = await optionVault.currentRound();
    if (await areOptionParamsSet(round)) {
        res.redirect("/set/epoch:true");
        return;
    }
    let tx = req.app.get("setEpochTx");
    let transactionMined = true;
    if (tx !== undefined) {
        transactionMined = await isTransactionMined(tx);
    }
    try {
        if (!transactionMined) {
            tx = await resendTransaction(tx, manualGasPriceWei);
        }
        else {
            tx = await optionVault.connect(settler as Signer).setOptionParameters(optionParameters, { gasPrice: manualGasPriceWei });
        }
        ethers.provider.once(tx.hash, async (transaction) => {
            let info = await transporter.sendMail({
                from: '"SERVER" test@account',
                to: "matt.auer@pokket.com",
                subject: "Set Epoch Confirmation",
                text: "The Set Epoch transaction has been confirmed on the blockchain"
            });
            console.log("Message send: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        });
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
        putPremium: ethPutPremium,
        pairId: ETH_USDC_OPTION_ID, 
    }
    const predictedWbtcOption = {
        callStrike: wbtcCallStrikePrice,
        putStrike: wbtcPutStrikePrice,
        callPremium: wbtcCallPremium,
        putPremium: wbtcPutPremium,
        pairId: WBTC_USDC_OPTION_ID, 
    } 
    predictedDataDb.JSON({ data:[predictedEthOption, predictedWbtcOption] })
    predictedDataDb.sync();
    res.redirect("/set/epoch:true");
}

 