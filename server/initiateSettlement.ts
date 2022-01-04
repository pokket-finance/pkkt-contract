import { Request, Response } from "express";
import { ethers } from "hardhat";

// GET /initiateSettlement route
export async function getManualInitiateSettlement(req: Request, res: Response) {
    let initiateSettlementResubmit = req.app.get("initiateSettlementResubmit");
    if (initiateSettlementResubmit === undefined) {
        initiateSettlementResubmit = false;
    }
    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
    res.render("initiateSettlement", { initiateSettlementResubmit, currentGasPrice: gasPriceGwei });
}

// SET /initiateSettlement route
