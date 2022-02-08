"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const json_stable_stringify_1 = __importDefault(require("json-stable-stringify"));
const main = async ({ network }) => {
    console.log(network);
    const readdir = (0, util_1.promisify)(fs_1.default.readdir);
    const deploymentsDir = path_1.default.resolve(path_1.default.join(__dirname, "..", "..", "deployments"));
    const deploymentsSummary = path_1.default.resolve(path_1.default.join(__dirname, "..", "..", "constants", "deployments.json"));
    let networks = await readdir(deploymentsDir);
    networks = networks.filter((n) => !n.startsWith(".")); // filter out hidden files
    const excludeFiles = ["solcInputs"];
    let deployments = {};
    for (const network of networks) {
        deployments[network] = {};
        const networkDir = path_1.default.join(deploymentsDir, network);
        let files = await readdir(networkDir);
        const deploymentJSONs = files.filter((f) => !excludeFiles.includes(f) && !f.startsWith(".") && f.endsWith(".json"));
        for (const jsonFileName of deploymentJSONs) {
            const jsonPath = path_1.default.join(networkDir, jsonFileName);
            const deployData = JSON.parse((await (0, util_1.promisify)(fs_1.default.readFile)(jsonPath)).toString());
            const deployName = jsonFileName.split(".json")[0];
            deployments[network][deployName] = deployData.address;
        }
    }
    await (0, util_1.promisify)(fs_1.default.writeFile)(deploymentsSummary, (0, json_stable_stringify_1.default)(deployments, { space: 4 }) + "\n");
    console.log(`Updated deployments at ${deploymentsSummary}`);
};
exports.default = main;
