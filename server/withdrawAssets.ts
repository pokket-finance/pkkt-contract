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

    const ethGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, NULL_ADDRESS);
    const wbtcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, wbtc.address);
    const usdcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, usdc.address);

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGweiStr = await ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);
    
    res.render("withdrawAssets", { recommendedGasPrice: gasPriceGwei, ethGasEstimate, wbtcGasEstimate, usdcGasEstimate });
}

