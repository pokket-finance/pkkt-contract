import { Request, Response } from "express";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { PKKTHodlBoosterOption, ERC20Mock } from "../../typechain";
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
    getTrader,
    settlementResubmit,
    canSettle,
    areOptionParamsSet,
    canShowMoneyMovement,
    isTransactionMined,
    canShowInitiateSettlement,
} from "../utilities/utilities";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export async function getMoneyMovement(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
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
    ethData = await getMoneyMovementData(vault, settler, ETH_DECIMALS, NULL_ADDRESS);
    let ethGasEstimate;
    try {
        ethGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, NULL_ADDRESS);
    } catch (err) {
        console.error("No Residule Eth");
        ethData.leftover = "0";
        if (parseFloat(ethData.required) > 0) {
            ethData.required = "0";
        }
    }

    let wbtcData = {
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    wbtcData = await getMoneyMovementData(vault, settler, WBTC_DECIMALS, wbtc.address);
    let wbtcGasEstimate;
    try {
        wbtcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, wbtc.address);
    } catch (err) {
        console.error("No residule wbtc")
        wbtcData.leftover = "0";
        if (parseFloat(wbtcData.required) > 0) {
            wbtcData.required = "0";
        }
    }

    let usdcData = { 
        queuedLiquidity: "0",
        withdrawalRequest: "0",
        leftover: "0",
        required: "0"
    };
    usdcData = await getMoneyMovementData(vault, settler, USDC_DECIMALS, usdc.address);
    let usdcGasEstimate;
    try {
        usdcGasEstimate = await vault.connect(settler as Signer).estimateGas.withdrawAsset(trader.address, usdc.address);
    } catch (err) {
        console.error("No residule usdc");
        usdcData.leftover = "0";
        if (parseFloat(usdcData.required) > 0){
            usdcData.required = "0";
        }
    }

    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceGweiStr = await ethers.utils.formatUnits(gasPrice, "gwei");
    const gasPriceGwei = parseFloat(gasPriceGweiStr);

    // const initiateSettlementResubmit = settlementResubmit(req.app);

    const success = req.params.success;
    let canSettleVault = await canSettle(vault);
    let canWithdraw;
    const round = await vault.currentRound();
    if (parseFloat(ethData.leftover) <= 0 && parseFloat(wbtcData.leftover) <= 0 && parseFloat(usdcData.leftover) <= 0) {
        canWithdraw = false;
    }
    else {
        const canSettleVault = (await canSettle(vault)) && round > 2;
        const areOptionParametersSet = await areOptionParamsSet(round);
        canWithdraw = !canSettleVault && !areOptionParametersSet;
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
            usdcGasEstimate,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            success,
            vaultAddress: vault.address,
            canWithdraw,
            showMoneyMovement: (await canShowMoneyMovement(vault, round))
        }
    );
}

export async function postMoneyMovement(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const wbtc = await getDeployedContractHelper("WBTC") as ERC20Mock;
    const usdc = await getDeployedContractHelper("USDC") as ERC20Mock;

    const trader = await getTrader();
    const settler = await getSettler();

    try {
        if (req.body.withdrawEth !== undefined) {
            await vault.connect(settler as Signer).withdrawAsset(trader.address, NULL_ADDRESS);
        }
        if (req.body.withdrawWbtc !== undefined) {
            await vault.connect(settler as Signer).withdrawAsset(trader.address, wbtc.address);
        }
        if (req.body.withdrawUsdc !== undefined) {
            await vault.connect(settler as Signer).withdrawAsset(trader.address, usdc.address);
        }
        res.redirect("/moneyMovement:true");
    } catch (err) {
        console.error(err);
        res.redirect("/moneyMovement:false")
    }

}