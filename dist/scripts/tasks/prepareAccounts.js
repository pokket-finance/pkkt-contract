"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const storageHelper_1 = require("../helper/storageHelper");
const promptHelper_1 = __importDefault(require("../helper/promptHelper"));
const main = async ({ forcesettlerkey }, { network, deployments, getNamedAccounts, ethers }) => {
    var schema = {
        properties: {
            deployerAddress: {
                name: 'Deployer Address',
                pattern: /^0x[0-9A-Fa-f]{40}$/,
                message: 'Must be a hex starts with 0x',
                required: true
            },
            deployerPrivateKey: {
                name: 'Deployer Account\'s Private Key',
                format: ' /^[0-9A-Fa-f]{64}$/',
                required: true,
                hidden: true,
                message: 'Must be a 64 length hex without 0x as prefix',
                replace: '*',
                conform: function (value) {
                    return true;
                }
            },
            settlerAddress: {
                name: 'Settler Address',
                pattern: /^0x[0-9A-Fa-f]{40}$/,
                message: 'Must be a hex starts with 0x',
                required: true
            },
            settlerPrivateKey: {
                name: 'Settler Account\'s Private Key',
                format: ' /^[0-9A-Fa-f]{64}$/',
                required: false,
                hidden: true,
                message: 'Must be a 64 length hex without 0x as prefix',
                replace: '*',
                conform: function (value) {
                    return true;
                }
            }
        }
    };
    var schema2 = {
        properties: {
            settlerPrivateKey: {
                name: 'Settler Account\'s Private Key',
                format: ' /^\d{64}$/',
                required: true,
                message: 'Must be a 64 length hex without 0x as prefix',
                replace: '*',
                conform: function (value) {
                    return true;
                }
            },
        }
    };
    var storage = (0, storageHelper_1.getStorage)();
    var fileStorage = (0, storageHelper_1.getFileStorage)();
    var deployerAddress = await fileStorage.readValue("deployerAddress");
    var settlerAddress = await fileStorage.readValue("settlerAddress");
    var deployerPrivateKey = await fileStorage.readValue("deployerPrivateKey");
    if (deployerAddress && settlerAddress && deployerPrivateKey) {
        console.log(`Deployer Address: ${deployerAddress}; Settler Address: ${settlerAddress}`);
        if (!forcesettlerkey) {
            return;
        }
        else {
            var settlerPrivateKey = await storage.readValue("SETTLER_PRIVATE_KEY");
            if (settlerPrivateKey) {
                return;
            }
            var result = await (0, promptHelper_1.default)(schema2);
            console.log(`Settler private key written to secured storage`);
            await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
            return;
        }
    }
    result = await (0, promptHelper_1.default)(schema);
    console.log(`Deployer Address: ${result.deployerAddress}; Settler Address: ${result.settlerAddress}`);
    await fileStorage.writeValue("deployerAddress", result.deployerAddress);
    await fileStorage.writeValue("settlerAddress", result.settlerAddress);
    await fileStorage.writeValue("deployerPrivateKey", result.deployerPrivateKey);
    await fileStorage.writeValue("ownerAddress", result.deployerAddress);
    if (result.settlerPrivateKey) {
        console.log(`Settler private key written to secured storage`);
        await storage.writeValue("SETTLER_PRIVATE_KEY", result.settlerPrivateKey);
    }
};
exports.default = main;
