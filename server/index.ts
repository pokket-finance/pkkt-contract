import express from "express";
import path from "path";
import { ethers, getNamedAccounts } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

import {
    canSettle,
    areOptionParamsSet,
    getOptionContracts,
    getDeployedContractHelper,
    setSettlementParameters,
    getTrader,
    getSettler,
    getMoneyMovementData
} from "./utilities/utilities";
import {
    PKKTHodlBoosterOption,
    OptionVault
} from "../typechain";
import {
    ETH_PRICE_PRECISION,
    WBTC_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    OptionExecution,
    ETH_DECIMALS,
    USDC_DECIMALS,
    WBTC_DECIMALS,
    NULL_ADDRESS,
    WBTC_ADDRESS
} from "../constants/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ERC20Mock } from "../typechain";

const app = express();
const port = 3000;

import { showEpoch } from "./routes/showEpoch";
import { getManualInitiateSettlement, setManualInitiateSettlement } from "./routes/initiateSettlement";
import { getWithdrawAssets, postWithdrawAssets } from "./routes/withdrawAssets";
import { getSetEpoch, postSetEpoch, postSetPredictedEpoch } from "./routes/setEpoch";

module.exports = app;

// Config
// Decode Form URL encoded data
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, "frontendScripts")));
app.use(express.static(path.join(__dirname, "css")));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "/views"));

app.get("/set/epoch", getSetEpoch);

app.post("/set/epoch", postSetEpoch);

app.post("/set/predicted/epoch", postSetPredictedEpoch)

app.get("/show/epoch", showEpoch);

// app.post("/set/epoch", async (req, res) => {
//     const [
//         optionVault,
//         ethHodlBoosterCallOption,
//         ethHodlBoosterPutOption,
//         wbtcHodlBoosterCallOption,
//         wbtcHodlBoosterPutOption
//     ] = await getOptionContracts();
//     const ethCallPremium = parseFloat(req.body.ethCallPremium);
//     const ethPutPremium = parseFloat(req.body.ethPutPremium);
//     const wbtcCallPremium = parseFloat(req.body.wbtcCallPremium);
//     const wbtcPutPremium = parseFloat(req.body.wbtcPutPremium);
//     const ethCallStrikePrice = req.body.ethCallStrike * (10 ** ETH_PRICE_PRECISION);
//     const ethPutStrikePrice = req.body.ethPutStrike * (10 ** ETH_PRICE_PRECISION);
//     const wbtcCallStrikePrice = req.body.wbtcCallStrike * (10 ** WBTC_PRICE_PRECISION);
//     const wbtcPutStrikePrice = req.body.wbtcPutStrike * (10 ** WBTC_PRICE_PRECISION);
//     let optionParameters = [
//         {
//             pricePrecision: ETH_PRICE_PRECISION,
//             strikePrice: ethCallStrikePrice,
//             premiumRate: ethCallPremium * RATIO_MULTIPLIER,
//             option: ethHodlBoosterCallOption.address
//         },
//         {
//             pricePrecision: ETH_PRICE_PRECISION,
//             strikePrice: ethPutStrikePrice,
//             premiumRate: ethPutPremium * RATIO_MULTIPLIER,
//             option: ethHodlBoosterPutOption.address
//         },
//         {
//             pricePrecision: WBTC_PRICE_PRECISION,
//             strikePrice: wbtcCallStrikePrice,
//             premiumRate: wbtcCallPremium * RATIO_MULTIPLIER,
//             option: wbtcHodlBoosterCallOption.address
//         },
//         {
//             pricePrecision: WBTC_PRICE_PRECISION,
//             strikePrice: wbtcPutStrikePrice,
//             premiumRate: wbtcPutPremium * RATIO_MULTIPLIER,
//             option: wbtcHodlBoosterPutOption.address
//         }
//     ];
//     const settler = await getSettler()
//     try {
//         await optionVault.connect(settler as Signer).setOptionParameters(optionParameters);
//     } catch (err) {
//         console.error(err);
//     }

//     const predictedEthCallPremium = parseFloat(req.body.predictedEthCallPremium);
//     const predictedEthPutPremium = parseFloat(req.body.predictedEthPutPremium);
//     const predictedWbtcCallPremium = parseFloat(req.body.predictedWbtcCallPremium);
//     const predictedWbtcPutPremium = parseFloat(req.body.predictedWbtcPutPremium);
//     const predictedEthCallStrikePrice = req.body.predictedEthCallStrike;
//     const predictedEthPutStrikePrice = req.body.predictedEthPutStrike;
//     const predictedWbtcCallStrikePrice = req.body.predictedWbtcCallStrike;
//     const predictedWbtcPutStrikePrice = req.body.predictedWbtcPutStrike;
//     const predictedEthOption = {
//         callStrike: predictedEthCallStrikePrice,
//         putStrike: predictedEthPutStrikePrice,
//         callPremium: predictedEthCallPremium,
//         putPremium: predictedEthPutPremium
//     }
//     const predictedWbtcOption = {
//         callStrike: predictedWbtcCallStrikePrice,
//         putStrike: predictedWbtcPutStrikePrice,
//         callPremium: predictedWbtcCallPremium,
//         putPremium: predictedWbtcPutPremium
//     }

//     app.set("predictedEthOption", predictedEthOption);
//     app.set("predictedWbtcOption", predictedWbtcOption);
//     res.redirect("/show/epoch");
// });

// app.post("/setPredictedOptionParameters", async (req, res) => {
//     const ethCallPremium = parseFloat(req.body.predictedEthCallPremium);
//     const ethPutPremium = parseFloat(req.body.predictedEthPutPremium);
//     const wbtcCallPremium = parseFloat(req.body.predictedWbtcCallPremium);
//     const wbtcPutPremium = parseFloat(req.body.predictedWbtcPutPremium);
//     const ethCallStrikePrice = req.body.predictedEthCallStrike;
//     const ethPutStrikePrice = req.body.predictedEthPutStrike;
//     const wbtcCallStrikePrice = req.body.predictedWbtcCallStrike;
//     const wbtcPutStrikePrice = req.body.predictedWbtcPutStrike;
//     const predictedEthOption = {
//         callStrike: ethCallStrikePrice,
//         putStrike: ethPutStrikePrice,
//         callPremium: ethCallPremium,
//         putPremium: ethPutPremium
//     }
//     const predictedWbtcOption = {
//         callStrike: wbtcCallStrikePrice,
//         putStrike: wbtcPutStrikePrice,
//         callPremium: wbtcCallPremium,
//         putPremium: wbtcPutPremium
//     }

//     app.set("predictedEthOption", predictedEthOption);
//     app.set("predictedWbtcOption", predictedWbtcOption);

//     res.redirect("/show/epoch");
// });

app.get("/", async (req, res) => {
    const [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getOptionContracts();

    const settler = await getSettler()

    const round = await optionVault.currentRound();

    let tempParams = {
        depositDebt: "0",
        counterPartyDebt: "0",
        depositAssetWithdrawal: "0",
        counterPartyAssetWithdrawal: "0",
        newDepositAssetAmount: "0",
        newCounterPartyAssetAmount: "0",
        callStrikePrice: "0",
        putStrikePrice: "0"
    };
    let notExerciseEthData = tempParams;
    let exerciseCallEthData = tempParams;
    let exercisePutEthData = tempParams;
    let notExerciseWbtcData = tempParams;
    let exerciseCallWbtcData = tempParams;
    let exercisePutWbtcData = tempParams;

    const canSettleVault = await canSettle(
        optionVault,
        settler,
        round,
        [
            ethHodlBoosterPutOption,
            ethHodlBoosterCallOption,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption
        ]
    );

    if (canSettleVault && round.gt(2)) {
        const strikePriceDecimals = 4;

        notExerciseEthData = await getExerciseDecisionData(
            0,
            optionVault,
            settler,
            ethHodlBoosterCallOption,
            ethHodlBoosterPutOption,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exerciseCallEthData = await getExerciseDecisionData(
            1,
            optionVault,
            settler,
            ethHodlBoosterCallOption,
            ethHodlBoosterPutOption,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exercisePutEthData = await getExerciseDecisionData(
            2,
            optionVault,
            settler,
            ethHodlBoosterCallOption,
            ethHodlBoosterPutOption,
            ETH_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        notExerciseWbtcData = await getExerciseDecisionData(
            3,
            optionVault,
            settler,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exerciseCallWbtcData = await getExerciseDecisionData(
            4,
            optionVault,
            settler,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
        exercisePutWbtcData = await getExerciseDecisionData(
            5,
            optionVault,
            settler,
            wbtcHodlBoosterCallOption,
            wbtcHodlBoosterPutOption,
            WBTC_DECIMALS,
            USDC_DECIMALS,
            strikePriceDecimals
        );
    }

    res.render(
        "exerciseDecision",
        {
            notExerciseEthData,
            exerciseCallEthData,
            exercisePutEthData,
            notExerciseWbtcData,
            exerciseCallWbtcData,
            exercisePutWbtcData,
            canSettleVault,
            round
        }
    );
});

app.post("/exerciseDecision", async (req, res) => {
    const ethDecision = getExecutionStatus(req.body.ethOption);
    const wbtcDecision = getExecutionStatus(req.body.wbtcOption);
    await setSettlementParameters(ethDecision, wbtcDecision);
    res.redirect("/show/epoch");
});

/**
 * Turns information from form into the option execution
 * @param executionDecision string retrieved from form
 * @returns option execution decision
 */
function getExecutionStatus(executionDecision: String): OptionExecution {
    if (executionDecision == "noExercise"){
        return OptionExecution.NoExecution
    }
    else if (executionDecision == "exerciseCall") {
        return OptionExecution.ExecuteCall;
    }
    return OptionExecution.ExecutePut;
}

// TODO Move this type declaration somewhere else
type SettlementAccountingResult = {
    round: BigNumber
    depositAmount: BigNumber 
    autoRollAmount: BigNumber
    autoRollPremium: BigNumber 
    releasedAmount: BigNumber 
    releasedPremium: BigNumber
    autoRollCounterPartyAmount: BigNumber
    autoRollCounterPartyPremium: BigNumber
    releasedCounterPartyAmount: BigNumber
    releasedCounterPartyPremium: BigNumber
    option: String
    executed: Boolean
}

type OptionPairExecutionAccountingResult = {  
    callOptionResult: SettlementAccountingResult
    putOptionResult: SettlementAccountingResult
    execute: OptionExecution
}

async function getExerciseDecisionData(index, vault, settler, callOption, putOption, callOptionAssetDecimals, putOptionAssetDecimals, strikePriceDecimals) {
        let accounting: OptionPairExecutionAccountingResult = await vault.connect(settler as Signer).executionAccountingResult(index);
        
        let callAssetAutoRoll = accounting.callOptionResult.autoRollAmount
            .add(accounting.callOptionResult.autoRollPremium)
            .add(accounting.putOptionResult.autoRollCounterPartyAmount)
            .add(accounting.putOptionResult.autoRollCounterPartyPremium);
        let callAssetReleased = accounting.callOptionResult.releasedAmount
            .add(accounting.callOptionResult.releasedPremium)
            .add(accounting.putOptionResult.releasedCounterPartyAmount)
            .add(accounting.putOptionResult.releasedCounterPartyPremium);
        let depositDebt =  ethers.utils.formatUnits(
            accounting.callOptionResult.depositAmount
                .add(callAssetAutoRoll)
                .sub(callAssetReleased),
            callOptionAssetDecimals
        );

        let putAssetAutoRoll =  accounting.callOptionResult.autoRollCounterPartyAmount
            .add(accounting.callOptionResult.autoRollCounterPartyPremium)
            .add(accounting.putOptionResult.autoRollAmount)
            .add(accounting.putOptionResult.autoRollPremium);
        let putAssetReleased = accounting.callOptionResult.releasedCounterPartyAmount
            .add(accounting.callOptionResult.releasedCounterPartyPremium)
            .add(accounting.putOptionResult.releasedAmount)
            .add(accounting.putOptionResult.releasedPremium);
        let counterPartyDebt = ethers.utils.formatUnits(
            accounting.putOptionResult.depositAmount
                .add(putAssetAutoRoll)
                .sub(putAssetReleased),
            putOptionAssetDecimals
        );

        let callAssetReleasedStr = ethers.utils.formatUnits(callAssetReleased, callOptionAssetDecimals);
        
        let putAssetReleasedStr = ethers.utils.formatUnits(putAssetReleased, putOptionAssetDecimals);

        let newDepositAssetAmount = ethers.utils.formatUnits(
            accounting.callOptionResult.depositAmount,
            callOptionAssetDecimals
        );

        let newCounterPartyAssetAmount = ethers.utils.formatUnits(
            accounting.putOptionResult.depositAmount,
            putOptionAssetDecimals
        )

        let maturedCallOptionState = await callOption.optionStates(accounting.callOptionResult.round.sub(1));
        let callStrikePrice = ethers.utils.formatUnits(
            maturedCallOptionState.strikePrice,
            strikePriceDecimals
        )

        let maturedPutOptionState = await putOption.optionStates(accounting.putOptionResult.round.sub(1));
        let putStrikePrice = ethers.utils.formatUnits(
            maturedPutOptionState.strikePrice,
            strikePriceDecimals
        );

        return {
            depositDebt,
            counterPartyDebt,
            depositAssetWithdrawal: callAssetReleasedStr,
            counterPartyAssetWithdrawal: putAssetReleasedStr,
            newDepositAssetAmount,
            newCounterPartyAssetAmount,
            callStrikePrice,
            putStrikePrice
        };
}

app.get("/moneyMovement", async (req, res) => {
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
    res.render("moneyMovement", { ethData, wbtcData, usdcData });
});

// async function getMoneyMovementData(vault: OptionVault, settler: SignerWithAddress, assetDecimals, assetAddress: string) {
//     let assetCashFlow = await vault.connect(settler as Signer).settlementCashflowResult(assetAddress);
//     return {
//         queuedLiquidity: ethers.utils.formatUnits(
//             assetCashFlow.newDepositAmount,
//             assetDecimals
//         ),
//         withdrawalRequest: ethers.utils.formatUnits(
//             assetCashFlow.newReleasedAmount,
//             assetDecimals
//         ),
//         leftover: ethers.utils.formatUnits(
//             assetCashFlow.leftOverAmount,
//             assetDecimals
//         ),
//         required: ethers.utils.formatUnits(
//             assetCashFlow.leftOverAmount
//                 .add(assetCashFlow.newDepositAmount)
//                 .sub(assetCashFlow.newReleasedAmount),
//             assetDecimals
//         )
//     };
// }

app.post("/sendMoney", async (req, res) => {
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
    res.redirect("/show/epoch");
});

app.get("/initiateSettlement", getManualInitiateSettlement);

app.post("/initiateSettlement", setManualInitiateSettlement);

app.get("/withdrawAssets", getWithdrawAssets);

app.post("/withdrawAssets", postWithdrawAssets);

// CRON JOBS

// The maximum gas price we are willing to use
// Denominated in GWEI
const MAX_GAS_PRICE = 150;
const MAX_GAS_PRICE_WEI = ethers.utils.parseUnits(MAX_GAS_PRICE.toString(), "gwei");
// Schedule initiate settlement
// cron.schedule('* * * * *', async () => {
//     const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
//     const settler = await getSettler();
//     try {
//         const gasPriceWei = await ethers.provider.getGasPrice();
//         if (gasPriceWei.gt(MAX_GAS_PRICE_WEI)) {
//             // Let the trader know and allow them
//             // to resubmit the transaction with a higher gas price
//             await vault.connect(settler as Signer).initiateSettlement({ gasPrice: MAX_GAS_PRICE_WEI });
//             console.log(`Server initiating settlement with gas price of ${MAX_GAS_PRICE_WEI}`);
//             app.set("initiateSettlementResubmit", true);
//             app.set("settlerNonce", await settler.getTransactionCount());
//         }
//         else {
//             await vault.connect(settler as Signer).initiateSettlement();
//             console.log(`Server initiating settlement with gas price of ${gasPriceWei}`);
//             app.set("initiateSettlementResubmit", false);
//             app.set("settlerNonce", await settler.getTransactionCount());
//         }
//     } catch (err) {
//         console.error(err);
//     }
// });

// Force a No exercise decision for the vaults
// if the trader does not manually exercise 
// cron.schedule("* * * * *", async () => {
//     const [
//         optionVault,
//         ethHodlBoosterCallOption,
//         ethHodlBoosterPutOption,
//         wbtcHodlBoosterCallOption,
//         wbtcHodlBoosterPutOption
//     ] = await getOptionContracts();
//     const settler = await getSettler();
//     const round = await optionVault.currentRound();
//     const canSettleVault = await canSettle(
//         optionVault,
//         settler,
//         round,
//         [
//             ethHodlBoosterPutOption,
//             ethHodlBoosterCallOption,
//             wbtcHodlBoosterCallOption,
//             wbtcHodlBoosterPutOption
//         ]
//     );
//     // Force Settlement
//     if (canSettleVault) {
//         await setSettlementParameters(OptionExecution.NoExecution, OptionExecution.NoExecution);
//     }
// }, {
//     timezone: "Asia/Shanghai"
// });

// app.get("/graph", async (req, res) => {
//     const url = "https://api.thegraph.com/subgraphs/name/matt-user/option-rinkeby";
//     const response = await axios.post(url, {
//         query: `
//         {
//             users {
//                 id
//                 optionPositions {
//                     createdAtTimestamp
//                     optionBalance
//                 }
//             }
//         }`
//     });
//     console.log(JSON.stringify(response.data.data, null, 4));
//     res.send(JSON.stringify(response.data.data, null, 4));
// })

// app.get("/users/:userId", async (req, res) => {
//     const hodlBoosterOption: PKKTHodlBoosterOption = await getDeployedContractHelper(
//         "WBTCHodlBoosterCallOption"
//     ) as PKKTHodlBoosterOption;
//     await getVaultInfo(hodlBoosterOption);
//     const provider = new ethers.providers.JsonRpcProvider()
//     const user = provider.getSigner(req.params.userId);
//     await getUserNAV(hodlBoosterOption, user as Signer);
// });

// Start the express server
app.listen(port, () => {
    console.log(`server is listening on ${port}`);
});
