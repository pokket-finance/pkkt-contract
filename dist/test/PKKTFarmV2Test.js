"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const deploy_1 = require("./utilities/deploy");
const deployUpgradable_1 = require("./utilities/deployUpgradable");
const WEI = ethers_1.BigNumber.from(10).pow(18);
const CAP = ethers_1.BigNumber.from(1000).mul(WEI);
const MAX = ethers_1.BigNumber.from(500).mul(WEI);
describe("PKKT Farm", async function () {
    let pkktToken;
    let pkktFarmV2Test;
    let deployer;
    let alice;
    let bob;
    let carol;
    let minter;
    let lp;
    let lp2;
    before(async function () {
        [deployer, alice, bob, carol, minter] = await hardhat_1.ethers.getSigners();
    });
    context("With ERC/LP token added to the field (V2)", function () {
        it("new function should be added to upgrade", async function () {
            pkktToken = await (0, deploy_1.deployContract)("PKKTToken", deployer, ["PKKTToken", "PKKT", CAP.toString()]);
            this.owner = deployer;
            pkktFarmV2Test = await (0, deployUpgradable_1.deployUpgradeableContract)("PKKTFarmV2Test", deployer, [pkktToken.address, "100", 13602000]);
            const poolLength = await pkktFarmV2Test.poolLength();
            chai_1.assert.equal(await poolLength.toString(), "0");
            const testUpgrade = await pkktFarmV2Test.testUpgrade();
            chai_1.assert.equal(testUpgrade.toString(), "1");
        });
    });
});
