import { BigNumber, Signer } from "ethers";
import { Request, Response } from "express";
import { ethers } from "hardhat";
import { NULL_ADDRESS } from "../constants/constants";
import { OptionVault } from "../typechain";
import { getDeployedContractHelper, getSettler, getTrader } from "./utilities/utilities";

// Get /withdrawAssets route
export async function getWithdrawAssets(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const wbtc = await getDeployedContractHelper("WBTC");
    const usdc = await getDeployedContractHelper("USDC");
    const settler = await getSettler();
    const trader = await getTrader();

    let canWithdrawEth = true;
    let ethGasEstimate;
    try {
        ethGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, NULL_ADDRESS);
    } catch(err) {
        canWithdrawEth = false;
    }

    let canWithdrawWbtc = true;
    let wbtcGasEstimate;
    try {
        wbtcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, wbtc.address);
    } catch(err) {
        canWithdrawWbtc = false;
    }
    
    let canWithdrawUsdc = true;
    let usdcGasEstimate;
    try {
        usdcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, usdc.address);
    } catch (err) {
        canWithdrawUsdc = false;
    }
    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGweiStr = await ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);
    
    res.render(
        "withdrawAssets",
        { recommendedGasPrice: gasPriceGwei,
            ethGasEstimate,
            wbtcGasEstimate,
            usdcGasEstimate,
            canWithdrawEth,
            canWithdrawWbtc,
            canWithdrawUsdc
        }
    );
}

// POST /withdrawAssets route
export async function postWithdrawAssets(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const wbtc = await getDeployedContractHelper("WBTC");
    const usdc = await getDeployedContractHelper("USDC");
    const settler = await getSettler();
    const trader = await getTrader();

    // Withdraw the selected assets
    if (req.body.withdrawEth !== undefined) {
        await vault.connect(settler as Signer).withdrawAsset(trader.address, NULL_ADDRESS);
    }
    if (req.body.withdrawWbtc !== undefined) {
        await vault.connect(settler as Signer).withdrawAsset(trader.address, wbtc.address);
    }
    if (req.body.withdrawUsdc !== undefined) {
        await vault.connect(settler as Signer).withdrawAsset(trader.address, usdc.address);
    }
    res.redirect("/show/epoch");
}

