import express from "express";
import path from "path";
import { ethers, getNamedAccounts } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import cron from "node-cron";
import * as dotenv from "dotenv";
dotenv.config();

import {
    canSettle,
    getOptionContracts,
    getDeployedContractHelper,
    setSettlementParameters,
    getSettler,
} from "./utilities/utilities";
import {
    OptionVault
} from "../typechain";
import {
    OptionExecution,
} from "../constants/constants";

const app = express();
const port = 3000;

import { showEpoch } from "./routes/showEpoch";
import { getManualInitiateSettlement, setManualInitiateSettlement } from "./routes/initiateSettlement";
import { getSetEpoch, postSetEpoch, postSetPredictedEpoch } from "./routes/setEpoch";
import { getMoneyMovement, postMoneyMovement } from "./routes/moneyMovement";
import { getSetOptionDecision, postSetOptionDecision } from "./routes/setOptionDecision";

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

app.get("/initiateSettlement", getManualInitiateSettlement);

app.post("/initiateSettlement", setManualInitiateSettlement);

// CRON JOBS

// The maximum gas price we are willing to use
// Denominated in GWEI
const MAX_GAS_PRICE = 1.6;
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

// // Force a No exercise decision for the vaults
// // if the trader does not manually exercise 
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
