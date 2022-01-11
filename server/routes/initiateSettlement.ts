import { Signer } from "ethers";
import { Request, Response } from "express";
import { appendFile } from "fs";
import { ethers } from "hardhat";
import { PKKTHodlBoosterOption } from "../../typechain";
import { canSettle, canShowMoneyMovement, getDeployedContractHelper, getSettler, settlementResubmit } from "../utilities/utilities";

// GET /initiateSettlement route
export async function getManualInitiateSettlement(req: Request, res: Response) {
    // Checks if the initiate settlement has been mined 
    const settler = await getSettler();
    let curSettlerNonce = await settler.getTransactionCount();
    let prevSettlerNonce = req.app.get("settlerNonce");
    if (prevSettlerNonce === undefined) {
        prevSettlerNonce = curSettlerNonce;
    }
    //console.log(`cur none: ${curSettlerNonce} prev nonee ${prevSettlerNonce}`);
    const transactionMined = (curSettlerNonce === prevSettlerNonce);

    // Checks if the initiateSettlement needs to be resubmited by trader
    let initiateSettlementResubmit = settlementResubmit(req.app);

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const round = await vault.currentRound();
    res.render(
        "initiateSettlement",
        {
            transactionMined,
            initiateSettlementResubmit,
            currentGasPrice: gasPriceGwei,
            showMoneyMovement: (await canShowMoneyMovement(vault, round))
        }
    );
}

// SET /initiateSettlement route
export async function setManualInitiateSettlement(req: Request, res: Response) {
    const manualGasPriceGwei = req.body.manualGasPrice;
    const manualGasPriceWei = ethers.utils.parseUnits(manualGasPriceGwei, "gwei");
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const settler = await getSettler();
    console.log(manualGasPriceWei.toString());
    try {
        await vault.connect(settler as Signer).initiateSettlement({ nonce: req.app.get("settlerNonce"), gasPrice: manualGasPriceWei });
    } catch (err) {
        console.error(err);
    }
        req.app.set("initiateSettlementResubmit", false);
    res.redirect("/show/epoch");
}