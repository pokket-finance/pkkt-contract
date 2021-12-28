import axios from "axios";
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
    RATIO_MULTIPLIER
} from "../constants/constants";

const app = express();
const port = 3000;

// config
// Decode Form URL encoded data
app.use(express.urlencoded());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "/views"));

app.get("/initiateEpoch", async (req, res) => {
    res.sendFile(path.join(__dirname, "/views/initiateEpoch.html"));
});

app.post("/initiateEpoch", async (req, res) => {
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
    const wbtcCallStrikePrice = req.body.wbtcCallStrike * (10 ** ETH_PRICE_PRECISION);
    const wbtcPutStrikePrice = req.body.wbtcPutSrike * (10 ** ETH_PRICE_PRECISION);
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
    await optionVault.connect(settler as Signer).setOptionParameters(optionParameters);
    res.send(JSON.stringify(req.body));
});

app.get("/", async (req, res) => {
    const [
        optionVault,
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ] = await getOptionContracts();
    const options = [
        ethHodlBoosterCallOption,
        ethHodlBoosterPutOption,
        wbtcHodlBoosterCallOption,
        wbtcHodlBoosterPutOption
    ]
    const optionTVLData = await getTVLOptionData(options, optionVault);
    // let optionDataTable = document.getElementById("optionTVLData") as HTMLElement;
    // for(let option of optionTVLData) {
    //     let newRow = document.createElement("tr");
    //     let nameData = document.createElement("td");
    //     nameData.innerHTML = option.name;
    //     let activeData = document.createElement("td");
    //     activeData.innerHTML = option.active;
    //     let lockedData = document.createElement("td");
    //     lockedData.innerHTML = option.locked;
    //     let releasedData = document.createElement("td");
    //     releasedData.innerHTML = option.released;
    //     let releasedCounterPartyData = document.createElement("td");
    //     releasedCounterPartyData.innerHTML = option.releasedCounterParty;
    //     newRow.appendChild(nameData); 
    //     newRow.appendChild(activeData);
    //     newRow.appendChild(lockedData);
    //     newRow.appendChild(releasedData);
    //     newRow.appendChild(releasedCounterPartyData);
    //     optionDataTable.appendChild(newRow);   
    // }
    res.render("optionTVLData", { optionTVLData });
});

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
