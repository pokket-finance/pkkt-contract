import { PKKTHodlBoosterOption } from "../typechain";
import axios from "axios";
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { getVaultInfo } from "./getVaultInfo";
import { getUserNAV } from "./getUserNAV";
import { getDeployedContractHelper } from "./utilities/utilities";

const app = express();
const port = 3000;

app.get("/", async (req, res) => {
    const hodlBoosterOption: PKKTHodlBoosterOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterOption;
    await getVaultInfo(hodlBoosterOption);
    res.send("hello");
});

app.get("/:userId", async (req, res) => {
    const hodlBoosterOption: PKKTHodlBoosterOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterOption;
    await getVaultInfo(hodlBoosterOption);
    const provider = new ethers.providers.JsonRpcProvider()
    const user = provider.getSigner(req.params.userId);
    await getUserNAV(hodlBoosterOption, user as Signer);
});

// Start the express server
app.listen(port, () => {
    console.log(`server is listening on ${port}`);
});

// Makes api request to etherscan to get data about our options
const getEtherScanData = async (hodlBoosterOption) => {
    console.log(`Retrieving Data from Etherscan for ${hodlBoosterOption.address}`);
    const response = await getData(
        {
            module: "account",
            action: "tokentx",
            address: hodlBoosterOption.address,
            startblock: "0",
            endblock: "99999999",
            page: "1",
            offset: "100",
            sort: "asc"
        }
    );
    const result = response.data.result;
    const blockNumbers = result.map(res => res.blockNumber);
    console.log(blockNumbers);
    for(let blockNumber of blockNumbers) {
        const optionState = await hodlBoosterOption.getRoundData(blockNumber);
        //printOptionState(optionState);
    }
}

// Helper function to generate api url and request the endpoint
const getData = async (params) => {
    let url = "https://api-rinkeby.etherscan.io/api?";
    // Generate api url parameters
    url += Object.entries(params).map(([key, value]) => `${key}=${value}`).join("&");
    url += `&apikey=${[process.env.ETHERSCAN_API_KEY]}`;
    return axios.get(url);
}

//main();