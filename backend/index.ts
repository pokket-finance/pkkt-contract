import { ERC20Mock, OptionVault, PKKTHodlBoosterCallOption, PKKTHodlBoosterOption } from "../typechain";
import axios from "axios";
import express from "express";
import fsPromises from "fs/promises";
import * as dotenv from "dotenv";
dotenv.config();
import { deployments, ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { Contract } from "@ethersproject/contracts";

import { deployContract } from "../test/utilities/deploy";
import { ETH_DECIMALS, NULL_ADDRESS, SETTLEMENTPERIOD, USDC_DECIMALS, WBTC_DECIMALS } from "../constants/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


const USDCMultiplier = BigNumber.from(10).pow(USDC_DECIMALS);  
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);  
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);   
const ETHPricePrecision = 4;
const WBTCPricePrecision = 4;
const RationMultiplier = 10000;

const app = express();
const port = 3000;

// Make api request in "/" route
// app.get("/", async (req, res) => {
//     let HodlBoosterOption = await deployments.get("PKKTHodlBoosterCallOption");
//     let hodlBoosterOption = await ethers.getContractAt(
//         "PKKTHodlBoosterCallOption",
//         HodlBoosterOption.address
//     );
//     await getEtherScanData(hodlBoosterOption);
//     res.send("hello");
// });

// // Start the express server
// app.listen(port, () => {
//     console.log(`server is listening on ${port}`);
// });

const main = async () => {
    const [deployer, settler, alice, bob, trader]: SignerWithAddress[] = await ethers.getSigners();
    const [usdc, wbtc, optionVault, wbtcHodlBoosterCallOption] = await getDeployedContracts();
    await generateOptionData(
        settler,
        alice,
        bob,
        trader,
        usdc,
        wbtc,
        optionVault,
        wbtcHodlBoosterCallOption
    );
    await getVaultInfo();
    await getUsersNAV(alice, bob);
}

const getVaultInfo = async () => {
    const optionVault: OptionVault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const wbtc: ERC20Mock = await getDeployedContractHelper("WBTC") as ERC20Mock;
    let maturedAmount: BigNumber = await optionVault.getMaturedAmount(wbtc.address);
    let pendingAmount: BigNumber = await optionVault.getPendingAmount(wbtc.address);
    console.log(`Matured: ${maturedAmount}, Pending: ${pendingAmount}`);
}

const getUsersNAV = async (...users: SignerWithAddress[]) => {
    const wbtcHodlBoosterCallOption: PKKTHodlBoosterCallOption = await getDeployedContractHelper(
        "WBTCHodlBoosterCallOption"
    ) as PKKTHodlBoosterCallOption;
    for(const user of users) {
        let pendingAmount: BigNumber = await wbtcHodlBoosterCallOption
            .connect(user as Signer)
            .getPendingAsset();
        let ongoingAmount: BigNumber = await wbtcHodlBoosterCallOption
            .connect(user as Signer)
            .getOngoingAsset(0);
        let userNAV: BigNumber = pendingAmount.add(ongoingAmount);
        console.log("User NAV: ", userNAV.toString());
    }
}

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
        printOptionState(optionState);
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

main();