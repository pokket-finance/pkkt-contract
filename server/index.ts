import express from "express";
import path from "path";
import { ethers, getNamedAccounts } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import cron from "node-cron";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
dotenv.config();

import {
    canSettle,
    getDeployedContractHelper,
    setSettlementParameters,
    getSettler,
    initializeEmailer,
    transporter
} from "./utilities/utilities";
import {
    PKKTHodlBoosterOption
} from "../typechain";
import {
    OptionExecution,
} from "../constants/constants";

const app = express();
const port = 3001;

import { showEpoch } from "./routes/showEpoch";
import { getManualInitiateSettlement, setManualInitiateSettlement } from "./routes/initiateSettlement";
import { getSetEpoch, postSetEpoch, postSetPredictedEpoch } from "./routes/setEpoch";
import { getMoneyMovement, postMoneyMovement } from "./routes/moneyMovement";
import { getSetOptionDecision, postSetOptionDecision } from "./routes/setOptionDecision";
import { getPredictedData, getPredictedEthData, getPredictedWbtcData } from "./routes/predictedData";
import { getTraderBalance } from "./routes/traderBalance";

module.exports = app;

// Config
// Decode Form URL encoded data
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, "frontendScripts")));
app.use(express.static(path.join(__dirname, "css")));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "/views"));

app.get("/set/epoch:success?", getSetEpoch);

app.post("/set/epoch", postSetEpoch);

app.post("/set/predicted/epoch", postSetPredictedEpoch)

app.get("/show/epoch", showEpoch);

app.get("/set/decision:success?", getSetOptionDecision);

app.post("/set/decision", postSetOptionDecision);

app.get("/moneyMovement:success?", getMoneyMovement);

app.post("/moneyMovement", postMoneyMovement);

app.get("/initiateSettlement:success?", getManualInitiateSettlement);

app.post("/initiateSettlement", setManualInitiateSettlement);

app.get("/predicted/data", getPredictedData);

app.get("/predicted/data/eth", getPredictedEthData);

app.get("/predicted/data/wbtc", getPredictedWbtcData);

app.get("/trader/balance", getTraderBalance);

// Catch all show epoch
app.get("*", showEpoch);

// CRON JOBS

// The maximum gas price we are willing to use
// Denominated in GWEI
const MAX_GAS_PRICE = 16;
const MAX_GAS_PRICE_WEI = ethers.utils.parseUnits(MAX_GAS_PRICE.toString(), "gwei");
// Schedule initiate settlement
cron.schedule(process.env.INITIATE_SETTLEMENT_CONFIG!, async () => {
    console.log("Initiate Settlement cron job...");
    const vault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
    const settler = await getSettler();
    try {
        const gasPriceWei = await ethers.provider.getGasPrice();
        let tx;
        if (gasPriceWei.gt(MAX_GAS_PRICE_WEI)) {
            // Let the trader know and allow them
            // to resubmit the transaction with a higher gas price
            tx = await vault.connect(settler as Signer).initiateSettlement({ gasPrice: MAX_GAS_PRICE_WEI });
            console.log(`Server manually initiating settlement with gas price of ${MAX_GAS_PRICE_WEI}`);
            app.set("initiateSettlementResubmit", true);
        }
        else {
            tx = await vault.connect(settler as Signer).initiateSettlement({ gasPrice: gasPriceWei });
            console.log(`Server initiating settlement with gas price of ${gasPriceWei}`);
            app.set("initiateSettlementResubmit", false);
        }
        app.set("initiateSettlementTx", tx);
        ethers.provider.once(tx.hash, async (transaction) => {
            let info = await transporter.sendMail({
                from: '"SERVER" test@account',
                to: "matt.auer@pokket.com",
                subject: "Initiate Settlement Confirmation",
                text: "The Initiate Settlement transaction has been confirmed on the blockchain"
            });
            console.log("Message send: %s", info.messageId);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        });
    } catch (err) {
        console.error(err);
    }
});

// Force a No exercise decision for the vaults
// if the trader does not manually set parameters
// const DECISION_MAX_GAS_PRICE = 100;
// const DECISION_MAX_GAS_PRICE_WEI = ethers.utils.parseUnits(MAX_GAS_PRICE.toString(), "gwei");
// cron.schedule(process.env.SETTLE_CONFIG!, async () => {
//     console.log("Settle cron job...");
//     const optionVault = await getDeployedContractHelper("PKKTHodlBoosterOption") as PKKTHodlBoosterOption;
//     const settler = await getSettler();
//     const round = await optionVault.currentRound();
//     const canSettleVault = await canSettle(optionVault);
//     // Force Settlement
//     let tx;
//     let settleDecision = app.get("settleDecisions");
//     if (settleDecision === undefined) {
//         settleDecision = {};
//         settleDecision = [OptionExecution.NoExecution, OptionExecution.NoExecution];
//     }
//     let settleOverride = app.get("settleOverride");
//     if (settleOverride === undefined) {
//         settleOverride = false;
//     }
//     if (canSettleVault && !settleOverride) {
//         let gasPriceWei = await ethers.provider.getGasPrice();
//         if (gasPriceWei.gt(DECISION_MAX_GAS_PRICE_WEI)) {
//             gasPriceWei = DECISION_MAX_GAS_PRICE_WEI;
//         }
//         console.log(settleDecision);
//         try {
//             tx = await optionVault.connect(settler as Signer).settle(settleDecision, { gasPrice: gasPriceWei });
//             ethers.provider.once(tx.hash, async (transaction) => {
//                 let info = await transporter.sendMail({
//                     from: '"SERVER" test@account',
//                     to: "matt.auer@pokket.com",
//                     subject: "Exercise Decision Confirmation",
//                     text: "The ExerciseDecision transaction has been confirmed on the blockchain"
//                 });
//                 console.log("Message send: %s", info.messageId);
//                 console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//             });
//             app.set("settleDecisions", [OptionExecution.NoExecution, OptionExecution.NoExecution]);
//             app.set("settleOverride", false);
//             app.set("settleTx", tx);
//         } catch (err) {
//             console.error(err);
//         }
//     }
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
app.listen(port, async () => {
    console.log(`server is listening on ${port}`);
    await initializeEmailer();
});
