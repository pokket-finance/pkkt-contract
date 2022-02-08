"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duration = exports.advanceTime = exports.advanceTimeAndBlock = exports.latest = exports.increase = exports.advanceBlockTo = exports.advanceBlock = void 0;
const hardhat_1 = require("hardhat");
const ethers_1 = require("ethers");
async function advanceBlock() {
    return hardhat_1.ethers.provider.send("evm_mine", []);
}
exports.advanceBlock = advanceBlock;
async function advanceBlockTo(blockNumber) {
    for (let i = await hardhat_1.ethers.provider.getBlockNumber(); i < blockNumber; i++) {
        await advanceBlock();
    }
}
exports.advanceBlockTo = advanceBlockTo;
async function increase(value) {
    await hardhat_1.ethers.provider.send("evm_increaseTime", [value]);
    await advanceBlock();
}
exports.increase = increase;
async function latest() {
    const block = await hardhat_1.ethers.provider.getBlock("latest");
    return ethers_1.BigNumber.from(block.timestamp);
}
exports.latest = latest;
async function advanceTimeAndBlock(time) {
    await advanceTime(time);
    await advanceBlock();
}
exports.advanceTimeAndBlock = advanceTimeAndBlock;
async function advanceTime(time) {
    await hardhat_1.ethers.provider.send("evm_increaseTime", [time]);
}
exports.advanceTime = advanceTime;
exports.duration = {
    seconds: function (val) {
        return ethers_1.BigNumber.from(val);
    },
    minutes: function (val) {
        return ethers_1.BigNumber.from(val).mul(this.seconds("60"));
    },
    hours: function (val) {
        return ethers_1.BigNumber.from(val).mul(this.minutes("60"));
    },
    days: function (val) {
        return ethers_1.BigNumber.from(val).mul(this.hours("24"));
    },
    weeks: function (val) {
        return ethers_1.BigNumber.from(val).mul(this.days("7"));
    },
    years: function (val) {
        return ethers_1.BigNumber.from(val).mul(this.days("365"));
    },
};
