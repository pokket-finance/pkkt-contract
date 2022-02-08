"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promptHelper_1 = __importDefault(require("../helper/promptHelper"));
const storageHelper_1 = require("../helper/storageHelper");
const emailHelper_1 = require("../helper/emailHelper");
const main = async ({}, { network, ethers, deployments }) => {
    var schema = {
        properties: {
            ownerAddress: {
                name: 'New Owner Address',
                pattern: /^0x[0-9A-Fa-f]{40}$/,
                message: 'Must be a hex starts with 0x',
                required: true
            },
        }
    };
    var result = await (0, promptHelper_1.default)(schema);
    const hodlBoosterOption = await deployments.get("PKKTHodlBoosterOption");
    const hodlBoosterOptionContract = await ethers.getContractAt("PKKTHodlBoosterOption", hodlBoosterOption.address);
    await hodlBoosterOptionContract.transferOwnership(result.ownerAddress);
    var fileStorage = (0, storageHelper_1.getFileStorage)();
    await fileStorage.writeValue("ownerAddress", result.ownerAddress);
    console.log(`Transfer ownership of PKKTHodlBoosterOption on ${network.name} to ${result.ownerAddress}`);
    var emailer = await (0, emailHelper_1.getEmailer)();
    const emailContent = {
        to: emailer.emailTos,
        cc: emailer.emailCcs,
        subject: `Transfer ownership of PKKTHodlBoosterOption on ${network.name}`,
        content: `<h3>Transfer ownership of PKKTHodlBoosterOption on ${network.name} to <b>${result.ownerAddress}</b></h3>Please keep make sure that account ${result.ownerAddress} is fully secured.`,
        isHtml: true
    };
    await emailer.emailSender.sendEmail(emailContent);
};
exports.default = main;
