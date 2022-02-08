"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const deploy_1 = require("./utilities/deploy");
const timer_1 = require("./utilities/timer");
const constants_1 = require("../constants/constants");
const CAP = ethers_1.BigNumber.from(1000).mul(constants_1.WEI);
const MAX = ethers_1.BigNumber.from(500).mul(constants_1.WEI);
const USDTMultiplier = ethers_1.BigNumber.from(10).pow(constants_1.USDT_DECIMALS);
const USDCMultiplier = ethers_1.BigNumber.from(10).pow(constants_1.USDC_DECIMALS);
const DAIMultiplier = ethers_1.BigNumber.from(10).pow(constants_1.DAI_DECIMALS);
describe.skip("PKKT Vault", async function () {
    let pkktToken;
    let pkktVault;
    let deployer;
    let alice;
    let bob;
    let carol;
    let trader;
    let usdt;
    let usdc;
    let dai;
    let vault;
    before(async function () {
        [deployer, alice, bob, carol, trader] = await hardhat_1.ethers.getSigners();
        vault = await (0, deploy_1.deployContract)("Vault", deployer);
    });
    context("With vault added to the field", function () {
        beforeEach(async function () {
            pkktToken = await (0, deploy_1.deployContract)("PKKTToken", deployer, ["PKKTToken", "PKKT", CAP.toString()]);
            this.owner = deployer;
            usdt = await (0, deploy_1.deployContract)("ERC20Mock", deployer, ["USDTToken", "USDT", ethers_1.BigNumber.from(10000).mul(USDTMultiplier), constants_1.USDT_DECIMALS]);
            usdc = await (0, deploy_1.deployContract)("ERC20Mock", deployer, ["USDCToken", "USDC", ethers_1.BigNumber.from(10000).mul(USDCMultiplier), constants_1.USDC_DECIMALS]);
            dai = await (0, deploy_1.deployContract)("ERC20Mock", deployer, ["DAIToken", "DAI", ethers_1.BigNumber.from(10000).mul(DAIMultiplier), constants_1.DAI_DECIMALS]);
            await usdt.transfer(alice.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            await usdt.transfer(bob.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            await usdt.transfer(carol.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            await usdc.transfer(alice.address, ethers_1.BigNumber.from(100).mul(USDCMultiplier));
            await usdc.transfer(bob.address, ethers_1.BigNumber.from(100).mul(USDCMultiplier));
            await usdc.transfer(carol.address, ethers_1.BigNumber.from(100).mul(USDCMultiplier));
            await dai.transfer(alice.address, ethers_1.BigNumber.from(100).mul(DAIMultiplier));
            await dai.transfer(bob.address, ethers_1.BigNumber.from(100).mul(DAIMultiplier));
            await dai.transfer(carol.address, ethers_1.BigNumber.from(100).mul(DAIMultiplier));
        });
        afterEach(async function () {
            const alicePkkt = await pkktToken.balanceOf(alice.address);
            await pkktToken.connect(alice).approve(deployer.address, alicePkkt);
            await pkktToken.burnFrom(alice.address, alicePkkt);
            const bobPkkt = await pkktToken.balanceOf(bob.address);
            await pkktToken.connect(bob).approve(deployer.address, bobPkkt);
            await pkktToken.burnFrom(bob.address, bobPkkt);
            const carolPkkt = await pkktToken.balanceOf(carol.address);
            await pkktToken.connect(carol).approve(deployer.address, carolPkkt);
            await pkktToken.burnFrom(carol.address, carolPkkt);
            chai_1.assert.equal((await pkktToken.totalSupply()).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(alice.address)).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(bob.address)).toString(), "0");
            chai_1.assert.equal((await pkktToken.balanceOf(carol.address)).toString(), "0");
            await pkktToken.removeMinter(pkktVault.address);
        });
        it("should allow deposit and redeem", async function () {
            pkktVault = await (0, deploy_1.deployContract)("PKKTVault", { signer: deployer, libraries: { Vault: vault.address } });
            pkktVault.initialize(pkktToken.address, "100", 13601000, trader.address);
            await pkktToken.addMinter(pkktVault.address, MAX);
            await pkktVault.addMany([
                { underlying: usdt.address, decimals: constants_1.USDT_DECIMALS },
                { underlying: usdc.address, decimals: constants_1.USDC_DECIMALS },
                { underlying: dai.address, decimals: constants_1.DAI_DECIMALS }
            ], true);
            await usdt.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            var aliceUSDT = await usdt.balanceOf(alice.address);
            chai_1.assert.equal(aliceUSDT.toString(), ethers_1.BigNumber.from(100).mul(USDTMultiplier).toString());
            await pkktVault.connect(alice).deposit(0, ethers_1.BigNumber.from(10).mul(USDTMultiplier));
            var aliceUSDT = await usdt.balanceOf(alice.address);
            chai_1.assert.equal(aliceUSDT.toString(), ethers_1.BigNumber.from(90).mul(USDTMultiplier).toString());
            var vaultInfo = await pkktVault.vaultInfo(0);
            chai_1.assert.equal(vaultInfo.totalPending.toString(), ethers_1.BigNumber.from(10).mul(USDTMultiplier).toString());
            await pkktVault.connect(alice).redeem(0, ethers_1.BigNumber.from(5).mul(USDTMultiplier));
            var aliceUSDT = await usdt.balanceOf(alice.address);
            chai_1.assert.equal(aliceUSDT.toString(), ethers_1.BigNumber.from(95).mul(USDTMultiplier).toString());
            vaultInfo = await pkktVault.vaultInfo(0);
            chai_1.assert.equal(vaultInfo.totalPending.toString(), ethers_1.BigNumber.from(5).mul(USDTMultiplier).toString());
            await pkktVault.connect(alice).maxRedeem(0);
            var aliceUSDT = await usdt.balanceOf(alice.address);
            chai_1.assert.equal(aliceUSDT.toString(), ethers_1.BigNumber.from(100).mul(USDTMultiplier).toString());
            vaultInfo = await pkktVault.vaultInfo(0);
            chai_1.assert.equal(vaultInfo.totalPending.toString(), "0");
        });
        it("should allow deposit and settle and withdraw", async function () {
            pkktVault = await (0, deploy_1.deployContract)("PKKTVault", { signer: deployer, libraries: { Vault: vault.address } });
            pkktVault.initialize(pkktToken.address, "100", 13601000, trader.address);
            await pkktToken.addMinter(pkktVault.address, MAX);
            await pkktVault.addMany([
                { underlying: usdt.address, decimals: constants_1.USDT_DECIMALS },
                { underlying: usdc.address, decimals: constants_1.USDC_DECIMALS },
                { underlying: dai.address, decimals: constants_1.DAI_DECIMALS }
            ], true);
            await usdt.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            await pkktVault.connect(alice).deposit(0, ethers_1.BigNumber.from(10).mul(USDTMultiplier));
            await usdc.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDCMultiplier));
            await pkktVault.connect(alice).deposit(1, ethers_1.BigNumber.from(5).mul(USDCMultiplier));
            await dai.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(DAIMultiplier));
            await pkktVault.connect(alice).deposit(2, ethers_1.BigNumber.from(2).mul(DAIMultiplier));
            var settelled = await pkktVault.isSettelled();
            chai_1.assert.isTrue(settelled);
            var vaultInfo1 = await pkktVault.vaultInfo(0);
            var vaultInfo2 = await pkktVault.vaultInfo(1);
            var vaultInfo3 = await pkktVault.vaultInfo(2);
            chai_1.assert.equal(vaultInfo1.totalPending.toString(), ethers_1.BigNumber.from(10).mul(USDTMultiplier).toString());
            chai_1.assert.equal(vaultInfo2.totalPending.toString(), ethers_1.BigNumber.from(5).mul(USDCMultiplier).toString());
            chai_1.assert.equal(vaultInfo3.totalPending.toString(), ethers_1.BigNumber.from(2).mul(DAIMultiplier).toString());
            chai_1.assert.equal(vaultInfo1.totalMatured.toString(), "0");
            chai_1.assert.equal(vaultInfo2.totalMatured.toString(), "0");
            chai_1.assert.equal(vaultInfo3.totalMatured.toString(), "0");
            chai_1.assert.equal(vaultInfo1.totalOngoing.toString(), "0");
            chai_1.assert.equal(vaultInfo2.totalOngoing.toString(), "0");
            chai_1.assert.equal(vaultInfo3.totalOngoing.toString(), "0");
            chai_1.assert.equal(vaultInfo1.totalRequesting.toString(), "0");
            chai_1.assert.equal(vaultInfo2.totalRequesting.toString(), "0");
            chai_1.assert.equal(vaultInfo3.totalRequesting.toString(), "0");
            await pkktVault.connect(trader).initiateSettlement("100", trader.address);
            /*const diff1 = await pkktVault.settlementResult[0];
            assert.equal(diff1.toString(), BigNumber.from(10).mul(USDTMultiplier).toString());
            const diff2 = await pkktVault.settlementResult[0];
            assert.equal(diff2.toString(), BigNumber.from(5).mul(USDCMultiplier).toString());
            const diff3 = await pkktVault.settlementResult[0];
            assert.equal(diff3.toString(), BigNumber.from(2).mul(DAIMultiplier).toString());*/
            settelled = await pkktVault.isSettelled();
            chai_1.assert.isTrue(settelled);
            vaultInfo1 = await pkktVault.vaultInfo(0);
            vaultInfo2 = await pkktVault.vaultInfo(1);
            vaultInfo3 = await pkktVault.vaultInfo(2);
            chai_1.assert.equal(vaultInfo1.totalPending.toString(), "0");
            chai_1.assert.equal(vaultInfo2.totalPending.toString(), "0");
            chai_1.assert.equal(vaultInfo3.totalPending.toString(), "0");
            chai_1.assert.equal(vaultInfo1.totalMatured.toString(), "0");
            chai_1.assert.equal(vaultInfo2.totalMatured.toString(), "0");
            chai_1.assert.equal(vaultInfo3.totalMatured.toString(), "0");
            chai_1.assert.equal(vaultInfo1.totalOngoing.toString(), ethers_1.BigNumber.from(10).mul(USDTMultiplier).toString());
            chai_1.assert.equal(vaultInfo2.totalOngoing.toString(), ethers_1.BigNumber.from(5).mul(USDCMultiplier).toString());
            chai_1.assert.equal(vaultInfo3.totalOngoing.toString(), ethers_1.BigNumber.from(2).mul(DAIMultiplier).toString());
            chai_1.assert.equal(vaultInfo1.totalRequesting.toString(), "0");
            chai_1.assert.equal(vaultInfo2.totalRequesting.toString(), "0");
            chai_1.assert.equal(vaultInfo3.totalRequesting.toString(), "0");
            var trader1 = await usdt.balanceOf(trader.address);
            var trader2 = await usdc.balanceOf(trader.address);
            var trader3 = await dai.balanceOf(trader.address);
            chai_1.assert.equal(trader1.toString(), ethers_1.BigNumber.from(10).mul(USDTMultiplier).toString());
            chai_1.assert.equal(trader2.toString(), ethers_1.BigNumber.from(5).mul(USDCMultiplier).toString());
            chai_1.assert.equal(trader3.toString(), ethers_1.BigNumber.from(2).mul(DAIMultiplier).toString());
            //mimicing moving forward
            await (0, timer_1.advanceBlockTo)(1360109);
            await (0, chai_1.expect)(pkktVault.connect(alice).initiateWithdraw(0, ethers_1.BigNumber.from(11).mul(USDTMultiplier))).to.be.revertedWith("Exceeds available");
            await (0, chai_1.expect)(pkktVault.connect(alice).initiateWithdraw(1, ethers_1.BigNumber.from(6).mul(USDCMultiplier))).to.be.revertedWith("Exceeds available");
            await (0, chai_1.expect)(pkktVault.connect(alice).initiateWithdraw(2, ethers_1.BigNumber.from(3).mul(DAIMultiplier))).to.be.revertedWith("Exceeds available");
            //should allow
            await pkktVault.connect(alice).initiateWithdraw(0, ethers_1.BigNumber.from(7).mul(USDTMultiplier));
            await pkktVault.connect(alice).initiateWithdraw(1, ethers_1.BigNumber.from(3).mul(USDCMultiplier));
            await pkktVault.connect(alice).initiateWithdraw(2, ethers_1.BigNumber.from(2).mul(DAIMultiplier));
            var usdtVault = await pkktVault.userInfo(0, alice.address);
            var usdcVault = await pkktVault.userInfo(1, alice.address);
            var daiVault = await pkktVault.userInfo(2, alice.address);
            chai_1.assert.equal(usdtVault.requestingAmount.toString(), ethers_1.BigNumber.from(7).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdcVault.requestingAmount.toString(), ethers_1.BigNumber.from(3).mul(USDCMultiplier).toString());
            chai_1.assert.equal(daiVault.requestingAmount.toString(), ethers_1.BigNumber.from(2).mul(DAIMultiplier).toString());
            await (0, chai_1.expect)(pkktVault.connect(alice).initiateWithdraw(0, ethers_1.BigNumber.from(4).mul(USDTMultiplier))).to.be.revertedWith("Exceeds available");
            await (0, chai_1.expect)(pkktVault.connect(alice).initiateWithdraw(1, ethers_1.BigNumber.from(3).mul(USDCMultiplier))).to.be.revertedWith("Exceeds available");
            await (0, chai_1.expect)(pkktVault.connect(alice).initiateWithdraw(2, ethers_1.BigNumber.from(1).mul(DAIMultiplier))).to.be.revertedWith("Exceeds available");
            await pkktVault.connect(alice).cancelWithdraw(0, ethers_1.BigNumber.from(1).mul(USDTMultiplier));
            await pkktVault.connect(alice).cancelWithdraw(1, ethers_1.BigNumber.from(1).mul(USDCMultiplier));
            await pkktVault.connect(alice).cancelWithdraw(2, ethers_1.BigNumber.from(1).mul(DAIMultiplier));
            usdtVault = await pkktVault.userInfo(0, alice.address);
            usdcVault = await pkktVault.userInfo(1, alice.address);
            daiVault = await pkktVault.userInfo(2, alice.address);
            chai_1.assert.equal(usdtVault.requestingAmount.toString(), ethers_1.BigNumber.from(6).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdcVault.requestingAmount.toString(), ethers_1.BigNumber.from(2).mul(USDCMultiplier).toString());
            chai_1.assert.equal(daiVault.requestingAmount.toString(), ethers_1.BigNumber.from(1).mul(DAIMultiplier).toString());
            await pkktVault.connect(alice).deposit(0, ethers_1.BigNumber.from(1).mul(USDTMultiplier));
            await pkktVault.connect(alice).deposit(1, ethers_1.BigNumber.from(2).mul(USDCMultiplier));
            await pkktVault.connect(alice).deposit(2, ethers_1.BigNumber.from(3).mul(DAIMultiplier));
            usdtVault = await pkktVault.userInfo(0, alice.address);
            usdcVault = await pkktVault.userInfo(1, alice.address);
            daiVault = await pkktVault.userInfo(2, alice.address);
            chai_1.assert.equal(usdtVault.pendingAmount.toString(), ethers_1.BigNumber.from(1).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdcVault.pendingAmount.toString(), ethers_1.BigNumber.from(2).mul(USDCMultiplier).toString());
            chai_1.assert.equal(daiVault.pendingAmount.toString(), ethers_1.BigNumber.from(3).mul(DAIMultiplier).toString());
            await pkktVault.connect(trader).initiateSettlement("100", trader.address);
            settelled = await pkktVault.isSettelled();
            chai_1.assert.isFalse(settelled);
            var usdtDiff = await pkktVault.settlementResult(0);
            var usdcDiff = await pkktVault.settlementResult(1);
            var daiDiff = await pkktVault.settlementResult(2);
            chai_1.assert.equal(usdtDiff.toString(), ethers_1.BigNumber.from(-5).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdcDiff.toString(), "0");
            chai_1.assert.equal(daiDiff.toString(), ethers_1.BigNumber.from(2).mul(DAIMultiplier).toString());
            trader1 = await usdt.balanceOf(trader.address);
            trader2 = await usdc.balanceOf(trader.address);
            trader3 = await dai.balanceOf(trader.address);
            chai_1.assert.equal(trader1.toString(), ethers_1.BigNumber.from(10).mul(USDTMultiplier).toString());
            chai_1.assert.equal(trader2.toString(), ethers_1.BigNumber.from(5).mul(USDCMultiplier).toString());
            chai_1.assert.equal(trader3.toString(), ethers_1.BigNumber.from(4).mul(DAIMultiplier).toString());
            await (0, chai_1.expect)(pkktVault.connect(trader).finishSettlement()).to.be.revertedWith("Matured amount not fullfilled");
            usdtVault = await pkktVault.userInfo(0, alice.address);
            usdcVault = await pkktVault.userInfo(1, alice.address);
            daiVault = await pkktVault.userInfo(2, alice.address);
            chai_1.assert.equal(usdtVault.maturedAmount.toString(), ethers_1.BigNumber.from(6).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdcVault.maturedAmount.toString(), ethers_1.BigNumber.from(2).mul(USDCMultiplier).toString());
            chai_1.assert.equal(daiVault.maturedAmount.toString(), ethers_1.BigNumber.from(1).mul(DAIMultiplier).toString());
            chai_1.assert.equal(usdtVault.requestingAmount.toString(), "0");
            chai_1.assert.equal(usdcVault.requestingAmount.toString(), "0");
            chai_1.assert.equal(daiVault.requestingAmount.toString(), "0");
            await usdt.connect(trader).transfer(pkktVault.address, ethers_1.BigNumber.from(5).mul(USDTMultiplier).toString());
            await pkktVault.connect(trader).finishSettlement();
            await (0, chai_1.expect)(pkktVault.connect(trader).finishSettlement()).to.be.revertedWith("Settlement already finished");
            var aliceUsdt = await usdt.balanceOf(alice.address);
            await pkktVault.connect(alice).completeWithdraw(0, ethers_1.BigNumber.from(5).mul(USDTMultiplier));
            await pkktVault.connect(alice).redeposit(0, ethers_1.BigNumber.from(1).mul(USDTMultiplier));
            var aliceUsdtNew = await usdt.balanceOf(alice.address);
            chai_1.assert.equal(aliceUsdtNew.sub(aliceUsdt).toString(), ethers_1.BigNumber.from(5).mul(USDTMultiplier).toString());
            usdtVault = await pkktVault.userInfo(0, alice.address);
            chai_1.assert.equal(usdtVault.pendingAmount.toString(), ethers_1.BigNumber.from(1).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdtVault.ongoingAmount.toString(), ethers_1.BigNumber.from(5).mul(USDTMultiplier).toString());
            chai_1.assert.equal(usdtVault.maturedAmount.toString(), "0");
            chai_1.assert.equal(usdtVault.requestingAmount.toString(), "0");
            var aliceUsdc = await usdc.balanceOf(alice.address);
            await pkktVault.connect(alice).maxCompleteWithdraw(1);
            var aliceUsdcNew = await usdc.balanceOf(alice.address);
            chai_1.assert.equal(aliceUsdcNew.sub(aliceUsdc).toString(), ethers_1.BigNumber.from(2).mul(USDCMultiplier).toString());
            usdcVault = await pkktVault.userInfo(1, alice.address);
            chai_1.assert.equal(usdcVault.pendingAmount.toString(), "0");
            chai_1.assert.equal(usdcVault.ongoingAmount.toString(), ethers_1.BigNumber.from(5).mul(USDCMultiplier).toString());
            chai_1.assert.equal(usdcVault.maturedAmount.toString(), "0");
            chai_1.assert.equal(usdcVault.requestingAmount.toString(), "0");
            var aliceDai = await dai.balanceOf(alice.address);
            await pkktVault.connect(alice).maxRedeposit(2);
            var aliceDaiNew = await dai.balanceOf(alice.address);
            chai_1.assert.equal(aliceDaiNew.sub(aliceDai).toString(), "0");
            usdcVault = await pkktVault.userInfo(2, alice.address);
            chai_1.assert.equal(usdcVault.pendingAmount.toString(), ethers_1.BigNumber.from(1).mul(DAIMultiplier).toString());
            chai_1.assert.equal(usdcVault.ongoingAmount.toString(), ethers_1.BigNumber.from(4).mul(DAIMultiplier).toString());
            chai_1.assert.equal(usdcVault.maturedAmount.toString(), "0");
            chai_1.assert.equal(usdcVault.requestingAmount.toString(), "0");
        });
        it("should allow harvest pkkt reward", async function () {
            pkktVault = await (0, deploy_1.deployContract)("PKKTVault", { signer: deployer, libraries: { Vault: vault.address } });
            pkktVault.initialize(pkktToken.address, "100", 13601000, trader.address);
            await pkktToken.addMinter(pkktVault.address, MAX);
            await pkktVault.addMany([
                { underlying: usdt.address, decimals: constants_1.USDT_DECIMALS },
                { underlying: usdc.address, decimals: constants_1.USDC_DECIMALS },
                { underlying: dai.address, decimals: constants_1.DAI_DECIMALS }
            ], true);
            await usdt.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            await pkktVault.connect(alice).deposit(0, ethers_1.BigNumber.from(10).mul(USDTMultiplier));
            await usdc.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDCMultiplier));
            await pkktVault.connect(alice).deposit(1, ethers_1.BigNumber.from(5).mul(USDCMultiplier));
            await dai.connect(alice).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(DAIMultiplier));
            await pkktVault.connect(alice).deposit(2, ethers_1.BigNumber.from(2).mul(DAIMultiplier));
            await usdt.connect(bob).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDTMultiplier));
            await pkktVault.connect(bob).deposit(0, ethers_1.BigNumber.from(20).mul(USDTMultiplier));
            await usdc.connect(bob).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(USDCMultiplier));
            await pkktVault.connect(bob).deposit(1, ethers_1.BigNumber.from(10).mul(USDCMultiplier));
            await dai.connect(bob).approve(pkktVault.address, ethers_1.BigNumber.from(100).mul(DAIMultiplier));
            await pkktVault.connect(bob).deposit(2, ethers_1.BigNumber.from(4).mul(DAIMultiplier));
            await (0, timer_1.advanceBlockTo)(13601199);
            //settlement at 13601200, the reward will be calculated 
            await pkktVault.connect(trader).initiateSettlement("200", trader.address);
            await (0, timer_1.advanceBlockTo)(13601299);
            //settlement at 13601300, the reward will be calculated 
            await pkktVault.connect(trader).initiateSettlement("100", trader.address);
            var alicePkkt = (await pkktVault.pendingPKKT(0, alice.address)).
                add(await pkktVault.pendingPKKT(1, alice.address)).
                add(await pkktVault.pendingPKKT(2, alice.address));
            //we lose some precision, 6666.666 should be better
            chai_1.assert.equal(alicePkkt.toString(), "6665");
            var bobPkkt = (await pkktVault.pendingPKKT(0, bob.address)).
                add(await pkktVault.pendingPKKT(1, bob.address)).
                add(await pkktVault.pendingPKKT(2, bob.address));
            //we lose some precision, 13333.333 should be better
            chai_1.assert.equal(bobPkkt.toString(), "13332");
            await pkktVault.connect(alice).deposit(0, ethers_1.BigNumber.from(10).mul(USDTMultiplier));
            await (0, timer_1.advanceBlockTo)(13601399);
            //settlement at 13601300, the reward will be calculated 
            await pkktVault.connect(trader).initiateSettlement("100", trader.address);
            //todo: fix overflow issue
            //6665 + 20/61*100*100
            var aliceReward = await pkktVault.connect(alice).harvestAllPools();
            //13332 + 41/61*100*100
            var bobReward = await pkktVault.connect(bob).harvestAllPools();
            console.log(`${aliceReward.toString()} ${bobReward.toString()}`);
        });
        it("should allow granting and revoking of trader role", async () => {
            pkktVault = await (0, deploy_1.deployContract)("PKKTVault", { signer: deployer, libraries: { Vault: vault.address } });
            pkktVault.initialize(pkktToken.address, "100", 13601000, trader.address);
            await (0, chai_1.expect)(pkktVault.initiateSettlement("100", trader.address)).to.be.reverted;
            await (0, chai_1.expect)(pkktVault.connect(alice).grantRole(hardhat_1.ethers.utils.formatBytes32String("TRADER_ROLE"), alice.address)).to.be.reverted;
            chai_1.assert.isNotTrue(await pkktVault.hasRole(hardhat_1.ethers.utils.formatBytes32String("TRADER_ROLE"), alice.address), "Non-admin granted trader role");
            await (0, chai_1.expect)(pkktVault.initiateSettlement("100", trader.address)).to.be.reverted;
            await pkktVault.revokeRole(hardhat_1.ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address);
            chai_1.assert.isNotTrue(await pkktVault.hasRole(hardhat_1.ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address), "Trader role was not revoked.");
            await (0, chai_1.expect)(pkktVault.initiateSettlement("100", trader.address)).to.be.reverted;
            await pkktVault.grantRole(hardhat_1.ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address);
            chai_1.assert.isTrue(await pkktVault.hasRole(hardhat_1.ethers.utils.formatBytes32String("TRADER_ROLE"), trader.address), "Trader role was not granted");
            await pkktVault.connect(trader).initiateSettlement("100", trader.address);
        });
        it("should only allow the trader and owner to set PKKT per block", async () => {
            pkktVault = await (0, deploy_1.deployContract)("PKKTVault", { signer: deployer, libraries: { Vault: vault.address } });
            pkktVault.initialize(pkktToken.address, "100", 13601000, trader.address);
            await (0, chai_1.expect)(pkktVault.connect(alice).setPKKTPerBlock("200")).to.be.revertedWith("Only the owner or trader can set PKKT per block.");
            await pkktVault.setPKKTPerBlock("200");
            (0, chai_1.assert)(await pkktVault.pkktPerBlock(), "200");
            await pkktVault.connect(trader).setPKKTPerBlock("100");
            (0, chai_1.assert)(await pkktVault.pkktPerBlock, "100");
        });
    });
});
