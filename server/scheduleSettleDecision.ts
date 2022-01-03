import { ethers } from "hardhat";
import cron from "node-cron";
import { OptionExecution } from "../constants/constants";
import { OptionVault } from "../typechain";
import { canSettle, getDeployedContractHelper, setSettlementParameters } from "./utilities/utilities";

// Schedule tasks to be run on the server
cron.schedule('* * * * *', async () => {
    const vault = await getDeployedContractHelper("OptionVault") as OptionVault;
    const [, settler] = await ethers.getSigners();
    const round = await vault.currentRound();
    const canSettlevault = await canSettle(vault, settler, round);
    if (canSettlevault) {
        console.log("Forcing settle from server...");
        await setSettlementParameters(OptionExecution.NoExecution, OptionExecution.NoExecution);
    }
});