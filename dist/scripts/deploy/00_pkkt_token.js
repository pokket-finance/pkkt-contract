"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants/constants");
const PKKTToken_json_1 = __importDefault(require("../../constants/abis/PKKTToken.json"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const main = async ({ network, deployments, getNamedAccounts, }) => {
    if (process.env.ONLY_HODLBOOSTER) {
        console.log("skip Deploying PKKTToken");
        return;
    }
    const { deploy } = deployments;
    console.log("00 - Deploying PKKTToken on", network.name);
    const { deployer, owner } = await getNamedAccounts();
    const result = await deploy("PKKTToken", {
        from: deployer,
        contract: {
            abi: PKKTToken_json_1.default,
            bytecode: constants_1.PKKTTOKEN_BYTECODE,
        },
        args: [process.env.PKKT_TOKEN_NAME, process.env.PKKT_SYMBOL, process.env.PKKT_CAP],
    });
    console.log(`00 - Deployed PKKTToken on ${network.name} to ${result.address}`);
};
main.tags = ["PKKTToken"];
exports.default = main;
