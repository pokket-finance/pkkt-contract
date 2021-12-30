import express from "express";
import path from "path";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

import {
    getTVLOptionData,
    getDeployedContractHelper
} from "./utilities/utilities";

import {
    PKKTHodlBoosterOption,
    OptionVault
} from "../typechain";
import {
    ETH_PRICE_PRECISION,
    WBTC_PRICE_PRECISION,
    RATIO_MULTIPLIER,
    OptionExecution
} from "../constants/constants";

const app = express();
const port = 3000;

// config
// Decode Form URL encoded data
app.use(express.urlencoded());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "/views"));

app.get("/initiateEpoch", async (req, res) => {
    const optionVault = await getDeployedContractHelper("OptionVault");
    const round = await optionVault.currentRound();
    const areOptionParametersSet = await areOptionParamsSet(round);
    res.render("initiateEpoch", { round, areOptionParametersSet });
});

async function areOptionParamsSet(round: BigNumber): Promise<Boolean> {
    if (round.isZero()) {
        return false;
    }
    const ethHodlBoosterCallOption = await getDeployedContractHelper(
        "ETHHodlBoosterCallOption"
    ) as PKKTHodlBoosterOption;
    const ethHodlBoosterPutOption = await getDeployedContractHelper(
        "ETHHodlBoosterPutOption"
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterPutOption = await getDeployedContractHelper(
        "WBTCHodlBoosterPutOption"
    ) as PKKTHodlBoosterOption;

    const ethCallOptionState = await ethHodlBoosterCallOption.optionStates(round.sub(1));
    const ethPutOptionState = await ethHodlBoosterPutOption.optionStates(round.sub(1));
    const wbtcCallOptionState = await wbtcHodlBoosterCallOption.optionStates(round.sub(1));
    const wbtcPutOptionState = await wbtcHodlBoosterPutOption.optionStates(round.sub(1));

    const optionStates = [ethCallOptionState, ethPutOptionState, wbtcCallOptionState, wbtcPutOptionState];
    for (let optionState of optionStates) {
        if (!optionState.strikePrice.isZero() || optionState.premiumRate !== 0) {
            return true;
        }
    }
    return false;
}

app.get("/show/epoch", async (req, res) => {
    const [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getOptionContracts();
    let round = await optionVault.currentRound();

    let predictedEthOption;
    let predictedWbtcOption;
    if (round.isZero()) {
        round = BigNumber.from(1);

    }
    predictedEthOption = app.get("predictedEthOption");
    predictedWbtcOption = app.get("predictedWbtcOption");
    if(predictedWbtcOption === undefined || predictedEthOption === undefined) {
        predictedEthOption = {
            callStrike: 0,
            putStrike: 0,
            callPremium: 0,
            putPremium: 0
        }
        predictedWbtcOption = {
            callStrike: 0,
            putStrike: 0,
            callPremium: 0,
            putPremium: 0
        }
    }

    // Get contract option data to display
    const ethCallOptionState = await ethHodlBoosterCallOption.optionStates(round.sub(1));
    const ethPutOptionState = await ethHodlBoosterPutOption.optionStates(round.sub(1));
    const wbtcCallOptionState = await wbtcHodlBoosterCallOption.optionStates(round.sub(1));
    const wbtcPutOptionState = await wbtcHodlBoosterPutOption.optionStates(round.sub(1));
    const ethOption = {
        callStrike: ethCallOptionState.strikePrice.div(10 ** ETH_PRICE_PRECISION),
        putStrike: ethPutOptionState.strikePrice.div(10 ** ETH_PRICE_PRECISION),
        callPremium: ethCallOptionState.premiumRate / RATIO_MULTIPLIER,
        putPremium: ethPutOptionState.premiumRate / RATIO_MULTIPLIER
    }
    const wbtcOption = {
        callStrike: wbtcCallOptionState.strikePrice.div(10 ** WBTC_PRICE_PRECISION),
        putStrike: wbtcPutOptionState.strikePrice.div(10 ** WBTC_PRICE_PRECISION),
        callPremium: wbtcCallOptionState.premiumRate / RATIO_MULTIPLIER,
        putPremium: wbtcPutOptionState.premiumRate / RATIO_MULTIPLIER
    }
    res.render(
        "showEpoch",
        {
            round,
            ethOption,
            predictedEthOption: predictedEthOption,
            wbtcOption,
            predictedWbtcOption: predictedWbtcOption
        }
    );
});

app.post("/setOptionParameters", async (req, res) => {
    const [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getOptionContracts();
    const ethCallPremium = parseFloat(req.body.ethCallPremium);
    const ethPutPremium = parseFloat(req.body.ethPutPremium);
    const wbtcCallPremium = parseFloat(req.body.wbtcCallPremium);
    const wbtcPutPremium = parseFloat(req.body.wbtcPutPremium);
    const ethCallStrikePrice = req.body.ethCallStrike * (10 ** ETH_PRICE_PRECISION);
    const ethPutStrikePrice = req.body.ethPutStrike * (10 ** ETH_PRICE_PRECISION);
    const wbtcCallStrikePrice = req.body.wbtcCallStrike * (10 ** WBTC_PRICE_PRECISION);
    const wbtcPutStrikePrice = req.body.wbtcPutStrike * (10 ** WBTC_PRICE_PRECISION);
    let optionParameters = [
        {
            pricePrecision: ETH_PRICE_PRECISION,
            strikePrice: ethCallStrikePrice,
            premiumRate: ethCallPremium * RATIO_MULTIPLIER,
            option: ethHodlBoosterCallOption.address
        },
        {
            pricePrecision: ETH_PRICE_PRECISION,
            strikePrice: ethPutStrikePrice,
            premiumRate: ethPutPremium * RATIO_MULTIPLIER,
            option: ethHodlBoosterPutOption.address
        },
        {
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePrice: wbtcCallStrikePrice,
            premiumRate: wbtcCallPremium * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterCallOption.address
        },
        {
            pricePrecision: WBTC_PRICE_PRECISION,
            strikePrice: wbtcPutStrikePrice,
            premiumRate: wbtcPutPremium * RATIO_MULTIPLIER,
            option: wbtcHodlBoosterPutOption.address
        }
    ];
    const [, settler] = await ethers.getSigners();
    try {
        await optionVault.connect(settler as Signer).setOptionParameters(optionParameters);
    } catch (err) {
        console.error(err);
    }

    const predictedEthCallPremium = parseFloat(req.body.predictedEthCallPremium);
    const predictedEthPutPremium = parseFloat(req.body.predictedEthPutPremium);
    const predictedWbtcCallPremium = parseFloat(req.body.predictedWbtcCallPremium);
    const predictedWbtcPutPremium = parseFloat(req.body.predictedWbtcPutPremium);
    const predictedEthCallStrikePrice = req.body.predictedEthCallStrike;
    const predictedEthPutStrikePrice = req.body.predictedEthPutStrike;
    const predictedWbtcCallStrikePrice = req.body.predictedWbtcCallStrike;
    const predictedWbtcPutStrikePrice = req.body.predictedWbtcPutStrike;
    const predictedEthOption = {
        callStrike: predictedEthCallStrikePrice,
        putStrike: predictedEthPutStrikePrice,
        callPremium: predictedEthCallPremium,
        putPremium: predictedEthPutPremium
    }
    const predictedWbtcOption = {
        callStrike: predictedWbtcCallStrikePrice,
        putStrike: predictedWbtcPutStrikePrice,
        callPremium: predictedWbtcCallPremium,
        putPremium: predictedWbtcPutPremium
    }

    // console.log(predictedEthOption);
    // console.log(predictedWbtcOption);

    app.set("predictedEthOption", predictedEthOption);
    app.set("predictedWbtcOption", predictedWbtcOption);
    res.redirect("/show/epoch");
});

app.post("/setPredictedOptionParameters", async (req, res) => {
    const ethCallPremium = parseFloat(req.body.predictedEthCallPremium);
    const ethPutPremium = parseFloat(req.body.predictedEthPutPremium);
    const wbtcCallPremium = parseFloat(req.body.predictedWbtcCallPremium);
    const wbtcPutPremium = parseFloat(req.body.predictedWbtcPutPremium);
    const ethCallStrikePrice = req.body.predictedEthCallStrike;
    const ethPutStrikePrice = req.body.predictedEthPutStrike;
    const wbtcCallStrikePrice = req.body.predictedWbtcCallStrike;
    const wbtcPutStrikePrice = req.body.predictedWbtcPutStrike;
    const predictedEthOption = {
        callStrike: ethCallStrikePrice,
        putStrike: ethPutStrikePrice,
        callPremium: ethCallPremium,
        putPremium: ethPutPremium
    }
    const predictedWbtcOption = {
        callStrike: wbtcCallStrikePrice,
        putStrike: wbtcPutStrikePrice,
        callPremium: wbtcCallPremium,
        putPremium: wbtcPutPremium
    }

    app.set("predictedEthOption", predictedEthOption);
    app.set("predictedWbtcOption", predictedWbtcOption);

    res.redirect("/show/epoch");
});

app.get("/", async (req, res) => {
    res.render("exerciseDecision");
});

async function getExerciseDecisionData(vault, settler, callOptionAssetDecimals) {
    let exerciseDecisionData: any = [];
    for(let index = 0; index < 6; ++index) {
        let accounting = await vault.connect(settler as Signer).executionAccountingResult(index);
        let decision;
        if (accounting.execute == OptionExecution.NoExecution) {
            decision = "No Exercise";
        }
        else if (accounting.execute == OptionExecution.ExecuteCall) {
            decision = "Exercise call";
        }
        else {
            decision = "Exercise Put";
        }

        let callAssetAutoRoll = accounting.callOptionResult.autoRollAmount
                                    .add(accounting.callOptionResult.autoRollPremium)
                                    .add(accounting.putOptionResult.autoRollCounterPartyAmount)
                                    .add(accounting.putOptionResult.autoRollCounterPartyPremium);
        let callAssetReleased = accounting.callOptionResult.releasedAmount
                                    .add(accounting.callOptionResult.releasedPremium)
                                    .add(accounting.putOptionResult.releasedCounterPartyAmount)
                                    .add(accounting.putOptionResult.releasedCounterPartyPremium);
        
        let depositDebt = ethers.utils.formatUnits(
            accounting.callOptionResult.depositAmount
                .add(callAssetAutoRoll)
                .sub(callAssetReleased),
            callOptionAssetDecimals
        );
    }
}

async function getOptionContracts(): Promise<[
    OptionVault,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterOption,
    PKKTHodlBoosterOption
]> {
    const optionVault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const ethHodlBoosterCallOption = await getDeployedContractHelper(
        "ETHHodlBoosterCallOption"
    ) as PKKTHodlBoosterOption;
    const ethHodlBoosterPutOption = await getDeployedContractHelper(
        "ETHHodlBoosterPutOption"
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterOption;
    const wbtcHodlBoosterPutOption = await getDeployedContractHelper(
        "WBTCHodlBoosterPutOption"
    ) as PKKTHodlBoosterOption;
    return [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ];
}

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
