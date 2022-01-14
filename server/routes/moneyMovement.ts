import { Request, Response } from "express";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import nodemailer from "nodemailer";

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
    getTransactionInformation,
    resendTransaction,
    transporter,
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

    let tx = req.app.get("withdrawTx");
    const { minimumGasPrice, gasPriceGwei, transactionMined } = await getTransactionInformation(tx);
    let withdrawGasEstimate;
    try {
        withdrawGasEstimate = await await vault.connect(settler as Signer)
            .estimateGas.batchWithdrawAssets(trader.address, [wbtc.address, NULL_ADDRESS, usdc.address]);
        req.app.set("withdrawGasEstimate", withdrawGasEstimate);
    } catch {
        withdrawGasEstimate = req.app.get("withdrawGasEstimate");
        // Even though we withdraw the accounting result has not changed
        // Therefore we need to update the values for the frontend
        // if (transactionMined) {
        //     if (parseFloat(usdcData.leftover) > 0) {
        //         usdcData.leftover = "0";
        //     }
        //     if (parseFloat(usdcData.required) > 0){
        //         usdcData.required = "0";
        //     }
        //     if (parseFloat(wbtcData.leftover) > 0) {
        //         wbtcData.leftover = "0";
        //     }
        //     if (parseFloat(wbtcData.required) > 0) {
        //         wbtcData.required = "0";
        //     }
        //     if (parseFloat(ethData.leftover) > 0) {
        //         ethData.leftover = "0";
        //     }
        //     if (parseFloat(ethData.required) > 0) {
        //         ethData.required = "0";
        //     }
        // }
    }

    



    const success = req.params.success;
    let canSettleVault = await canSettle(vault);
    const round = await vault.currentRound();
    let canWithdraw = await canWithdrawAssets(ethData, wbtcData, usdcData, vault, round);
    // if (parseFloat(ethData.leftover) <= 0 && parseFloat(wbtcData.leftover) <= 0 && parseFloat(usdcData.leftover) <= 0) {
    //     canWithdraw = false;
    // }
    // else {
    //     const canSettleVault = (await canSettle(vault)) && round > 2;
    //     const areOptionParametersSet = await areOptionParamsSet(round);
    //     canWithdraw = !canSettleVault && !areOptionParametersSet;
    // }

    res.render(
        "moneyMovement",
        {
            recommendedGasPrice: gasPriceGwei,
            ethData,
            wbtcData,
            usdcData,
            gasEstimate: withdrawGasEstimate,
            showInitiateSettlement: await canShowInitiateSettlement(req.app),
            success,
            vaultAddress: vault.address,
            canWithdraw,
            showMoneyMovement: (await canShowMoneyMovement(vault, round)),
            transactionMined,
            minimumGasPrice
        }
    );
}

async function canWithdrawAssets(ethData, wbtcData, usdcData, vault, round): Promise<boolean> {
    if (parseFloat(ethData.leftover) <= 0 && parseFloat(wbtcData.leftover) <= 0 && parseFloat(usdcData.leftover) <= 0) {
        return false;
    }
    const canSettleVault = (await canSettle(vault)) && round > 2;
    const areOptionParametersSet = await areOptionParamsSet(round);
    return !canSettleVault && !areOptionParametersSet;
}

export async function postMoneyMovement(req: Request, res: Response) {
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const wbtc = await getDeployedContractHelper("WBTC") as ERC20Mock;
    const usdc = await getDeployedContractHelper("USDC") as ERC20Mock;

    const trader = await getTrader();
    const settler = await getSettler();
    const manualGasPriceWei = ethers.utils.parseUnits(req.body.manualGasPrice, "gwei");

    let tx = req.app.get("withdrawTx");
    let transactionMined = true;
    if (tx !== undefined) {
        transactionMined = await isTransactionMined(tx);
    }

    try {
        if (req.body.withdrawAssets !== undefined) {
            if (!transactionMined) {
                tx = await resendTransaction(tx, manualGasPriceWei);
            }
            else {
                tx =  await vault.connect(settler as Signer).batchWithdrawAssets(
                    trader.address,
                    [
                        wbtc.address,
                        NULL_ADDRESS,
                        usdc.address
                    ],
                    { gasPrice: manualGasPriceWei }
                );
            }
            ethers.provider.once(tx.hash,async (transaction) => {
                let info = await transporter.sendMail({
                    from: "'SERVER' test@account",
                    to: "matt.auer@pokket.com",
                    subject: "Withdraw Assets Confirmation",
                    text: "The Withdraw Assets Transaction has been confirmed."
                });
                console.log("Message send: %s", info.messageId);
                console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            })
            req.app.set("withdrawTx", tx);
            res.redirect("/moneyMovement:true");
        }
    } catch (err) {
        console.error(err);
        res.redirect("/moneyMovement:false")
    }
}