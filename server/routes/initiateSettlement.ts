import { Signer } from "ethers";
import { Request, Response } from "express";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption } from "../../typechain";
import { canSettle, canShowInitiateSettlement, canShowMoneyMovement, getDeployedContractHelper, getSettler, getTransactionInformation, isTransactionMined, resendTransaction, settlementResubmit } from "../utilities/utilities";

// GET /initiateSettlement route
export async function getManualInitiateSettlement(req: Request, res: Response) {
    // Checks if the initiate settlement has been mined 
    const settler = await getSettler();
    let tx = req.app.get("initiateSettlementTx");
    const { minimumGasPrice, gasPriceGwei, transactionMined } = await getTransactionInformation(tx);

    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const round = await vault.currentRound();

    let initiateSettlementGasEstimate;
    try {
        initiateSettlementGasEstimate = await vault.connect(settler as Signer)
            .estimateGas.initiateSettlement();
        req.app.set("initiateSettlementGasEstimate", initiateSettlementGasEstimate);
    } catch (err) {
        initiateSettlementGasEstimate = req.app.get("initiateSettlementGasEstimate");
    }

    res.render(
        "initiateSettlement",
        {
            transactionMined,
            minimumGasPrice,
            recommendedGasPrice: gasPriceGwei,
            gasEstimate: initiateSettlementGasEstimate,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            showMoneyMovement: (await canShowMoneyMovement(vault, round))
        }
    );
}

// SET /initiateSettlement route
export async function setManualInitiateSettlement(req: Request, res: Response) {
    // first check to see if tx was mined before the trader refreshes their page
    if (!(await canShowInitiateSettlement(req.app))) {
        console.log("bpoo");
        res.redirect("/show/epoch");
        return;
    }
    const manualGasPriceGwei = req.body.manualGasPrice;
    const manualGasPriceWei = ethers.utils.parseUnits(manualGasPriceGwei, "gwei");
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const settler = await getSettler();
    let tx = req.app.get("initiateSettlementTx");
    let transactionMined = true;
    if (tx !== undefined) {
        transactionMined = await isTransactionMined(tx);
    }
    try {
        if (!transactionMined) {
            let txResponse = await resendTransaction(tx, manualGasPriceWei);
            req.app.set("initiateSettlementTx", txResponse);
            req.app.set("initiateSettlementResubmit", false);
        }
        // let tx = await vault.connect(settler as Signer).initiateSettlement({ nonce: req.app.get("settlerNonce"), gasPrice: manualGasPriceWei });
        // req.app.set("initiateSettlementTx", tx);
    } catch (err) {
        console.error(err);
    }
    res.redirect("/show/epoch");
}