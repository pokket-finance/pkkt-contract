"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptionParameter = exports.packOptionParameter = void 0;
const ethers_1 = require("ethers");
function packOptionParameter(strikePrice, premiumRate) {
    return ethers_1.BigNumber.from(strikePrice).shl(16).or(ethers_1.BigNumber.from(premiumRate));
}
exports.packOptionParameter = packOptionParameter;
function parseOptionParameter(value) {
    return [value.shr(16).toNumber(),
        value.and(ethers_1.BigNumber.from("0xffff")).toNumber()];
}
exports.parseOptionParameter = parseOptionParameter;
