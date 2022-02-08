"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const constants_1 = require("../../constants/constants");
const emailHelper_1 = require("../helper/emailHelper");
const main = async (_taskArgs, { deployments, network, run, getNamedAccounts }) => {
    const { settler } = await getNamedAccounts();
    const OptionLifecycle = await deployments.get("OptionLifecycle");
    const PKKTHodlBoosterOption = await deployments.get("PKKTHodlBoosterOption");
    const isMainnet = network.name === "mainnet";
    var usdcAddress = isMainnet ? constants_1.USDC_ADDRESS : process.env.USDC_ADDRESS;
    var wbtcAddress = isMainnet ? constants_1.WBTC_ADDRESS : process.env.WBTC_ADDRESS;
    try {
        await run("verify:verify", {
            address: OptionLifecycle.address,
        });
        console.log("Verified OptionLifecycle on etherscan");
    }
    catch (e) {
        console.error(e);
        //exit(-1);
    }
    const HODLBOOSTER_ARGS = [settler, [
            {
                depositAssetAmountDecimals: constants_1.ETH_DECIMALS,
                counterPartyAssetAmountDecimals: constants_1.USDC_DECIMALS,
                depositAsset: constants_1.NULL_ADDRESS,
                counterPartyAsset: usdcAddress,
                callOptionId: 0,
                putOptionId: 0
            },
            {
                depositAssetAmountDecimals: constants_1.WBTC_DECIMALS,
                counterPartyAssetAmountDecimals: constants_1.USDC_DECIMALS,
                depositAsset: wbtcAddress,
                counterPartyAsset: usdcAddress,
                callOptionId: 0,
                putOptionId: 0
            }
        ]];
    try {
        await run("verify:verify", {
            address: PKKTHodlBoosterOption.address,
            constructorArguments: HODLBOOSTER_ARGS,
            libraries: { OptionLifecycle: OptionLifecycle.address },
        });
        console.log("Verified PKKTHodlBoosterOption on etherscan");
    }
    catch (e) {
        console.error(e);
        (0, process_1.exit)(-1);
    }
    var emailer = await (0, emailHelper_1.getEmailer)();
    const emailContent = {
        to: emailer.emailTos,
        cc: emailer.emailCcs,
        subject: `PKKTHodlBoosterOption verified on etherscan`,
        content: `<h3>PKKTHodlBoosterOption verified on etherscan (${network.name})</h3>Please visit <a href="${process.env.ETHERSCAN_SITE}/address/${PKKTHodlBoosterOption.address}#code">smart contract code on etherscan (${network.name})</a>for more details`,
        isHtml: true
    };
    await emailer.emailSender.sendEmail(emailContent);
};
exports.default = main;
