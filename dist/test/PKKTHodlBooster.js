"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const ethers_1 = require("ethers");
const deploy_1 = require("./utilities/deploy");
const optionPair_1 = require("./utilities/optionPair");
const constants_1 = require("../constants/constants");
const console_table_printer_1 = require("console-table-printer");
const CAP = ethers_1.BigNumber.from(1000).mul(constants_1.WEI);
const MAX = ethers_1.BigNumber.from(500).mul(constants_1.WEI);
const USDTMultiplier = ethers_1.BigNumber.from(10).pow(constants_1.USDT_DECIMALS);
const ETHMultiplier = ethers_1.BigNumber.from(10).pow(constants_1.ETH_DECIMALS);
const WBTCMultiplier = ethers_1.BigNumber.from(10).pow(constants_1.WBTC_DECIMALS);
const PricePrecision = 4;
const RatioMultipler = 10000; //precision xx.xx% 
const ETHUSDTOPTION = 0;
const WBTCUSDTOPTION = 1;
const StrikePriceDecimals = 4;
const ethPrice = 4000 * (10 ** PricePrecision);
const btcPrice = 50000 * (10 ** PricePrecision);
describe.only("PKKT Hodl Booster", async function () {
    let deployer;
    let settler;
    let alice;
    let bob;
    let carol;
    let trader;
    let usdt;
    let wbtc;
    let vault;
    let optionPairs;
    let optionSettings;
    let names;
    before(async function () {
        [deployer, settler, alice, bob, carol, trader] = await hardhat_1.ethers.getSigners();
    });
    context("operations", function () {
        beforeEach(async function () {
            this.owner = deployer;
            const optionLifecycle = await (0, deploy_1.deployContract)("OptionLifecycle", deployer);
            usdt = await (0, deploy_1.deployContract)("ERC20Mock", deployer, [
                "USDTToken",
                "USDT",
                ethers_1.BigNumber.from(100000000).mul(USDTMultiplier),
                constants_1.USDT_DECIMALS
            ]);
            wbtc = await (0, deploy_1.deployContract)("ERC20Mock", deployer, [
                "Wrapped BTC",
                "WBTC",
                ethers_1.BigNumber.from(1000).mul(WBTCMultiplier),
                constants_1.WBTC_DECIMALS
            ]);
            names = {};
            names[usdt.address] = "usdt";
            names[constants_1.NULL_ADDRESS] = "eth";
            names[wbtc.address] = "wbtc";
            vault = await (0, deploy_1.deployContract)("PKKTHodlBoosterOption", {
                signer: deployer,
                libraries: {
                    OptionLifecycle: optionLifecycle.address,
                }
            }, [settler.address, [
                    {
                        depositAssetAmountDecimals: constants_1.ETH_DECIMALS,
                        counterPartyAssetAmountDecimals: constants_1.USDT_DECIMALS,
                        depositAsset: constants_1.NULL_ADDRESS,
                        counterPartyAsset: usdt.address,
                        callOptionId: 0,
                        putOptionId: 0
                    },
                    {
                        depositAssetAmountDecimals: constants_1.WBTC_DECIMALS,
                        counterPartyAssetAmountDecimals: constants_1.USDT_DECIMALS,
                        depositAsset: wbtc.address,
                        counterPartyAsset: usdt.address,
                        callOptionId: 0,
                        putOptionId: 0
                    }
                ]]);
            optionSettings = [];
            var ethOption = await vault.optionPairs(0);
            var wbtcOption = await vault.optionPairs(1);
            optionPairs = [ethOption, wbtcOption];
            optionSettings.push({
                name: "ETH-USDT-CALL",
                optionId: ethOption.callOptionId,
                depositAsset: ethOption.depositAsset,
                counterPartyAsset: ethOption.counterPartyAsset,
                depositAssetAmountDecimals: ethOption.depositAssetAmountDecimals,
                counterPartyAssetAmountDecimals: ethOption.counterPartyAssetAmountDecimals
            });
            optionSettings.push({
                name: "ETH-USDT-PUT",
                optionId: ethOption.putOptionId,
                depositAsset: ethOption.counterPartyAsset,
                counterPartyAsset: ethOption.depositAsset,
                depositAssetAmountDecimals: ethOption.counterPartyAssetAmountDecimals,
                counterPartyAssetAmountDecimals: ethOption.depositAssetAmountDecimals
            });
            optionSettings.push({
                name: "WBTC-USDT-CALL",
                optionId: wbtcOption.callOptionId,
                depositAsset: wbtcOption.depositAsset,
                counterPartyAsset: wbtcOption.counterPartyAsset,
                depositAssetAmountDecimals: wbtcOption.depositAssetAmountDecimals,
                counterPartyAssetAmountDecimals: wbtcOption.counterPartyAssetAmountDecimals
            });
            optionSettings.push({
                name: "WBTC-USDT-PUT",
                optionId: wbtcOption.putOptionId,
                depositAsset: wbtcOption.counterPartyAsset,
                counterPartyAsset: wbtcOption.depositAsset,
                depositAssetAmountDecimals: wbtcOption.counterPartyAssetAmountDecimals,
                counterPartyAssetAmountDecimals: wbtcOption.depositAssetAmountDecimals
            });
            await usdt.transfer(alice.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
            await usdt.transfer(bob.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
            await usdt.transfer(carol.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
            await usdt.transfer(trader.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
            await wbtc.transfer(alice.address, ethers_1.BigNumber.from(100).mul(WBTCMultiplier));
            await wbtc.transfer(bob.address, ethers_1.BigNumber.from(100).mul(WBTCMultiplier));
            await wbtc.transfer(carol.address, ethers_1.BigNumber.from(100).mul(WBTCMultiplier));
            await wbtc.connect(alice).approve(vault.address, ethers_1.BigNumber.from(100).mul(WBTCMultiplier));
            await wbtc.connect(bob).approve(vault.address, ethers_1.BigNumber.from(100).mul(WBTCMultiplier));
            await wbtc.connect(carol).approve(vault.address, ethers_1.BigNumber.from(100).mul(WBTCMultiplier));
            await usdt.connect(alice).approve(vault.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
            await usdt.connect(bob).approve(vault.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
            await usdt.connect(carol).approve(vault.address, ethers_1.BigNumber.from(10000000).mul(USDTMultiplier));
        });
        afterEach(async function () {
        });
        it("turn on and off deposits", async () => {
            await vault.connect(settler).initiateSettlement();
            // user can deposit
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(5).mul(ETHMultiplier) });
            await vault.connect(alice).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(1000).mul(constants_1.USDC_MULTIPLIER));
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(2).mul(WBTCMultiplier));
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(1000).mul(constants_1.USDC_MULTIPLIER));
            var ethOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            chai_1.assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(5).mul(ETHMultiplier).toString());
            var usdcEthOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].putOptionId);
            chai_1.assert.equal(usdcEthOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(1000).mul(USDTMultiplier).toString());
            var wbtcOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(wbtcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(2).mul(WBTCMultiplier).toString());
            var usdcWbtcOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].putOptionId);
            chai_1.assert.equal(usdcWbtcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(1000).mul(USDTMultiplier).toString());
            // check that turning deposits off works
            await vault.connect(settler).switchOptionPair(0);
            await (0, chai_1.expect)(vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(5).mul(ETHMultiplier) })).to.be.revertedWith("cannot deposit eth or usdc");
            await (0, chai_1.expect)(vault.connect(alice).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(1000).mul(constants_1.USDC_MULTIPLIER))).to.be.revertedWith("cannot deposit eth or usdc");
            await vault.connect(settler).switchOptionPair(1);
            await (0, chai_1.expect)(vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(2).mul(WBTCMultiplier))).to.be.revertedWith("cannot deposit wbtc or usdc");
            await (0, chai_1.expect)(vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(1000).mul(constants_1.USDC_MULTIPLIER))).to.be.revertedWith("cannot deposit wbtc or usdc");
            // check that turning deposits back on works
            await vault.connect(settler).switchOptionPair(0);
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(5).mul(ETHMultiplier) });
            await vault.connect(alice).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(1000).mul(constants_1.USDC_MULTIPLIER));
            await vault.connect(settler).switchOptionPair(1);
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(2).mul(WBTCMultiplier));
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(1000).mul(constants_1.USDC_MULTIPLIER));
            var ethOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            chai_1.assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(10).mul(ETHMultiplier).toString());
            var usdcEthOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].putOptionId);
            chai_1.assert.equal(usdcEthOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(2000).mul(USDTMultiplier).toString());
            var wbtcOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(wbtcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(4).mul(WBTCMultiplier).toString());
            var usdcWbtcOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].putOptionId);
            chai_1.assert.equal(usdcWbtcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(2000).mul(USDTMultiplier).toString());
        });
        it("user perspective", async function () {
            //await expect(vault.connect(alice as Signer).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: BigNumber.from(5).mul(ETHMultiplier)})).to.be.revertedWith("!Started");   
            //await expect(vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  
            /* open round 1*/
            await vault.connect(settler).initiateSettlement();
            //5+4 eth
            //2+0.5 btc
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(5).mul(ETHMultiplier) });
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(2).mul(WBTCMultiplier));
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(4).mul(ETHMultiplier) });
            //await expect(ethHodlBoosterCall.connect(alice as Signer).depositETH({ value: BigNumber.from(2).mul(ETHMultiplier)})).to.be.revertedWith("Not enough quota"); 
            //await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota");  
            //await expect(vault.connect(alice as Signer).depositETH( optionPairs[WBTCUSDTOPTION].callOptionId, { value: BigNumber.from(1).mul(ETHMultiplier)})).to.be.revertedWith("!ETH");  
            await vault.connect(bob).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10));
            var ethOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            chai_1.assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(9).mul(ETHMultiplier).toString());
            chai_1.assert.equal(ethOptionBalance.lockedDepositAssetAmount.toString(), "0");
            var btcOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(2).mul(WBTCMultiplier).toString());
            chai_1.assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0");
            btcOptionBalance = await vault.connect(bob).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            chai_1.assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0");
            var round = await vault.currentRound();
            var optionState = await vault.getOptionStateByRound(optionPairs[ETHUSDTOPTION].callOptionId, round);
            chai_1.assert.equal(round.toString(), "1");
            chai_1.assert.equal(optionState.totalAmount.toString(), ethers_1.BigNumber.from(9).mul(ETHMultiplier).toString());
            chai_1.assert.equal(optionState.round.toString(), "1");
            chai_1.assert.equal(optionState.premiumRate.toString(), "0");
            chai_1.assert.equal(optionState.executed, false);
            chai_1.assert.equal(optionState.strikePrice.toString(), "0");
            round = await vault.currentRound();
            optionState = await vault.getOptionStateByRound(optionPairs[WBTCUSDTOPTION].callOptionId, round);
            chai_1.assert.equal(round.toString(), "1");
            chai_1.assert.equal(optionState.totalAmount.toString(), ethers_1.BigNumber.from(25).mul(WBTCMultiplier).div(10).toString());
            chai_1.assert.equal(optionState.round.toString(), "1");
            chai_1.assert.equal(optionState.premiumRate.toString(), "0");
            chai_1.assert.equal(optionState.executed, false);
            chai_1.assert.equal(optionState.strikePrice.toString(), "0");
            var ethBalance = await hardhat_1.ethers.provider.getBalance(alice.address);
            //redeem all eth
            var tx = await (await vault.connect(alice).withdraw(optionPairs[ETHUSDTOPTION].callOptionId, ethers_1.BigNumber.from(8).mul(ETHMultiplier), constants_1.NULL_ADDRESS)).wait();
            var gasPrice = (await hardhat_1.ethers.provider.getTransaction(tx.transactionHash)).gasPrice;
            var tx2 = await (await vault.connect(alice).withdraw(optionPairs[ETHUSDTOPTION].callOptionId, ethers_1.BigNumber.from(1).mul(ETHMultiplier), constants_1.NULL_ADDRESS)).wait();
            var gasPrice2 = (await hardhat_1.ethers.provider.getTransaction(tx2.transactionHash)).gasPrice;
            //await expect(ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).to.be.reverted;  
            var ethBalance2 = await hardhat_1.ethers.provider.getBalance(alice.address);
            var diff = (ethBalance2.add(tx.gasUsed.mul(gasPrice !== null && gasPrice !== void 0 ? gasPrice : 0)).add(tx2.gasUsed.mul(gasPrice2 !== null && gasPrice2 !== void 0 ? gasPrice2 : 0)).sub(ethBalance));
            chai_1.assert.isTrue(diff.sub(ethers_1.BigNumber.from(9).mul(ETHMultiplier)).abs().lte(constants_1.GWEI));
            ethOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            chai_1.assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), "0");
            var optionState = await vault.getOptionStateByRound(optionPairs[ETHUSDTOPTION].callOptionId, round);
            chai_1.assert.equal(optionState.totalAmount.toString(), "0");
            var btcBalance = await wbtc.connect(alice).balanceOf(alice.address);
            await vault.connect(alice).withdraw(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(15).mul(WBTCMultiplier).div(10), wbtc.address);
            var btcBalance2 = await wbtc.connect(alice).balanceOf(alice.address);
            chai_1.assert.equal(btcBalance2.sub(btcBalance).toString(), ethers_1.BigNumber.from(15).mul(WBTCMultiplier).div(10).toString());
            var btcBalance = await wbtc.connect(bob).balanceOf(bob.address);
            await vault.connect(bob).withdraw(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10), wbtc.address);
            btcBalance2 = await wbtc.connect(bob).balanceOf(bob.address);
            chai_1.assert.equal(btcBalance2.sub(btcBalance).toString(), ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            btcOptionBalance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            optionState = await vault.getOptionStateByRound(optionPairs[WBTCUSDTOPTION].callOptionId, round);
            chai_1.assert.equal(optionState.totalAmount.toString(), ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            /* open round 2*/
            await vault.connect(settler).initiateSettlement();
            //new round , alice deposit 5eth
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(5).mul(ETHMultiplier) });
            //bob deposit 1 btc
            await vault.connect(bob).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(1).mul(WBTCMultiplier));
            var balance = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount);
            //bob stop auto rolling of round 1, will be able to complete withdraw after the settlement next round
            await vault.connect(alice).initiateWithraw(optionPairs[WBTCUSDTOPTION].callOptionId, diff);
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice, 0.025 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice, 0.025 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice, 0.025 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice, 0.025 * RatioMultipler),
            ]);
            //have 0.5wbtc going on
            var wbtcResult = await vault.connect(settler).settlementCashflowResult(wbtc.address);
            chai_1.assert.equal(wbtcResult.newReleasedAmount.toString(), "0");
            chai_1.assert.equal(wbtcResult.newDepositAmount.toString(), ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            chai_1.assert.equal(wbtcResult.leftOverAmount.toString(), "0");
            var ethResult = await vault.connect(settler).settlementCashflowResult(constants_1.NULL_ADDRESS);
            chai_1.assert.equal(ethResult.leftOverAmount.toString(), "0");
            chai_1.assert.equal(ethResult.newDepositAmount.toString(), "0");
            chai_1.assert.equal(ethResult.newReleasedAmount.toString(), "0");
            var usdtResult = await vault.connect(settler).settlementCashflowResult(usdt.address);
            chai_1.assert.equal(usdtResult.leftOverAmount.toString(), "0");
            /* open round 3*/
            await vault.connect(settler).initiateSettlement();
            await vault.connect(settler).settle([constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution]);
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice, 0.02 * RatioMultipler)
            ]);
            //0.5 not moved last time + 1 newly deposit - 0.5 released - 2.5%*0.5 released premium
            wbtcResult = await vault.connect(settler).settlementCashflowResult(wbtc.address);
            chai_1.assert.equal(wbtcResult.leftOverAmount.toString(), ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            chai_1.assert.equal(wbtcResult.newDepositAmount.toString(), ethers_1.BigNumber.from(1).mul(WBTCMultiplier).toString());
            chai_1.assert.equal(wbtcResult.newReleasedAmount.toString(), ethers_1.BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            btcBalance = await wbtc.connect(trader).balanceOf(trader.address);
            await vault.connect(settler).withdrawAsset(trader.address, wbtc.address);
            btcBalance2 = await wbtc.connect(trader).balanceOf(trader.address);
            chai_1.assert.equal(btcBalance2.sub(btcBalance).toString(), ethers_1.BigNumber.from(9875).mul(WBTCMultiplier).div(10000).toString());
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(1).mul(WBTCMultiplier));
            var available = await vault.connect(alice).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(available.pendingDepositAssetAmount.toString(), ethers_1.BigNumber.from(1).mul(WBTCMultiplier).toString());
            //0.5 * 1.025
            chai_1.assert.equal(available.releasedDepositAssetAmount.toString(), ethers_1.BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            chai_1.assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
            btcBalance = await wbtc.connect(alice).balanceOf(alice.address);
            await vault.connect(alice).withdraw(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(15125).mul(WBTCMultiplier).div(10000), wbtc.address);
            btcBalance2 = await wbtc.connect(alice).balanceOf(alice.address);
            chai_1.assert.equal(btcBalance2.sub(btcBalance).toString(), ethers_1.BigNumber.from(15125).mul(WBTCMultiplier).div(10000).toString());
            //bob want to stop the whole auto roll
            await vault.connect(bob).initiateWithraw(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(1).mul(WBTCMultiplier));
            //later on he changes his mind to allow part of it 
            await vault.connect(bob).cancelWithdraw(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(5).mul(WBTCMultiplier).div(10));
            //alice want to stop part of  the auto roll (3 auto roll + 2 release)
            await vault.connect(alice).initiateWithraw(optionPairs[ETHUSDTOPTION].callOptionId, ethers_1.BigNumber.from(2).mul(ETHMultiplier));
            /* open round 4*/
            await vault.connect(settler).initiateSettlement();
            await vault.connect(settler).settle([
                constants_1.OptionExecution.ExecuteCall, constants_1.OptionExecution.NoExecution
            ]);
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice, 0.02 * RatioMultipler),
            ]);
            //alice got the 2*4000*1.02 executed usdc
            available = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            chai_1.assert.equal(available.releasedCounterPartyAssetAmount.toString(), "8160000000");
            chai_1.assert.equal(available.releasedDepositAssetAmount.toString(), "0");
            //bob got 0.5*1.02 none executed btc
            var available2 = await vault.connect(bob).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            chai_1.assert.equal(available2.releasedCounterPartyAssetAmount.toString(), "0");
            chai_1.assert.equal(available2.releasedDepositAssetAmount.toString(), "51000000");
            var usdtInstruction = await vault.settlementCashflowResult(usdt.address);
            var diff = usdtInstruction.leftOverAmount.add(usdtInstruction.newDepositAmount).sub(usdtInstruction.newReleasedAmount);
            if (diff.lt(0)) {
                await usdt.connect(trader).transfer(vault.address, -diff);
            }
            var usdtBalance = await usdt.connect(alice).balanceOf(alice.address);
            await vault.connect(alice).withdraw(optionPairs[ETHUSDTOPTION].callOptionId, available.releasedCounterPartyAssetAmount, usdt.address);
            var usdtBalance2 = await usdt.connect(alice).balanceOf(alice.address);
            chai_1.assert.equal(usdtBalance2.sub(usdtBalance).toString(), available.releasedCounterPartyAssetAmount.toString());
            available = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            chai_1.assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
            chai_1.assert.equal(available.releasedDepositAssetAmount.toString(), "0");
        });
        it("trader perspective", async function () {
            /* open round 1*/
            await vault.connect(settler).initiateSettlement();
            console.log(`Open Round ${await vault.currentRound()}`);
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(5).mul(ETHMultiplier) });
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(2).mul(WBTCMultiplier));
            await vault.connect(carol).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(1).mul(WBTCMultiplier));
            await vault.connect(bob).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(4000).mul(USDTMultiplier));
            await vault.connect(carol).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(2000).mul(USDTMultiplier));
            await vault.connect(bob).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(50000).mul(USDTMultiplier));
            await renderTVL(false);
            /* open round 2*/
            await vault.connect(settler).initiateSettlement();
            console.log(`Open Round ${await vault.currentRound()}`);
            await vault.connect(bob).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(1).mul(ETHMultiplier) });
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(100000).mul(USDTMultiplier));
            await vault.connect(carol).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(50000).mul(USDTMultiplier));
            await renderTVL(false);
            await renderCashFlow(constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution);
            const ethPrice = 4000 * (10 ** PricePrecision);
            const btcPrice = 50000 * (10 ** PricePrecision);
            //set the strikeprice and premium of user deposits collected in round 1
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice * 1.05, 0.025 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice * 0.95, 0.025 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 1.05, 0.025 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 0.95, 0.025 * RatioMultipler)
            ]);
            /* open round 3*/
            await vault.connect(settler).initiateSettlement();
            console.log(`Open Round ${await vault.currentRound()}`);
            //var ethHodlBoosterCallToTerminate = (await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
            var balance = await vault.connect(alice).getAccountBalance(optionPairs[ETHUSDTOPTION].callOptionId);
            await vault.connect(alice).initiateWithraw(optionPairs[ETHUSDTOPTION].callOptionId, balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount)); //5.125 eth with premium
            //var ethHodlBoosterCallToTerminate2 = (await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
            //var wbtcHodlBoosterPutToTerminate = (await wbtcHodlBoosterPut.connect(bob as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
            var balance2 = await vault.connect(bob).getAccountBalance(optionPairs[WBTCUSDTOPTION].putOptionId);
            await vault.connect(bob).initiateWithraw(optionPairs[WBTCUSDTOPTION].putOptionId, balance2.lockedDepositAssetAmount.sub(balance2.toTerminateDepositAssetAmount)); //51250.0 usdt with premium 
            //var wbtcHodlBoosterPutToTerminate2 = (await wbtcHodlBoosterPut.connect(bob as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
            //var wbtcHodlBoosterCallTerminate = (await wbtcHodlBoosterCall.connect(carol as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
            var balance3 = await vault.connect(carol).getAccountBalance(optionPairs[WBTCUSDTOPTION].callOptionId);
            await vault.connect(carol).initiateWithraw(optionPairs[WBTCUSDTOPTION].callOptionId, balance3.lockedDepositAssetAmount.sub(balance3.toTerminateDepositAssetAmount)); //1.025 wbtc with premium
            //var wbtcHodlBoosterCallTerminate2 = (await wbtcHodlBoosterCall.connect(carol as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
            await renderTVL(true);
            await renderExecutionPlans();
            await vault.connect(settler).settle([constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution]);
            var result = await renderCashFlow(constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution);
            var ethBalance = await hardhat_1.ethers.provider.getBalance(trader.address);
            await vault.connect(settler).withdrawAsset(trader.address, constants_1.NULL_ADDRESS);
            var ethBalance2 = await hardhat_1.ethers.provider.getBalance(trader.address);
            chai_1.assert.equal(ethBalance2.sub(ethBalance).toString(), result[0].assetBalance.toString());
            var wbtcBalance = await wbtc.connect(trader).balanceOf(trader.address);
            await vault.connect(settler).withdrawAsset(trader.address, wbtc.address);
            var wbtcBalance2 = await wbtc.connect(trader).balanceOf(trader.address);
            chai_1.assert.equal(wbtcBalance2.sub(wbtcBalance).toString(), result[1].assetBalance.toString());
            var usdtBalance = await usdt.connect(trader).balanceOf(trader.address);
            await vault.connect(settler).withdrawAsset(trader.address, usdt.address);
            var usdtBalance2 = await usdt.connect(trader).balanceOf(trader.address);
            chai_1.assert.equal(usdtBalance2.sub(usdtBalance).toString(), result[2].assetBalance.toString());
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice * 1.04, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice * 0.96, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 1.04, 0.02 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 0.96, 0.02 * RatioMultipler)
            ]);
            await renderTVL(false);
            /* open round 4*/
            await vault.connect(settler).initiateSettlement();
            console.log(`Open Round ${await vault.currentRound()}`);
            await renderTVL(true);
            await renderExecutionPlans();
            await vault.connect(settler).settle([constants_1.OptionExecution.ExecuteCall, constants_1.OptionExecution.NoExecution]);
            var result2 = await renderCashFlow(constants_1.OptionExecution.ExecuteCall, constants_1.OptionExecution.NoExecution);
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice * 1.03, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice * 0.97, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 1.03, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 0.97, 0.01 * RatioMultipler)
            ]);
            var ethEnough = await vault.balanceEnough(constants_1.NULL_ADDRESS);
            chai_1.assert.equal(ethEnough, result2[0].assetBalance.gte(0));
            var btcEnough = await vault.balanceEnough(wbtc.address);
            chai_1.assert.equal(btcEnough, result2[1].assetBalance.gte(0));
            var usdtEnough = await vault.balanceEnough(usdt.address);
            chai_1.assert.equal(usdtEnough, result2[2].assetBalance.gte(0));
            if (!ethEnough) {
                await trader.sendTransaction({
                    to: vault.address,
                    value: -result2[0].assetBalance,
                });
                console.log(`Sent ${hardhat_1.ethers.utils.formatUnits(-result2[0].assetBalance, constants_1.ETH_DECIMALS)} eth`);
            }
            if (!btcEnough) {
                await wbtc.connect(trader).transfer(vault.address, -result2[1].assetBalance);
                console.log(`Sent ${hardhat_1.ethers.utils.formatUnits(-result2[1].assetBalance, constants_1.WBTC_DECIMALS)} wbtc`);
            }
            if (!usdtEnough) {
                await usdt.connect(trader).transfer(vault.address, -result2[2].assetBalance);
                console.log(`Sent ${hardhat_1.ethers.utils.formatUnits(-result2[2].assetBalance, constants_1.USDT_DECIMALS)} usdt`);
            }
            ethEnough = await vault.balanceEnough(constants_1.NULL_ADDRESS);
            btcEnough = await vault.balanceEnough(wbtc.address);
            usdtEnough = await vault.balanceEnough(usdt.address);
            chai_1.assert.isTrue(ethEnough);
            chai_1.assert.isTrue(btcEnough);
            chai_1.assert.isTrue(usdtEnough);
            await renderTVL(false);
            //withdraw
            var accounts = [{ name: "alice", account: alice },
                { name: "bob", account: bob },
                { name: "carol", account: carol }];
            for (var i = 0; i < optionSettings.length; i++) {
                var option = optionSettings[i];
                for (var j = 0; j < accounts.length; j++) {
                    var account = accounts[j];
                    var accountBalance = await vault.connect(account.account).getAccountBalance(option.optionId);
                    if (accountBalance.releasedDepositAssetAmount.gt(0)) {
                        await vault.connect(account.account).withdraw(option.optionId, accountBalance.releasedDepositAssetAmount, option.depositAsset);
                        console.log(`${account.name} withdrawn ${hardhat_1.ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, option.depositAssetAmountDecimals)} ${names[option.depositAsset]}`);
                    }
                    if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) {
                        await vault.connect(account.account).withdraw(option.optionId, accountBalance.releasedCounterPartyAssetAmount, option.counterPartyAsset);
                        console.log(`${account.name} withdrawn ${hardhat_1.ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount, option.counterPartyAssetAmountDecimals)} ${names[option.counterPartyAsset]}`);
                    }
                }
            }
            /* open round 5*/
            await vault.connect(settler).initiateSettlement();
            console.log(`Open Round ${await vault.currentRound()}`);
            await vault.connect(settler).settle([constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution]);
            await renderCashFlow(constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution);
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice * 1.03, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice * 0.97, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 1.03, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 0.97, 0.01 * RatioMultipler)
            ]);
            await vault.connect(alice).depositETH(optionPairs[ETHUSDTOPTION].callOptionId, { value: ethers_1.BigNumber.from(20).mul(ETHMultiplier) });
            await vault.connect(alice).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(5).mul(WBTCMultiplier));
            await vault.connect(carol).deposit(optionPairs[WBTCUSDTOPTION].callOptionId, ethers_1.BigNumber.from(10).mul(WBTCMultiplier));
            await vault.connect(bob).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(40000).mul(USDTMultiplier));
            await vault.connect(carol).deposit(optionPairs[ETHUSDTOPTION].putOptionId, ethers_1.BigNumber.from(20000).mul(USDTMultiplier));
            await vault.connect(bob).deposit(optionPairs[WBTCUSDTOPTION].putOptionId, ethers_1.BigNumber.from(50000).mul(USDTMultiplier));
            /* open round 6*/
            await vault.connect(settler).initiateSettlement();
            console.log(`Open Round ${await vault.currentRound()}`);
            await vault.connect(settler).settle([constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution]);
            await renderCashFlow(constants_1.OptionExecution.NoExecution, constants_1.OptionExecution.NoExecution);
            await vault.connect(settler).setOptionParameters([
                (0, optionPair_1.packOptionParameter)(ethPrice * 1.03, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(ethPrice * 0.97, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 1.03, 0.01 * RatioMultipler),
                (0, optionPair_1.packOptionParameter)(btcPrice * 0.97, 0.01 * RatioMultipler)
            ]);
            let assets;
            let beforeBalances;
            let movables;
            assets = [];
            beforeBalances = [];
            movables = [];
            var wbtcResult = await vault.connect(settler).settlementCashflowResult(wbtc.address);
            var diff = wbtcResult.leftOverAmount.add(wbtcResult.newDepositAmount).sub(wbtcResult.newReleasedAmount);
            if (diff.gt(0)) {
                assets.push(wbtc.address);
                beforeBalances.push(await wbtc.balanceOf(trader.address));
                movables.push(diff);
            }
            var ethResult = await vault.connect(settler).settlementCashflowResult(constants_1.NULL_ADDRESS);
            var diff2 = ethResult.leftOverAmount.add(ethResult.newDepositAmount).sub(ethResult.newReleasedAmount);
            if (diff2.gt(0)) {
                assets.push(constants_1.NULL_ADDRESS);
                beforeBalances.push(await trader.getBalance());
                movables.push(diff2);
            }
            var usdtResult = await vault.connect(settler).settlementCashflowResult(usdt.address);
            var diff3 = usdtResult.leftOverAmount.add(usdtResult.newDepositAmount).sub(usdtResult.newReleasedAmount);
            if (diff3.gt(0)) {
                assets.push(usdt.address);
                beforeBalances.push(await usdt.balanceOf(trader.address));
                movables.push(diff3);
            }
            if (assets.length > 0) {
                await vault.connect(settler).batchWithdrawAssets(trader.address, assets);
                for (var i = 0; i < assets.length; i++) {
                    var asset = assets[i];
                    console.log("withdraw assets for ", names[asset]);
                    var newBalance = asset == constants_1.NULL_ADDRESS ?
                        await trader.getBalance() :
                        (asset == usdt.address ?
                            await usdt.balanceOf(trader.address) :
                            await wbtc.balanceOf(trader.address));
                    var diff = newBalance.sub(beforeBalances[i]);
                    chai_1.assert.equal(diff.toString(), movables[i].toString());
                }
            }
        });
        it("hacker perspective", async function () {
            await (0, chai_1.expect)(vault.connect(alice).initiateSettlement()).to.be.revertedWith("!settler");
            await (0, chai_1.expect)(vault.connect(alice).setOptionParameters([])).to.be.revertedWith("!settler");
            await (0, chai_1.expect)(vault.connect(alice).settle([])).to.be.revertedWith("!settler");
            await (0, chai_1.expect)(vault.connect(alice).withdrawAsset(alice.address, usdt.address)).to.be.revertedWith("!settler");
            await (0, chai_1.expect)(vault.connect(alice).batchWithdrawAssets(alice.address, [usdt.address])).to.be.revertedWith("!settler");
            await (0, chai_1.expect)(vault.connect(bob).setSettler(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await (0, chai_1.expect)(vault.connect(settler).setSettler(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await (0, chai_1.expect)(vault.connect(settler).transferOwnership(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await vault.connect(deployer).transferOwnership(alice.address);
            await (0, chai_1.expect)(vault.connect(deployer).setSettler(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");
            await vault.connect(alice).setSettler(bob.address);
            await vault.connect(bob).initiateSettlement();
            await vault.connect(alice).transferOwnership(deployer.address);
            await vault.connect(deployer).setSettler(settler.address);
            await (0, chai_1.expect)(vault.connect(bob).initiateSettlement()).to.be.revertedWith("!settler");
        });
    });
    //can be useful for user perspective code
    async function renderTVL(underSettlement) {
        console.log(`================================ TVL(${underSettlement ? "Settling" : "Settled"}) ================================`);
        var p = new console_table_printer_1.Table();
        for (var i = 0; i < optionSettings.length; i++) {
            var option = optionSettings[i];
            var assetDecimals = option.depositAssetAmountDecimals;
            var counterPartyDecimals = option.counterPartyAssetAmountDecimals;
            var optionTVL = await vault.getOptionSnapShot(option.optionId);
            var assetEnough = await vault.balanceEnough(option.depositAsset);
            var counterPartyEnough = await vault.balanceEnough(option.counterPartyAsset);
            var accountBalances = [{ account: "alice", ...await vault.connect(alice).getAccountBalance(option.optionId) },
                { account: "bob", ...await vault.connect(bob).getAccountBalance(option.optionId) },
                { account: "carol", ...await vault.connect(carol).getAccountBalance(option.optionId) }];
            var assetSuffix = optionTVL.totalReleasedDeposit.gt(0) ? (assetEnough ? "（available)" : "(missing)") : "";
            var counterPartySuffix = optionTVL.totalReleasedCounterParty.gt(0) ? (counterPartyEnough ? "（available)" : "(missing)") : "";
            p.addRow({ Name: option.name, Locked: hardhat_1.ethers.utils.formatUnits(optionTVL.totalLocked, assetDecimals),
                Pending: hardhat_1.ethers.utils.formatUnits(optionTVL.totalPending, assetDecimals),
                Terminating: hardhat_1.ethers.utils.formatUnits(optionTVL.totalTerminating, assetDecimals),
                'To Terminate': hardhat_1.ethers.utils.formatUnits(optionTVL.totalToTerminate, assetDecimals),
                Released: `${hardhat_1.ethers.utils.formatUnits(optionTVL.totalReleasedDeposit, assetDecimals)}${assetSuffix}`,
                'Released-CounterParty': `${hardhat_1.ethers.utils.formatUnits(optionTVL.totalReleasedCounterParty, counterPartyDecimals)}${counterPartySuffix}` });
            var totalLocked = ethers_1.BigNumber.from(0);
            var totalReleased = ethers_1.BigNumber.from(0);
            var totalReleasedCounterParty = ethers_1.BigNumber.from(0);
            var totalPending = ethers_1.BigNumber.from(0);
            var totalTerminating = ethers_1.BigNumber.from(0);
            var totalToTerminate = ethers_1.BigNumber.from(0);
            for (var j = 0; j < accountBalances.length; j++) {
                var accountBalance = accountBalances[j];
                p.addRow({ Name: accountBalance.account, Locked: hardhat_1.ethers.utils.formatUnits(accountBalance.lockedDepositAssetAmount, assetDecimals),
                    Pending: hardhat_1.ethers.utils.formatUnits(accountBalance.pendingDepositAssetAmount, assetDecimals),
                    Terminating: hardhat_1.ethers.utils.formatUnits(accountBalance.terminatingDepositAssetAmount, assetDecimals),
                    'To Terminate': hardhat_1.ethers.utils.formatUnits(accountBalance.toTerminateDepositAssetAmount, assetDecimals),
                    Released: `${hardhat_1.ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, assetDecimals)}${assetSuffix}`,
                    'Released-CounterParty': `${hardhat_1.ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount, counterPartyDecimals)}${counterPartySuffix}` });
                totalLocked = totalLocked.add(accountBalance.lockedDepositAssetAmount);
                totalReleased = totalReleased.add(accountBalance.releasedDepositAssetAmount);
                totalReleasedCounterParty = totalReleasedCounterParty.add(accountBalance.releasedCounterPartyAssetAmount);
                totalPending = totalPending.add(accountBalance.pendingDepositAssetAmount);
                totalTerminating = totalTerminating.add(accountBalance.terminatingDepositAssetAmount);
                totalToTerminate = totalToTerminate.add(accountBalance.toTerminateDepositAssetAmount);
                chai_1.assert.isTrue(accountBalance.toTerminateDepositAssetAmount.lte(accountBalance.lockedDepositAssetAmount));
            }
            chai_1.assert.equal(optionTVL.totalLocked.toString(), totalLocked.toString());
            chai_1.assert.equal(optionTVL.totalPending.toString(), totalPending.toString());
            chai_1.assert.equal(optionTVL.totalReleasedDeposit.toString(), totalReleased.toString());
            chai_1.assert.equal(optionTVL.totalReleasedCounterParty.toString(), totalReleasedCounterParty.toString());
            chai_1.assert.equal(optionTVL.totalTerminating.toString(), totalTerminating.toString());
            chai_1.assert.equal(optionTVL.totalToTerminate.toString(), totalToTerminate.toString());
            chai_1.assert.isTrue(optionTVL.totalToTerminate.lte(optionTVL.totalLocked));
        }
        p.printTable();
    }
    //can be useful for trader perspective code
    async function renderExecutionPlans() {
        console.log("================================ Decision for exercise ================================");
        var p = new console_table_printer_1.Table();
        await renderExecutionPlan(0, p);
        await renderExecutionPlan(1, p);
        await renderExecutionPlan(2, p);
        p.printTable();
        p = new console_table_printer_1.Table();
        await renderExecutionPlan(3, p);
        await renderExecutionPlan(4, p);
        await renderExecutionPlan(5, p);
        p.printTable();
    }
    async function renderCashFlow(decision1, decision2) {
        console.log(`================================ Actual movement of money(${decision1},${decision2}) ================================`);
        const p = new console_table_printer_1.Table();
        //print
        //console.log("Token|Epoch deposit|actual withdraw request|residue(+)/deficit(-)|movable(+)/required(-)"); 
        var result = [await renderCashFlowForAsset("ETH", constants_1.NULL_ADDRESS, constants_1.ETH_DECIMALS, p),
            await renderCashFlowForAsset("WBTC", wbtc.address, constants_1.WBTC_DECIMALS, p),
            await renderCashFlowForAsset("USDT", usdt.address, constants_1.USDT_DECIMALS, p)];
        p.printTable();
        return result;
    }
    async function renderCashFlowForAsset(assetName, assetAddress, decimals, p) {
        var assetCashFlow = await vault.connect(settler).settlementCashflowResult(assetAddress);
        var assetBalance = (assetCashFlow.leftOverAmount.add(assetCashFlow.newDepositAmount).
            sub(assetCashFlow.newReleasedAmount));
        p.addRow({ Token: assetName, 'Epoch deposit': hardhat_1.ethers.utils.formatUnits(assetCashFlow.newDepositAmount, decimals),
            'Actual withdraw request': hardhat_1.ethers.utils.formatUnits(assetCashFlow.newReleasedAmount, decimals),
            'residue(+)/deficit(-)': hardhat_1.ethers.utils.formatUnits(assetCashFlow.leftOverAmount, decimals),
            'movable(+)/required(-)': hardhat_1.ethers.utils.formatUnits(assetBalance, decimals) });
        return { assetAddress, assetBalance };
    }
    async function renderExecutionPlan(index, p) {
        var accounting = await vault.connect(settler).executionAccountingResult(index);
        var currentRound = await vault.currentRound();
        const pairId = Math.floor(index / 3);
        var pair = optionPairs[pairId];
        if (!pair) {
            return;
        }
        var newDepositAssetAmount = hardhat_1.ethers.utils.formatUnits(accounting.callOptionResult.depositAmount, pair.depositAssetAmountDecimals);
        var newCounterPartyAssetAmount = hardhat_1.ethers.utils.formatUnits(accounting.putOptionResult.depositAmount, pair.counterPartyAssetAmountDecimals);
        var maturedCallOptionState = await vault.getOptionStateByRound(pair.callOptionId, currentRound - 2);
        var maturedPutOptionState = await vault.getOptionStateByRound(pair.putOptionId, currentRound - 2);
        var callStrikePrice = hardhat_1.ethers.utils.formatUnits(maturedCallOptionState.strikePrice, StrikePriceDecimals);
        var putStrikePrice = hardhat_1.ethers.utils.formatUnits(maturedPutOptionState.strikePrice, StrikePriceDecimals);
        var callAssetAutoRoll = accounting.callOptionResult.autoRollAmount.add(accounting.callOptionResult.autoRollPremium)
            .add(accounting.putOptionResult.autoRollCounterPartyAmount).add(accounting.putOptionResult.autoRollCounterPartyPremium);
        var putAssetAutoRull = accounting.callOptionResult.autoRollCounterPartyAmount.add(accounting.callOptionResult.autoRollCounterPartyPremium)
            .add(accounting.putOptionResult.autoRollAmount).add(accounting.putOptionResult.autoRollPremium);
        var callAssetReleased = accounting.callOptionResult.releasedAmount.add(accounting.callOptionResult.releasedPremium)
            .add(accounting.putOptionResult.releasedCounterPartyAmount).add(accounting.putOptionResult.releasedCounterPartyPremium);
        var putAssetReleased = accounting.callOptionResult.releasedCounterPartyAmount.add(accounting.callOptionResult.releasedCounterPartyPremium)
            .add(accounting.putOptionResult.releasedAmount).add(accounting.putOptionResult.releasedPremium);
        var depositDebt = hardhat_1.ethers.utils.formatUnits(accounting.callOptionResult.depositAmount.add(callAssetAutoRoll), pair.depositAssetAmountDecimals);
        var depositAutoRoll = hardhat_1.ethers.utils.formatUnits(callAssetAutoRoll, pair.depositAssetAmountDecimals);
        var counterPartyDebt = hardhat_1.ethers.utils.formatUnits(accounting.putOptionResult.depositAmount.add(putAssetAutoRull), pair.counterPartyAssetAmountDecimals);
        var counterPartyAutoRoll = hardhat_1.ethers.utils.formatUnits(putAssetAutoRull, pair.counterPartyAssetAmountDecimals);
        var callAssetReleasedStr = hardhat_1.ethers.utils.formatUnits(callAssetReleased, pair.depositAssetAmountDecimals);
        var putAssetReleasedStr = hardhat_1.ethers.utils.formatUnits(putAssetReleased, pair.counterPartyAssetAmountDecimals);
        var decision = "";
        if (accounting.execute == constants_1.OptionExecution.NoExecution) {
            decision = "No Exe";
        }
        else if (accounting.execute == constants_1.OptionExecution.ExecuteCall) {
            decision = "Exe Call";
        }
        else {
            decision = "Exe Put";
        }
        var option = {};
        option['Option'] = `${names[pair.depositAsset]}<>${names[pair.counterPartyAsset]}`;
        option['Decision'] = decision;
        option[`${names[pair.depositAsset]}-debt`] = depositDebt;
        option[`${names[pair.counterPartyAsset]}-debt`] = counterPartyDebt;
        option[`${names[pair.depositAsset]}-autoroll`] = depositAutoRoll;
        option[`${names[pair.counterPartyAsset]}-autoroll`] = counterPartyAutoRoll;
        option[`${names[pair.depositAsset]} withdrawal`] = callAssetReleasedStr;
        option[`${names[pair.counterPartyAsset]} withdrawal`] = putAssetReleasedStr;
        option[`${names[pair.depositAsset]} Deposit`] = newDepositAssetAmount;
        option[`${names[pair.counterPartyAsset]} Deposit`] = newCounterPartyAssetAmount;
        option['call str/put str'] = `${callStrikePrice}/${putStrikePrice}`;
        p.addRow(option);
    }
});
