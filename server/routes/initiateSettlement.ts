import { Signer } from "ethers";
import { Request, Response } from "express";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption } from "../../typechain";
import { canSettle, canShowInitiateSettlement, canShowMoneyMovement, getDeployedContractHelper, getSettler, isTransactionMined, settlementResubmit } from "../utilities/utilities";

// GET /initiateSettlement route
export async function getManualInitiateSettlement(req: Request, res: Response) {
    // Checks if the initiate settlement has been mined 
    const settler = await getSettler();
    let tx = req.app.get("initiateSettlementTx");
    let transactionMined = await isTransactionMined(tx);
    // let curSettlerNonce = await settler.getTransactionCount();
    // let prevSettlerNonce = req.app.get("settlerNonce");
    // if (prevSettlerNonce === undefined) {
    //     prevSettlerNonce = curSettlerNonce;
    // }
    // //console.log(`cur none: ${curSettlerNonce} prev nonee ${prevSettlerNonce}`);
    // const transactionMined = (curSettlerNonce === prevSettlerNonce);

    // Checks if the initiateSettlement needs to be resubmited by trader
    //let initiateSettlementResubmit = settlementResubmit(req.app);

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const round = await vault.currentRound();
    res.render(
        "initiateSettlement",
        {
            transactionMined,
            currentGasPrice: gasPriceGwei,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            showMoneyMovement: (await canShowMoneyMovement(vault, round))
        }
    );
}

// SET /initiateSettlement route
export async function setManualInitiateSettlement(req: Request, res: Response) {
    // first check to see if tx was mined before the trader refreshes their page
    if (!(await canShowInitiateSettlement(req.app))) {
        res.redirect("/show/epoch");
        return;
    }
    const manualGasPriceGwei = req.body.manualGasPrice;
    const manualGasPriceWei = ethers.utils.parseUnits(manualGasPriceGwei, "gwei");
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const settler = await getSettler();
    console.log(manualGasPriceWei.toString());
    try {
        let tx = await vault.connect(settler as Signer).initiateSettlement({ nonce: req.app.get("settlerNonce"), gasPrice: manualGasPriceWei });
        req.app.set("initiateSettlementTx", tx);
    } catch (err) {
        console.error(err);
    }
    req.app.set("initiateSettlementResubmit", false);
    res.redirect("/show/epoch");
}