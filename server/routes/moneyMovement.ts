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
    let ethData = {
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    ethData = await getMoneyMovementData(vault, settler, ETH_DECIMALS, NULL_ADDRESS);

    let wbtcData = {
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    wbtcData = await getMoneyMovementData(vault, settler, WBTC_DECIMALS, wbtc.address);

    let usdcData = { 
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    usdcData = await getMoneyMovementData(vault, settler, USDC_DECIMALS, usdc.address);
    
    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGweiStr = await ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);

    const trader = await getTrader();
    let ethGasEstimate;
    try {
        ethGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, NULL_ADDRESS);
    } catch (err) {
        console.error(err);
    }

    let wbtcGasEstimate;
    try {
        wbtcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, wbtc.address);
    } catch (err) {
        console.error(err)
    }

    let usdcGasEstimate;
    try {
        usdcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, usdc.address);
    } catch (err) {
        console.error(err);
    }
    
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
    
    if (req.body.ethSend === "on") {
        let ethEnough: boolean = await vault.balanceEnough(NULL_ADDRESS);
        if (!ethEnough) {
            let { required } = await getMoneyMovementData(vault, settler, ETH_DECIMALS, NULL_ADDRESS);
            await trader.sendTransaction({
                to: vault.address,
                value: -required
            });
            console.log(`Trader Sent ${ethers.utils.formatUnits(-required, ETH_DECIMALS)}`);
        }
    }
    if (req.body.wbtcSend === "on") {
        let wbtcEnough: boolean = await vault.balanceEnough(wbtc.address);
        if (!wbtcEnough) {
            let { required } = await getMoneyMovementData(vault, settler, WBTC_DECIMALS, wbtc.address);
            await wbtc.connect(trader as Signer).transfer(vault.address, -required);
            console.log(`Trader Sent ${ethers.utils.formatUnits(-required, WBTC_DECIMALS)}`);
        }
    }
    if (req.body.usdcSend === "on") {
        let usdcEnough: boolean = await vault.balanceEnough(usdc.address);
        if (!usdcEnough) {
            let { required } = await getMoneyMovementData(vault, settler, USDC_DECIMALS, usdc.address);
            await usdc.connect(trader as Signer).transfer(vault.address, -required);
            console.log(`Trader Sent ${ethers.utils.formatUnits(-required, USDC_DECIMALS)}`);
        }
    }
    res.redirect("/moneyMovement");
}