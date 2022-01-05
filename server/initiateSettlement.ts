import { Signer } from "ethers";
import { Request, Response } from "express";
import { ethers } from "hardhat";
import { OptionVault } from "../typechain";
import { getDeployedContractHelper, getSettler } from "./utilities/utilities";

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
    let initiateSettlementResubmit = req.app.get("initiateSettlementResubmit");
    if (initiateSettlementResubmit === undefined) {
        initiateSettlementResubmit = false;
    }

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
    res.render("initiateSettlement", { transactionMined, initiateSettlementResubmit, currentGasPrice: gasPriceGwei });
}

// SET /initiateSettlement route
export async function setManualInitiateSettlement(req: Request, res: Response) {
    const manualGasPriceGwei = req.body.manualGasPrice;
    const manualGasPriceWei = ethers.utils.parseUnits(manualGasPriceGwei, "wei");
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const settler = await getSettler();

    await vault.connect(settler as Signer).initiateSettlement({ nonce: req.app.get("settlerNonce"), gasPrice: manualGasPriceWei });
}