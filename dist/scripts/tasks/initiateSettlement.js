"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storageHelper_1 = require("../helper/storageHelper");
const emailHelper_1 = require("../helper/emailHelper");
const main = async ({}, { network, deployments, getNamedAccounts, ethers }) => {
    const { settler } = await getNamedAccounts();
    var storage = (0, storageHelper_1.getStorage)();
    var privateKey = (await storage.readValue("SETTLER_PRIVATE_KEY"));
    if (!privateKey) {
        console.error("Failed to find SETTLER_PRIVATE_KEY");
        return;
    }
    privateKey = privateKey.startsWith("0x") ? privateKey : ("0x" + privateKey);
    var settlerWallet = new ethers.Wallet(privateKey, ethers.provider);
    const hodlBoosterOption = await deployments.get("PKKTHodlBoosterOption");
    const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", hodlBoosterOption.address);
    const previousRound = await hodlBoosterOptionContract.currentRound();
    console.log(`PKKTHodlBoosterOption is currently under ${previousRound} epoch`);
    await hodlBoosterOptionContract.connect(settlerWallet).initiateSettlement();
    console.log("Initiated new epoch upon PKKTHodlBoosterOption");
    //wait for longer
    //await new Promise(resolve => setTimeout(resolve, parseInt(process.env.NETWORK_DELAY?? "10000"))); 
    const currentRound = previousRound + 1;
    console.log(`Initiate settlment for epoch ${currentRound} upon PKKTHodlBoosterOption on ${network.name} by ${settler}`);
    var emailer = await (0, emailHelper_1.getEmailer)();
    const emailContent = {
        to: emailer.emailTos,
        cc: emailer.emailCcs,
        subject: `Start new round for PKKTHodlBoosterOption on ${network.name}`,
        content: `Start new epoch for PKKTHodlBoosterOption on ${network.name}</br>Current epoch number is <b>${currentRound}</b>.</br>Please visit <a href="${process.env.TRADER_SITE}">Trader Site</a> with account ${settler} to set up the predicted data/make decision.`,
        isHtml: true
    };
    await emailer.emailSender.sendEmail(emailContent);
};
exports.default = main;
