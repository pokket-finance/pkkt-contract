import { Request, Response } from "express";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { OptionVault, ERC20Mock } from "../../typechain";
import {
    ETH_DECIMALS,
    NULL_ADDRESS,
    WBTC_DECIMALS,
    USDC_DECIMALS
} from "../../constants/constants";
import {
    getMoneyMovementData,
    getDeployedContractHelper,
    getSettler,
    getTrader
} from "../utilities/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export async function getMoneyMovement(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    let usdc = await getDeployedContractHelper("USDC");
    let wbtc = await getDeployedContractHelper("WBTC");
    const settler = await getSettler()

    const trader = await getTrader();
    let ethData = {
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    let ethGasEstimate;
    try {
        ethGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, NULL_ADDRESS);
        ethData = await getMoneyMovementData(vault, settler, ETH_DECIMALS, NULL_ADDRESS);
    } catch (err) {
        console.error("No Residule Eth");
    }

    let wbtcData = {
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    let wbtcGasEstimate;
    try {
        wbtcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, wbtc.address);
        wbtcData = await getMoneyMovementData(vault, settler, WBTC_DECIMALS, wbtc.address);
    } catch (err) {
        console.error("No residule wbtc")
    }

    let usdcData = { 
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    let usdcGasEstimate;
    try {
        usdcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, usdc.address);
        usdcData = await getMoneyMovementData(vault, settler, USDC_DECIMALS, usdc.address);
    } catch (err) {
        console.error("No residule usdc");
    }

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGweiStr = await ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);

    res.render(
        "moneyMovement",
        {
            recommendedGasPrice: gasPriceGwei,
            ethData,
            wbtcData,
            usdcData,
            ethGasEstimate,
            wbtcGasEstimate,
            usdcGasEstimate
        }
    );
}

export async function postMoneyMovement(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const wbtc = await getDeployedContractHelper("WBTC") as ERC20Mock;
    const usdc = await getDeployedContractHelper("USDC") as ERC20Mock;

    const trader = await getTrader();
    const settler = await getSettler();

    if (req.body.withdrawEth !== undefined) {
        await vault.connect(settler as Signer).withdrawAsset(trader.address, NULL_ADDRESS);
    }
    if (req.body.withdrawWbtc !== undefined) {
        await vault.connect(settler as Signer).withdrawAsset(trader.address, wbtc.address);
    }
    if (req.body.withdrawUsdc !== undefined) {
        await vault.connect(settler as Signer).withdrawAsset(trader.address, usdc.address);
    }
    res.redirect("/moneyMovement");
}