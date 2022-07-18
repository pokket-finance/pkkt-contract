import { assert, expect } from "chai";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { deployContract,deployUpgradeableContract } from "./utilities/deploy";
import { OptionPair, OptionSetting, packOptionParameter } from "./utilities/optionPair";
import { HodlBoosterOption, ERC20Mock, HodlBoosterOptionUpgradeable, HodlBoosterOptionUpgradeableV2 } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {  GWEI, BUSD_DECIMALS, ETH_DECIMALS, WBTC_DECIMALS, OptionExecution, BUSD_MULTIPLIER } from "../constants/constants";
import { Table } from 'console-table-printer';
import { Contract, ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";   
   
const BUSDMultiplier = BigNumber.from(10).pow(BUSD_DECIMALS);
const ETHMultiplier = BigNumber.from(10).pow(ETH_DECIMALS);
const WBTCMultiplier = BigNumber.from(10).pow(WBTC_DECIMALS);
const PricePrecision = 4;
const RatioMultipler = 10000; //precision xx.xx%
const ETHBUSDOPTIONPAIR = 0;
const WBTCBUSDOPTIONPAIR = 1;
const StrikePriceDecimals = 4;

const ethPrice = 4000 * (10 ** PricePrecision);
const btcPrice = 50000 * (10 ** PricePrecision);

describe.only("BSC Hodl Booster", async function () {
    let deployer: SignerWithAddress;
    let owner: SignerWithAddress;
    let vaultAdmin: SignerWithAddress;
    let vaultManager: SignerWithAddress;
    let admin: SignerWithAddress;
    let alice: SignerWithAddress;
    let bob: SignerWithAddress;
    let carol: SignerWithAddress;
    let trader: SignerWithAddress;
    let eth: ERC20Mock;
    let busd: ERC20Mock;
    let wbtc: ERC20Mock;
    let vault: HodlBoosterOption;
    let optionPairs: OptionPair[];
    let optionSettings: OptionSetting[];
    let names: {};
    let optionLifecycleAddress: string;

    before(async function () {
      [deployer, owner, vaultAdmin, vaultManager, admin, alice, bob, carol, trader] = await ethers.getSigners();
    });

    context("operations", function () {
        beforeEach(async function () {
          this.owner = deployer as Signer;
          const optionLifecycle = await deployContract("OptionLifecycle", deployer as Signer);
          eth  = await deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "PeggedETH",
              "ETH",
              BigNumber.from(10000).mul(ETHMultiplier),
              ETH_DECIMALS
            ]
          ) as ERC20Mock;
          busd = await deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "Binance Pegged BUSD",
              "BUSD",
              BigNumber.from(100000000).mul(BUSDMultiplier),
              BUSD_DECIMALS
            ]
          ) as ERC20Mock;
          wbtc = await deployContract(
            "ERC20Mock",
            deployer as Signer,
            [
              "Wrapped BTC",
              "WBTC",
              BigNumber.from(1000).mul(WBTCMultiplier),
              WBTC_DECIMALS
            ]
          ) as ERC20Mock;

          names = {};
          names[busd.address] = "busd";
          names[eth.address] = "eth";
          names[wbtc.address] = "wbtc";
          const vaultLogic = await deployContract(
            "HodlBoosterOptionUpgradeable",
            {
              signer: deployer as Signer,
              libraries: {
                OptionLifecycle: optionLifecycle.address,
              }
            }) as HodlBoosterOption;

          const initArgs = [
            owner.address,
            vaultAdmin.address,
            vaultManager.address, [
            {
              depositAssetAmountDecimals: ETH_DECIMALS,
              counterPartyAssetAmountDecimals: BUSD_DECIMALS,
              depositAsset: eth.address,
              counterPartyAsset: busd.address,
              callOptionId: 0,
              putOptionId: 0
            }, {
              depositAssetAmountDecimals: WBTC_DECIMALS,
              counterPartyAssetAmountDecimals: BUSD_DECIMALS,
              depositAsset: wbtc.address,
              counterPartyAsset: busd.address,
              callOptionId: 0,
              putOptionId: 0
            }
          ]
        ];
        optionLifecycleAddress = optionLifecycle.address;
        const optionVault = await ethers.getContractFactory("HodlBoosterOptionUpgradeable", {
          libraries: {
            OptionLifecycle: optionLifecycleAddress,
          },
        }) as ContractFactory;

        vault = await deployUpgradeableContract(optionVault, initArgs) as HodlBoosterOption;
          optionSettings = [];
          const ethOption = await vault.optionPairs(0);
          const wbtcOption = await vault.optionPairs(1);
          optionPairs = [ethOption, wbtcOption];
          optionSettings.push({
             name: "ETH-BUSD-CALL",
             optionId: ethOption.callOptionId,
             depositAsset: ethOption.depositAsset,
             counterPartyAsset: ethOption.counterPartyAsset,
             depositAssetAmountDecimals: ethOption.depositAssetAmountDecimals,
             counterPartyAssetAmountDecimals: ethOption.counterPartyAssetAmountDecimals
          });
          optionSettings.push({
            name: "ETH-BUSD-PUT",
             optionId: ethOption.putOptionId,
             depositAsset: ethOption.counterPartyAsset,
             counterPartyAsset: ethOption.depositAsset,
             depositAssetAmountDecimals: ethOption.counterPartyAssetAmountDecimals,
             counterPartyAssetAmountDecimals: ethOption.depositAssetAmountDecimals
          });

          optionSettings.push({
            name: "WBTC-BUSD-CALL",
            optionId: wbtcOption.callOptionId,
            depositAsset: wbtcOption.depositAsset,
            counterPartyAsset: wbtcOption.counterPartyAsset,
            depositAssetAmountDecimals: wbtcOption.depositAssetAmountDecimals,
            counterPartyAssetAmountDecimals: wbtcOption.counterPartyAssetAmountDecimals
         });

         optionSettings.push({
          name: "WBTC-BUSD-PUT",
          optionId: wbtcOption.putOptionId,
          depositAsset: wbtcOption.counterPartyAsset,
          counterPartyAsset: wbtcOption.depositAsset,
          depositAssetAmountDecimals: wbtcOption.counterPartyAssetAmountDecimals,
          counterPartyAssetAmountDecimals: wbtcOption.depositAssetAmountDecimals
       });

       
          await eth.transfer(alice.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.transfer(bob.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.transfer(carol.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.transfer(trader.address, BigNumber.from(1000).mul(ETHMultiplier));

          await busd.transfer(alice.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.transfer(bob.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.transfer(carol.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.transfer(trader.address, BigNumber.from(10000000).mul(BUSDMultiplier));

          await wbtc.transfer(alice.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.transfer(bob.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.transfer(carol.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(alice as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(bob as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));
          await wbtc.connect(carol as Signer).approve(vault.address, BigNumber.from(100).mul(WBTCMultiplier));

          await busd.connect(alice as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(bob as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));
          await busd.connect(carol as Signer).approve(vault.address, BigNumber.from(10000000).mul(BUSDMultiplier));

          
          await eth.connect(alice as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.connect(bob as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier));
          await eth.connect(carol as Signer).approve(vault.address, BigNumber.from(1000).mul(ETHMultiplier)); 

        });

        afterEach(async function () {
        });

        it("turn on and off deposits", async () => {
          await vault.connect(vaultAdmin as Signer).initiateSettlement();

          // user can deposit
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER));

          var ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId);
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(ETHMultiplier).toString());
          var busdEthOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].putOptionId);
          assert.equal(busdEthOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString());

          var wbtcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          assert.equal(wbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          var busdWbtcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId);
          assert.equal(busdWbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString());



          // check that turning deposits off works
          await vault.connect(vaultAdmin as Signer).toggleOptionPairDeposit(ETHBUSDOPTIONPAIR);
          await expect(vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier))).to.be.revertedWith("DepositDisabled");
          await expect(vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER))).to.be.revertedWith("DepositDisabled");

          await vault.connect(vaultAdmin as Signer).toggleOptionPairDeposit(WBTCBUSDOPTIONPAIR);
          await expect(vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(WBTCMultiplier))).to.be.revertedWith("DepositDisabled");
          await expect(vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER))).to.be.revertedWith("DepositDisabled");

          // check that turning deposits back on works
          await vault.connect(vaultAdmin as Signer).toggleOptionPairDeposit(ETHBUSDOPTIONPAIR);
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER));

          await vault.connect(vaultAdmin as Signer).toggleOptionPairDeposit(1);
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER));

          var ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId);
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(10).mul(ETHMultiplier).toString());
          var busdEthOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].putOptionId);
          assert.equal(busdEthOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2000).mul(BUSDMultiplier).toString());

          var wbtcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          assert.equal(wbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(4).mul(WBTCMultiplier).toString());
          var busdWbtcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId);
          assert.equal(busdWbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2000).mul(BUSDMultiplier).toString());

        });

        it("user perspective", async function () { 
          //await expect(vault.connect(alice as Signer).deposit(optionPairs[ETHUSDTOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier))).to.be.revertedWith("!Started");   
          //await expect(vault.connect(alice as Signer).deposit(optionPairs[WBTCUSDTOPTIONPAIR].callOptionId, BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("!Started");  

          /* open round 1*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement(); 

          //5+4 eth
          //2+0.5 btc
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));

          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(4).mul(ETHMultiplier));
          //await expect(ethHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(2).mul(ETHMultiplier))).to.be.revertedWith("Not enough quota");
          //await expect(wbtcHodlBoosterCall.connect(alice as Signer).deposit(BigNumber.from(1).mul(WBTCMultiplier))).to.be.revertedWith("Not enough quota"); 
          //await expect(vault.connect(alice as Signer).deposit( optionPairs[WBTCUSDTOPTIONPAIR].callOptionId, BigNumber.from(1).mul(ETHMultiplier))).to.be.revertedWith("!ETH");  

          await vault.connect(bob as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(WBTCMultiplier).div(10));

          var ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId);
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          assert.equal(ethOptionBalance.lockedDepositAssetAmount.toString(), "0"); 
          
          var btcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0"); 

          btcOptionBalance = await vault.connect(bob as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          assert.equal(btcOptionBalance.lockedDepositAssetAmount.toString(), "0");  

          var round = await vault.currentRound();
          var optionState = await vault.getOptionStateByRound(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, round);

          assert.equal(round.toString(), "1"); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(9).mul(ETHMultiplier).toString());
          assert.equal(optionState.round.toString(), "1"); 
          assert.equal(optionState.premiumRate.toString(), "0");
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");

          round = await vault.currentRound();
          optionState = await vault.getOptionStateByRound(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, round);

          assert.equal(round.toString(), "1");
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(25).mul(WBTCMultiplier).div(10).toString());
          assert.equal(optionState.round.toString(), "1"); 
          assert.equal(optionState.premiumRate.toString(), "0");
          assert.equal(optionState.executed, false);
          assert.equal(optionState.strikePrice.toString(), "0");
          var ethBalance = await eth.connect(alice as Signer).balanceOf(alice.address); 
          //redeem all eth
          await vault.connect(alice as Signer).withdraw(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(8).mul(ETHMultiplier), eth.address);
          await vault.connect(alice as Signer).withdraw(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(1).mul(ETHMultiplier), eth.address); 

          //await expect(ethHodlBoosterCall.connect(alice as Signer).redeem(BigNumber.from(1).mul(ETHMultiplier))).to.be.reverted;  
          var ethBalance2 = await eth.connect(alice as Signer).balanceOf(alice.address);    
          assert.equal(ethBalance2.sub(ethBalance).toString(), BigNumber.from(9).mul(ETHMultiplier).toString()); 
          ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId); 
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), "0");
          var optionState = await vault.getOptionStateByRound(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, round); 
          assert.equal(optionState.totalAmount.toString(), "0");
          var btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
          await vault.connect(alice as Signer).withdraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(15).mul(WBTCMultiplier).div(10), wbtc.address);
          var btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address); 
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15).mul(WBTCMultiplier).div(10).toString());
          var btcBalance = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          await vault.connect(bob as Signer).withdraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(WBTCMultiplier).div(10), wbtc.address);
          btcBalance2 = await wbtc.connect(bob as Signer).balanceOf(bob.address);
          assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          btcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          assert.equal(btcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          optionState = await vault.getOptionStateByRound(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, round); 
          assert.equal(optionState.totalAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());


          /* open round 2*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();
          //new round , alice deposit 5eth
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier));
          //bob deposit 1 btc
          await vault.connect(bob as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
          var balance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          var diff = balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount); 
          //bob stop auto rolling of round 1, will be able to complete withdraw after the settlement next round
          await vault.connect(alice as Signer).initiateWithraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, diff); 


          await vault.connect(vaultAdmin as Signer).setOptionParameters([
            packOptionParameter(ethPrice, 0.025 * RatioMultipler), 
            packOptionParameter(ethPrice, 0.025 * RatioMultipler), 
            packOptionParameter(btcPrice, 0.025 * RatioMultipler), 
            packOptionParameter(btcPrice, 0.025 * RatioMultipler),
          ]);

          //have 0.5wbtc going on
          var wbtcResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(wbtc.address);
          assert.equal(wbtcResult.newReleasedAmount.toString(), "0");
          assert.equal(wbtcResult.newDepositAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
          assert.equal(wbtcResult.leftOverAmount.toString(), "0");
          var ethResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(eth.address);
          assert.equal(ethResult.leftOverAmount.toString(), "0");
          assert.equal(ethResult.newDepositAmount.toString(), "0");
          assert.equal(ethResult.newReleasedAmount.toString(), "0");
          var busdResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(busd.address);
          assert.equal(busdResult.leftOverAmount.toString(), "0");

          
          /* open round 3*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();
          await vault.connect(vaultManager as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution]);
          await vault.connect(vaultAdmin as Signer).setOptionParameters([
            packOptionParameter(ethPrice, 0.02 * RatioMultipler),
            packOptionParameter(ethPrice, 0.02 * RatioMultipler),
            packOptionParameter(btcPrice, 0.02 * RatioMultipler),
            packOptionParameter(btcPrice, 0.02 * RatioMultipler)
          ]);
            //0.5 not moved last time + 1 newly deposit - 0.5 released - 2.5%*0.5 released premium
            wbtcResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(wbtc.address);
            assert.equal(wbtcResult.leftOverAmount.toString(), BigNumber.from(5).mul(WBTCMultiplier).div(10).toString());
            assert.equal(wbtcResult.newDepositAmount.toString(), BigNumber.from(1).mul(WBTCMultiplier).toString());
            assert.equal(wbtcResult.newReleasedAmount.toString(), BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            btcBalance = await wbtc.connect(trader as Signer).balanceOf(trader.address);
            await vault.connect(vaultManager as Signer).withdrawAsset(trader.address, wbtc.address);
            btcBalance2 = await wbtc.connect(trader as Signer).balanceOf(trader.address);
            assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(9875).mul(WBTCMultiplier).div(10000).toString());

            await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
            var available = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
            assert.equal(available.pendingDepositAssetAmount.toString(), BigNumber.from(1).mul(WBTCMultiplier).toString());
            //0.5 * 1.025
            assert.equal(available.releasedDepositAssetAmount.toString(), BigNumber.from(5125).mul(WBTCMultiplier).div(10000).toString());
            assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
            btcBalance = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            await vault.connect(alice as Signer).withdraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(15125).mul(WBTCMultiplier).div(10000), wbtc.address);
            btcBalance2 = await wbtc.connect(alice as Signer).balanceOf(alice.address);
            assert.equal(btcBalance2.sub(btcBalance).toString(), BigNumber.from(15125).mul(WBTCMultiplier).div(10000).toString());

            //bob want to stop the whole auto roll
            await vault.connect(bob as Signer).initiateWithraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
            //later on he changes his mind to allow part of it
            await vault.connect(bob as Signer).cancelWithdraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(WBTCMultiplier).div(10)); 
             //alice want to stop part of  the auto roll (3 auto roll + 2 release)
            await vault.connect(alice as Signer).initiateWithraw(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(ETHMultiplier));


            /* open round 4*/
            await vault.connect(vaultAdmin as Signer).initiateSettlement();
            await vault.connect(vaultManager as Signer).settle([
              OptionExecution.ExecuteCall, OptionExecution.NoExecution
            ]);
            await vault.connect(vaultAdmin as Signer).setOptionParameters([
              packOptionParameter(ethPrice, 0.02 * RatioMultipler),
              packOptionParameter(ethPrice, 0.02 * RatioMultipler),
              packOptionParameter(btcPrice, 0.02 * RatioMultipler),
              packOptionParameter(btcPrice, 0.02 * RatioMultipler),
              ]);

              //alice got the 2*4000*1.02 executed busd
              available = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId ); 
              assert.equal(available.releasedCounterPartyAssetAmount.toString(), (BigNumber.from(8160).mul(BUSDMultiplier)).toString());
              assert.equal(available.releasedDepositAssetAmount.toString(), "0");
              //bob got 0.5*1.02 none executed btc
              
              var available2 = await vault.connect(bob as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
              assert.equal(available2.releasedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available2.releasedDepositAssetAmount.toString(), "51000000");
              
              var busdInstruction = await vault.settlementCashflowResult(busd.address); 
              var diff = busdInstruction.leftOverAmount.add(busdInstruction.newDepositAmount).sub(busdInstruction.newReleasedAmount);
                
              if (diff.lt(0)){  
                  await busd.connect(trader as Signer).transfer(vault.address, BigNumber.from(0).sub(diff));  
              } 
              var busdBalance = await busd.connect(alice as Signer).balanceOf(alice.address); 
              await vault.connect(alice as Signer).withdraw(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, available.releasedCounterPartyAssetAmount, busd.address );
              var busdBalance2 = await busd.connect(alice as Signer).balanceOf(alice.address); 
              assert.equal(busdBalance2.sub(busdBalance).toString(), available.releasedCounterPartyAssetAmount.toString()); 
              available = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId );
              assert.equal(available.releasedCounterPartyAssetAmount.toString(), "0");
              assert.equal(available.releasedDepositAssetAmount.toString(), "0");  

        });

        it("trader perspective", async function () {

          /* open round 1*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();  
          console.log(`Open Round ${await vault.currentRound()}` ); 

          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier));

          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(1).mul(WBTCMultiplier));
          
          await vault.connect(bob as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(4000).mul(BUSDMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(2000).mul(BUSDMultiplier));
          
          await vault.connect(bob as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(50000).mul(BUSDMultiplier));

          await renderTVL(false);

          
          /* open round 2*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();
          console.log(`Open Round ${await vault.currentRound()}` ); 

          await vault.connect(bob as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId , BigNumber.from(1).mul(ETHMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(100000).mul(BUSDMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(50000).mul(BUSDMultiplier));

          
          await renderTVL(false); 
          await renderCashFlow(OptionExecution.NoExecution, OptionExecution.NoExecution); 

         const ethPrice = 4000 * (10**PricePrecision);
         const btcPrice = 50000 * (10**PricePrecision);
          //set the strikeprice and premium of user deposits collected in round 1
          await vault.connect(vaultAdmin as Signer).setOptionParameters([
            
            packOptionParameter(ethPrice*1.05, 0.025 * RatioMultipler), 
            packOptionParameter(ethPrice*0.95, 0.025 * RatioMultipler), 
            packOptionParameter(btcPrice*1.05, 0.025 * RatioMultipler), 
            packOptionParameter(btcPrice* 0.95, 0.025 * RatioMultipler)
          ]);
          /* open round 3*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          //var ethHodlBoosterCallToTerminate = (await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          var balance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId);
          await vault.connect(alice as Signer).initiateWithraw(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, 
            balance.lockedDepositAssetAmount.sub(balance.toTerminateDepositAssetAmount)); //5.125 eth with premium
          //var ethHodlBoosterCallToTerminate2 = (await ethHodlBoosterCall.connect(alice as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          
          //var wbtcHodlBoosterPutToTerminate = (await wbtcHodlBoosterPut.connect(bob as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          var balance2 = await vault.connect(bob as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId);
          await vault.connect(bob as Signer).initiateWithraw(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, 
            balance2.lockedDepositAssetAmount.sub(balance2.toTerminateDepositAssetAmount));  //51250.0 usdt with premium 
          //var wbtcHodlBoosterPutToTerminate2 = (await wbtcHodlBoosterPut.connect(bob as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          //var wbtcHodlBoosterCallTerminate = (await wbtcHodlBoosterCall.connect(carol as Signer).getAccountBalance()).toTerminateDepositAssetAmount;
          var balance3 = await vault.connect(carol as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          await vault.connect(carol as Signer).initiateWithraw(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, 
            balance3.lockedDepositAssetAmount.sub(balance3.toTerminateDepositAssetAmount)); //1.025 wbtc with premium
          //var wbtcHodlBoosterCallTerminate2 = (await wbtcHodlBoosterCall.connect(carol as Signer).getAccountBalance()).toTerminateDepositAssetAmount;

          await renderTVL(true);
          await renderExecutionPlans();

          await vault.connect(vaultManager as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution])

          
         var result = await renderCashFlow(OptionExecution.NoExecution,OptionExecution.NoExecution);

          var ethBalance = await eth.connect(trader.address).balanceOf(trader.address); 
          await vault.connect(vaultManager as Signer).withdrawAsset(trader.address, eth.address); 
          var ethBalance2 =  await eth.connect(trader.address).balanceOf(trader.address); 
          assert.equal(ethBalance2.sub(ethBalance).toString(), result[0].assetBalance.toString());
          var wbtcBalance = await wbtc.connect(trader as Signer).balanceOf(trader.address);
          await vault.connect(vaultManager as Signer).withdrawAsset(trader.address, wbtc.address); 
          var wbtcBalance2 = await wbtc.connect(trader as Signer).balanceOf(trader.address);
          assert.equal(wbtcBalance2.sub(wbtcBalance).toString(), result[1].assetBalance.toString());
          var busdBalance = await busd.connect(trader as Signer).balanceOf(trader.address);
          await vault.connect(vaultManager as Signer).withdrawAsset(trader.address, busd.address); 
          var busdBalance2 = await busd.connect(trader as Signer).balanceOf(trader.address);
          assert.equal(busdBalance2.sub(busdBalance).toString(), result[2].assetBalance.toString());


          await vault.connect(vaultAdmin as Signer).setOptionParameters([
            packOptionParameter(ethPrice*1.04, 0.02 * RatioMultipler), 
            packOptionParameter(ethPrice*0.96, 0.02 * RatioMultipler), 
            packOptionParameter(btcPrice*1.04, 0.02 * RatioMultipler), 
            packOptionParameter(btcPrice* 0.96, 0.02 * RatioMultipler)
            ]);

            await renderTVL(false);

            
          /* open round 4*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          await renderTVL(true);
          await renderExecutionPlans();

          await vault.connect(vaultManager as Signer).settle([OptionExecution.ExecuteCall, OptionExecution.NoExecution]);
          var result2 = await renderCashFlow(OptionExecution.ExecuteCall, OptionExecution.NoExecution);
          
          await vault.connect(vaultAdmin as Signer).setOptionParameters([

            packOptionParameter(ethPrice*1.03, 0.01 * RatioMultipler), 
            packOptionParameter(ethPrice*0.97, 0.01 * RatioMultipler), 
            packOptionParameter(btcPrice*1.03, 0.01 * RatioMultipler), 
            packOptionParameter(btcPrice* 0.97, 0.01 * RatioMultipler)
            ]); 
           var ethEnough = await vault.balanceEnough(eth.address);
           assert.equal(ethEnough, result2[0].assetBalance.gte(0));
           var btcEnough = await vault.balanceEnough(wbtc.address); 
           assert.equal(btcEnough, result2[1].assetBalance.gte(0));
           var busdEnough = await vault.balanceEnough(busd.address);
           assert.equal(busdEnough, result2[2].assetBalance.gte(0));

           if (!ethEnough) { 
              await trader.sendTransaction({
                to: vault.address,
                value: BigNumber.from(0).sub(result2[0].assetBalance), 
              });
              console.log(`Sent ${ethers.utils.formatUnits(BigNumber.from(0).sub(result2[0].assetBalance), ETH_DECIMALS)} eth`);
           }
           if (!btcEnough){
              
              await wbtc.connect(trader as Signer).transfer(vault.address, BigNumber.from(0).sub(result2[1].assetBalance));
              console.log(`Sent ${ethers.utils.formatUnits(BigNumber.from(0).sub(result2[1].assetBalance), WBTC_DECIMALS)} wbtc`);
           }

           if (!busdEnough){
            await busd.connect(trader as Signer).transfer(vault.address,BigNumber.from(0).sub(result2[2].assetBalance));
            console.log(`Sent ${ethers.utils.formatUnits(BigNumber.from(0).sub(result2[2].assetBalance), BUSD_DECIMALS)} busd`);
          }
          ethEnough = await vault.balanceEnough(eth.address);
          btcEnough = await vault.balanceEnough(wbtc.address);
          busdEnough = await vault.balanceEnough(busd.address);
          assert.isTrue(ethEnough);
          assert.isTrue(btcEnough);
          assert.isTrue(busdEnough);

          await renderTVL(false);
          //withdraw
          var accounts = [{name: "alice", account: alice}, 
           {name: "bob", account: bob}, 
           {name:"carol", account: carol}]
          for(var i = 0; i < optionSettings.length; i++) {
            var option = optionSettings[i];
            for(var j = 0; j < accounts.length; j++) {
              var account = accounts[j];
              var accountBalance = await vault.connect(account.account as Signer).getAccountBalance(option.optionId); 
              if (accountBalance.releasedDepositAssetAmount.gt(0)) { 
                await vault.connect(account.account as Signer).withdraw(option.optionId, accountBalance.releasedDepositAssetAmount, option.depositAsset);
                console.log(`${account.name} withdrawn ${ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, option.depositAssetAmountDecimals)} ${names[option.depositAsset]}`);
              }
              if (accountBalance.releasedCounterPartyAssetAmount.gt(0)) { 
                await vault.connect(account.account as Signer).withdraw(option.optionId, accountBalance.releasedCounterPartyAssetAmount,  option.counterPartyAsset);
                console.log(`${account.name} withdrawn ${ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount,  option.counterPartyAssetAmountDecimals)} ${names[ option.counterPartyAsset]}`);
              }
            }
          }


          /* open round 5*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          await vault.connect(vaultManager as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution]);
          await renderCashFlow(OptionExecution.NoExecution, OptionExecution.NoExecution);
          await vault.connect(vaultAdmin as Signer).setOptionParameters([

            packOptionParameter(ethPrice * 1.03, 0.01 * RatioMultipler), 
            packOptionParameter(ethPrice * 0.97, 0.01 * RatioMultipler), 
            packOptionParameter(btcPrice * 1.03, 0.01 * RatioMultipler), 
            packOptionParameter(btcPrice * 0.97, 0.01 * RatioMultipler)
            ]); 

          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(20).mul(ETHMultiplier));

          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(WBTCMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(10).mul(WBTCMultiplier));
          
          await vault.connect(bob as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(40000).mul(BUSDMultiplier));
          await vault.connect(carol as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(20000).mul(BUSDMultiplier));
          
          await vault.connect(bob as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(50000).mul(BUSDMultiplier));

          
          /* open round 6*/
          await vault.connect(vaultAdmin as Signer).initiateSettlement();   
          console.log(`Open Round ${await vault.currentRound()}` );
          await vault.connect(vaultManager as Signer).settle([OptionExecution.NoExecution, OptionExecution.NoExecution]);
          await renderCashFlow(OptionExecution.NoExecution, OptionExecution.NoExecution);
          await vault.connect(vaultAdmin as Signer).setOptionParameters([

            packOptionParameter(ethPrice*1.03, 0.01 * RatioMultipler), 
            packOptionParameter(ethPrice*0.97, 0.01 * RatioMultipler), 
            packOptionParameter(btcPrice*1.03, 0.01 * RatioMultipler), 
            packOptionParameter(btcPrice* 0.97, 0.01 * RatioMultipler)
            ]); 
 
          let assets: string[];
          let beforeBalances: BigNumber[];
          let movables: BigNumber[];
          assets = [];
          beforeBalances = [];
          movables = [];
          var wbtcResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(wbtc.address); 
          var diff = wbtcResult.leftOverAmount.add(wbtcResult.newDepositAmount).sub(wbtcResult.newReleasedAmount);
          if (diff.gt(0)){
            assets.push(wbtc.address);
            beforeBalances.push(await wbtc.balanceOf(trader.address));
            movables.push(diff);
          }
          var ethResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(eth.address); 
          var diff2 = ethResult.leftOverAmount.add(ethResult.newDepositAmount).sub(ethResult.newReleasedAmount);
          if (diff2.gt(0)){
            assets.push(eth.address);
            beforeBalances.push(await eth.balanceOf(trader.address));
            movables.push(diff2);
           
          }
          var busdResult = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(busd.address); 
          var diff3 = busdResult.leftOverAmount.add(busdResult.newDepositAmount).sub(busdResult.newReleasedAmount);
          if (diff3.gt(0)){
            assets.push(busd.address);
            beforeBalances.push(await busd.balanceOf(trader.address));
            movables.push(diff3);
          }
          if (assets.length > 0){ 
            await vault.connect(vaultManager as Signer).batchWithdrawAssets(trader.address, assets);
            for(var i = 0; i < assets.length; i++){
              var asset = assets[i];
              console.log("withdraw assets for ", names[asset]);
              var newBalance =  asset == busd.address ? 
              await busd.balanceOf(trader.address):
              (
                asset == wbtc.address ? 
                 await wbtc.balanceOf(trader.address) : 
                 await eth.balanceOf(trader.address)
              );

              var diff = newBalance.sub(beforeBalances[i]);
              assert.equal(diff.toString(), movables[i].toString());
                 
            }
          }
           
        });
        it("old upgrader perspecitve", async function () {
          await vault.connect(vaultAdmin as Signer).initiateSettlement();

          // user can deposit
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].callOptionId, BigNumber.from(5).mul(ETHMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[ETHBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId, BigNumber.from(2).mul(WBTCMultiplier));
          await vault.connect(alice as Signer).deposit(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId, BigNumber.from(1000).mul(BUSD_MULTIPLIER));

          var ethOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId);
          assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(ETHMultiplier).toString());
          var busdEthOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].putOptionId);
          assert.equal(busdEthOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString());

          var wbtcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
          assert.equal(wbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
          var busdWbtcOptionBalance = await vault.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId);
          assert.equal(busdWbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString());

          
          const proxyAddress = vault.address; 
          const optionVaultV2 = await ethers.getContractFactory("HodlBoosterOptionUpgradeableV2", {
            libraries: {
              OptionLifecycle: optionLifecycleAddress
            },
          }) as ContractFactory;
          console.log("Upgrading HodlBoosterOption");
          var v2 = await upgrades.upgradeProxy(proxyAddress, optionVaultV2, { 
            unsafeAllow: ['delegatecall'], 
            unsafeAllowLinkedLibraries: true, 
           }) as HodlBoosterOptionUpgradeableV2; 

           ethOptionBalance = await v2.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].callOptionId);
           assert.equal(ethOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(5).mul(ETHMultiplier).toString());
           busdEthOptionBalance = await v2.connect(alice as Signer).getAccountBalance(optionPairs[ETHBUSDOPTIONPAIR].putOptionId);
           assert.equal(busdEthOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString());
 
           wbtcOptionBalance = await v2.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].callOptionId);
           assert.equal(wbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(2).mul(WBTCMultiplier).toString());
           busdWbtcOptionBalance = await v2.connect(alice as Signer).getAccountBalance(optionPairs[WBTCBUSDOPTIONPAIR].putOptionId);
           assert.equal(busdWbtcOptionBalance.pendingDepositAssetAmount.toString(), BigNumber.from(1000).mul(BUSDMultiplier).toString());
          
            await v2.connect(vaultAdmin as Signer).addWhitelistAddress(alice.address, [wbtc.address, busd.address, eth.address], 
              [BigNumber.from(100).mul(WBTCMultiplier), BigNumber.from(100000).mul(BUSDMultiplier),
               BigNumber.from(1000).mul(ETHMultiplier)]);  

          console.log("HodlBoosterOption upgraded successfully");
        })

        it("new upgrader perspecitve", async function () {          
          const proxyAddress = vault.address;  
          await upgrades.admin.changeProxyAdmin(proxyAddress, admin.address);
          /*
          let optionVaultV2 = await ethers.getContractFactory("HodlBoosterOptionUpgradeableV2", { 
            libraries: {
              OptionLifecycle: optionLifecycleAddress
            },
          }) as ContractFactory; 
           await expect(function(){
            upgrades.upgradeProxy(proxyAddress, optionVaultV2, { 
              unsafeAllow: ['delegatecall'], 
              unsafeAllowLinkedLibraries: true, 
             })
           }).to.throw(); */
 
           let optionVaultV2 = await ethers.getContractFactory("HodlBoosterOptionUpgradeableV2", {
            signer: admin as Signer,
            libraries: {
              OptionLifecycle: optionLifecycleAddress
            },
          }) as ContractFactory;
          console.log("Upgrading HodlBoosterOption");
          let v2 = await upgrades.upgradeProxy(proxyAddress, optionVaultV2, { 
            unsafeAllow: ['delegatecall'], 
            unsafeAllowLinkedLibraries: true, 
           }) as HodlBoosterOptionUpgradeableV2; 

          console.log("New v2 implement proxy Address " + v2.address);
          await v2.connect(vaultAdmin as Signer).addWhitelistAddress(alice.address, [wbtc.address, busd.address, eth.address], 
            [BigNumber.from(100).mul(WBTCMultiplier), BigNumber.from(100000).mul(BUSDMultiplier),
             BigNumber.from(1000).mul(ETHMultiplier)]);  

        console.log("HodlBoosterOption upgraded successfully");
        })
        it("hacker perspective", async function () { 
          const admin = vault as  HodlBoosterOptionUpgradeable; 
          await expect(vault.connect(alice as Signer).initiateSettlement()).to.be.revertedWith("!admin");  
          await expect(vault.connect(alice as Signer).setOptionParameters([])).to.be.revertedWith("!admin");   
          await expect(vault.connect(alice as Signer).withdrawAsset(alice.address, busd.address)).to.be.revertedWith("!manager");  
          await expect(vault.connect(alice as Signer).batchWithdrawAssets(alice.address, [busd.address])).to.be.revertedWith("!manager");  
          await expect(admin.connect(bob as Signer).setAdmin(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");  
          await expect(admin.connect(vaultAdmin as Signer).setAdmin(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");  
          await expect(admin.connect(vaultAdmin as Signer).transferOwnership(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");  
          await expect(admin.connect(deployer as Signer).transferOwnership(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");  
          //console.log(await admin.owner());
          //console.log(await owner.getAddress());
          await admin.connect(owner as Signer).transferOwnership(alice.address);
          await expect(admin.connect(owner as Signer).setAdmin(alice.address)).to.be.revertedWith("Ownable: caller is not the owner");  
          await admin.connect(alice as Signer).setManager(bob.address); 
          await admin.connect(alice as Signer).setAdmin(carol.address);
          await expect(vault.connect(bob as Signer).initiateSettlement()).to.be.revertedWith("!admin");   
          await vault.connect(carol as Signer).initiateSettlement();
          await admin.connect(alice as Signer).transferOwnership(deployer.address);
          await admin.connect(deployer as Signer).setManager(vaultManager.address);
          await expect(vault.connect(vaultManager as Signer).initiateSettlement()).to.be.revertedWith("!admin");  

        });
      }); 
        

       
      //can be useful for user perspective code
      async function renderTVL(underSettlement: boolean) {
        
        console.log(`================================ TVL(${underSettlement? "Settling" : "Settled"}) ================================`);
        
        var p = new Table();  
        
        for(var i = 0; i < optionSettings.length; i++)
        {
          var option = optionSettings[i];  
          var assetDecimals = option.depositAssetAmountDecimals; 
          var counterPartyDecimals = option.counterPartyAssetAmountDecimals;
          var optionTVL = await vault.getOptionSnapShot(option.optionId);
          
          var assetEnough = await vault.balanceEnough(option.depositAsset);
          var counterPartyEnough = await vault.balanceEnough(option.counterPartyAsset);

          var accountBalances = [{account: "alice", ...await vault.connect(alice as Signer).getAccountBalance(option.optionId)},
          {account: "bob", ...await vault.connect(bob as Signer).getAccountBalance(option.optionId)},
          {account: "carol", ...await vault.connect(carol as Signer).getAccountBalance(option.optionId)}];
          var assetSuffix = optionTVL.totalReleasedDeposit.gt(0) ? (assetEnough ? "（available)" :"(missing)") : "";
          var counterPartySuffix = optionTVL.totalReleasedCounterParty.gt(0) ? (counterPartyEnough ? "（available)" :"(missing)") : "";
          p.addRow({Name:option.name, Locked:ethers.utils.formatUnits(optionTVL.totalLocked, assetDecimals), 
            Pending: ethers.utils.formatUnits(optionTVL.totalPending, assetDecimals), 
            Terminating: ethers.utils.formatUnits(optionTVL.totalTerminating, assetDecimals), 
            'To Terminate': ethers.utils.formatUnits(optionTVL.totalToTerminate, assetDecimals), 
            Released: `${ethers.utils.formatUnits(optionTVL.totalReleasedDeposit, assetDecimals)}${assetSuffix}`, 
            'Released-CounterParty': `${ethers.utils.formatUnits(optionTVL.totalReleasedCounterParty, counterPartyDecimals)}${counterPartySuffix}` });
          var totalLocked = BigNumber.from(0);
          var totalReleased = BigNumber.from(0);
          var totalReleasedCounterParty = BigNumber.from(0);
          var totalPending = BigNumber.from(0);
          var totalTerminating = BigNumber.from(0);
          var totalToTerminate = BigNumber.from(0);
          for(var j = 0 ; j < accountBalances.length; j++) {
            var accountBalance = accountBalances[j];
            p.addRow({Name:accountBalance.account, Locked:ethers.utils.formatUnits(accountBalance.lockedDepositAssetAmount, assetDecimals), 
              Pending: ethers.utils.formatUnits(accountBalance.pendingDepositAssetAmount, assetDecimals),  
              Terminating: ethers.utils.formatUnits(accountBalance.terminatingDepositAssetAmount, assetDecimals), 
              'To Terminate' : ethers.utils.formatUnits(accountBalance.toTerminateDepositAssetAmount, assetDecimals), 
              Released: `${ethers.utils.formatUnits(accountBalance.releasedDepositAssetAmount, assetDecimals)}${assetSuffix}`, 
              'Released-CounterParty': `${ethers.utils.formatUnits(accountBalance.releasedCounterPartyAssetAmount, counterPartyDecimals)}${counterPartySuffix}` });
              totalLocked = totalLocked.add(accountBalance.lockedDepositAssetAmount);
              totalReleased = totalReleased.add(accountBalance.releasedDepositAssetAmount);
              totalReleasedCounterParty = totalReleasedCounterParty.add(accountBalance.releasedCounterPartyAssetAmount);
              totalPending = totalPending.add(accountBalance.pendingDepositAssetAmount);
              totalTerminating = totalTerminating.add(accountBalance.terminatingDepositAssetAmount);
              totalToTerminate = totalToTerminate.add(accountBalance.toTerminateDepositAssetAmount);
              assert.isTrue(accountBalance.toTerminateDepositAssetAmount.lte(accountBalance.lockedDepositAssetAmount));
          } 
          assert.equal(optionTVL.totalLocked.toString(), totalLocked.toString()); 
          assert.equal(optionTVL.totalPending.toString(), totalPending.toString());
          assert.equal(optionTVL.totalReleasedDeposit.toString(), totalReleased.toString());
          assert.equal(optionTVL.totalReleasedCounterParty.toString(), totalReleasedCounterParty.toString());
          assert.equal(optionTVL.totalTerminating.toString(), totalTerminating.toString());
          assert.equal(optionTVL.totalToTerminate.toString(), totalToTerminate.toString());
          assert.isTrue(optionTVL.totalToTerminate.lte(optionTVL.totalLocked));
        }
         
        p.printTable();
      }
     

      //can be useful for trader perspective code
      async function renderExecutionPlans() { 
        console.log("================================ Decision for exercise ================================");
        var p = new Table();
        await renderExecutionPlan(0, p);
        await renderExecutionPlan(1, p);
        await renderExecutionPlan(2, p); 
        p.printTable();
        p = new Table();
        await renderExecutionPlan(3, p);
        await renderExecutionPlan(4, p);
        await renderExecutionPlan(5, p); 
        p.printTable();
      }
  
      
      async function renderCashFlow(decision1: OptionExecution, decision2: OptionExecution): Promise<{assetAddress: string; assetBalance: BigNumber}[]>{
        console.log(`================================ Actual movement of money(${decision1},${decision2}) ================================`);
        const p = new Table();
        //print
        //console.log("Token|Epoch deposit|actual withdraw request|residue(+)/deficit(-)|movable(+)/required(-)"); 
        
        var result = [await renderCashFlowForAsset("ETH", eth.address, ETH_DECIMALS, p),
        await renderCashFlowForAsset("WBTC", wbtc.address, WBTC_DECIMALS, p),
        await renderCashFlowForAsset("BUSD", busd.address, BUSD_DECIMALS, p)];
        
        p.printTable();
        return result;
      }

      async function renderCashFlowForAsset(assetName: string, assetAddress: string, decimals:BigNumberish, p: Table):Promise<{
        assetAddress: string;
        assetBalance: BigNumber}>{
        var assetCashFlow = await vault.connect(vaultAdmin as Signer).settlementCashflowResult(assetAddress);  
        var assetBalance = (assetCashFlow.leftOverAmount.add(assetCashFlow.newDepositAmount).
        sub(assetCashFlow.newReleasedAmount));
        p.addRow({ Token: assetName, 'Epoch deposit': ethers.utils.formatUnits(assetCashFlow.newDepositAmount, decimals),
         'Actual withdraw request': ethers.utils.formatUnits(assetCashFlow.newReleasedAmount, decimals),
         'residue(+)/deficit(-)': ethers.utils.formatUnits(assetCashFlow.leftOverAmount, decimals), 
        'movable(+)/required(-)': ethers.utils.formatUnits(assetBalance, decimals)}); 
        return  {assetAddress, assetBalance} ;
      }

      async function renderExecutionPlan(index: number, p: Table){

        var accounting = await vault.connect(vaultAdmin as Signer).executionAccountingResult(index);  
        var currentRound = await vault.currentRound();
        const pairId = Math.floor(index/3);
        var pair = optionPairs[pairId]; 
        if (!pair){   
          return;
        } 
        var newDepositAssetAmount = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount, pair.depositAssetAmountDecimals);
        var newCounterPartyAssetAmount = ethers.utils.formatUnits(accounting.putOptionResult.depositAmount, pair.counterPartyAssetAmountDecimals);
        var maturedCallOptionState = await vault.getOptionStateByRound(pair.callOptionId, currentRound - 2);
        var maturedPutOptionState = await vault.getOptionStateByRound(pair.putOptionId, currentRound- 2);
        var callStrikePrice = ethers.utils.formatUnits(maturedCallOptionState.strikePrice, StrikePriceDecimals);
        var putStrikePrice = ethers.utils.formatUnits(maturedPutOptionState.strikePrice, StrikePriceDecimals);
 
  
       var callAssetAutoRoll =accounting.callOptionResult.autoRollAmount.add(accounting.callOptionResult.autoRollPremium)
        .add(accounting.putOptionResult.autoRollCounterPartyAmount).add(accounting.putOptionResult.autoRollCounterPartyPremium);
        var putAssetAutoRull = accounting.callOptionResult.autoRollCounterPartyAmount.add(accounting.callOptionResult.autoRollCounterPartyPremium)
        .add(accounting.putOptionResult.autoRollAmount).add(accounting.putOptionResult.autoRollPremium);
        
        var callAssetReleased =  accounting.callOptionResult.releasedAmount.add(accounting.callOptionResult.releasedPremium)
        .add(accounting.putOptionResult.releasedCounterPartyAmount).add(accounting.putOptionResult.releasedCounterPartyPremium);
  
        
        var putAssetReleased = accounting.callOptionResult.releasedCounterPartyAmount.add(accounting.callOptionResult.releasedCounterPartyPremium)
        .add(accounting.putOptionResult.releasedAmount).add(accounting.putOptionResult.releasedPremium);

        var depositDebt = ethers.utils.formatUnits(accounting.callOptionResult.depositAmount.add(callAssetAutoRoll), 
        pair.depositAssetAmountDecimals);
        var depositAutoRoll = ethers.utils.formatUnits(callAssetAutoRoll, pair.depositAssetAmountDecimals);
        var counterPartyDebt =  ethers.utils.formatUnits(accounting.putOptionResult.depositAmount.add(putAssetAutoRull),
        pair.counterPartyAssetAmountDecimals);

        var counterPartyAutoRoll = ethers.utils.formatUnits(putAssetAutoRull, pair.counterPartyAssetAmountDecimals);

        var callAssetReleasedStr = ethers.utils.formatUnits(callAssetReleased, pair.depositAssetAmountDecimals);
        var putAssetReleasedStr = ethers.utils.formatUnits(putAssetReleased, pair.counterPartyAssetAmountDecimals);

        var decision = "";
        if (accounting.execute == OptionExecution.NoExecution){
          decision = "No Exe";
        }
        else if (accounting.execute == OptionExecution.ExecuteCall){
          decision = "Exe Call";
        }
        else{
  
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

  
