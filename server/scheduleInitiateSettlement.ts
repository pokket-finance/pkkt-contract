import { providers, Signer } from "ethers";
import { ethers } from "hardhat";
import cron from "node-cron";
import { OptionVault } from "../typechain";
import { getDeployedContractHelper, getSettler } from "./utilities/utilities";

// The maximum gas price we are willing to use
// Denominated in GWEI
const MAX_GAS_PRICE = 150;

// Schedule server to run initiate settlement
cron.schedule('* * * * *', async () => {
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const settler = await getSettler();
    try {
        const gasPrice = await ethers.provider.getGasPrice();
        const gasPriceGwei = ethers.utils.parseUnits(gasPrice.toString(), "gwei");
        if (gasPriceGwei.gt(MAX_GAS_PRICE)) {
            // Let the trader know and allow them
            // to resubmit the transaction with a higher gas price
            
        }
        console.log(`Server initiating settlement with gas price of ${gasPriceGwei}`);
        await vault.connect(settler as Signer).initiateSettlement();
    } catch (err) {
        console.error(err);
    }
});