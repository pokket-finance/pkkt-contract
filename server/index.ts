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
import { getSetEpoch, postSetEpoch, postSetPredictedEpoch } from "./routes/setEpoch";
import { getMoneyMovement, postMoneyMovement } from "./routes/moneyMovement";

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

app.get("/moneyMovement", getMoneyMovement);

app.post("/moneyMovement", postMoneyMovement);

app.get("/initiateSettlement", getManualInitiateSettlement);

app.post("/initiateSettlement", setManualInitiateSettlement);

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

// Start the express server
app.listen(port, () => {
    console.log(`server is listening on ${port}`);
});
